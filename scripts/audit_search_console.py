#!/usr/bin/env python3
"""公開サイトの sitemap・canonical・noindex・内部リンクを軽量監査する。"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET


DEFAULT_BASE_URL = "https://goma-dango-matcha.github.io/gomatools/"
USER_AGENT = "GomaToolsSearchConsoleAudit/1.0"
LOCAL_HTML_EXCLUSIONS = {
    # Google Search Consoleの所有権確認用ファイルで、コンテンツページではない。
    "google48cd6df4241f7a6b.html",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.canonicals: list[str] = []
        self.robots: list[str] = []
        self.h1_count = 0
        self.ids: list[tuple[str, int]] = []
        self.json_ld_blocks: list[tuple[int, str]] = []
        self._json_ld_line: int | None = None
        self._json_ld_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        line, _ = self.getpos()
        if tag == "h1":
            self.h1_count += 1
        if "id" in values:
            self.ids.append((values["id"], line))
        if tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._json_ld_line = line
            self._json_ld_parts = []
        if tag == "a" and values.get("href"):
            self.links.append(values["href"])
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonicals.append(values.get("href", ""))
        elif tag == "meta" and values.get("name", "").lower() in {"robots", "googlebot"}:
            self.robots.append(values.get("content", ""))

    def handle_data(self, data: str) -> None:
        if self._json_ld_parts is not None:
            self._json_ld_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "script" or self._json_ld_parts is None:
            return
        self.json_ld_blocks.append((self._json_ld_line or 0, "".join(self._json_ld_parts)))
        self._json_ld_line = None
        self._json_ld_parts = None


def fetch(url: str, timeout: int, user_agent: str = USER_AGENT) -> tuple[int, str, object, bytes]:
    request = Request(url, headers={"User-Agent": user_agent})
    try:
        with urlopen(request, timeout=timeout) as response:
            return response.status, response.geturl(), response.headers, response.read()
    except HTTPError as error:
        return error.code, error.geturl(), error.headers, error.read()
    except URLError as error:
        raise RuntimeError(f"取得失敗: {url}: {error.reason}") from error


def parse_html(body: bytes) -> PageParser:
    parser = PageParser()
    parser.feed(body.decode("utf-8", errors="replace"))
    return parser


def local_path_for_url(repo: Path, base_url: str, url: str) -> Path | None:
    base = urlparse(base_url)
    target = urlparse(url)
    if target.netloc != base.netloc or not target.path.startswith(base.path):
        return None
    relative = target.path[len(base.path) :]
    if not relative or relative.endswith("/"):
        relative += "index.html"
    return repo / relative


def normalize_page_url(url: str) -> str:
    parsed = urlparse(url)
    return parsed._replace(query="", fragment="").geturl()


def local_url_for_path(repo: Path, base_url: str, path: Path) -> str:
    relative = path.relative_to(repo).as_posix()
    if relative == "index.html":
        return base_url
    if relative.endswith("/index.html"):
        relative = relative[: -len("index.html")]
    return urljoin(base_url, relative)


def display_local_path(repo: Path, path: Path) -> str:
    return path.relative_to(repo).as_posix()


def is_local_html_excluded(repo: Path, path: Path, page: PageParser) -> bool:
    relative = display_local_path(repo, path)
    if relative in LOCAL_HTML_EXCLUSIONS:
        return True
    if relative.startswith("docs/internal/"):
        return True
    return any("noindex" in directive.lower() for directive in page.robots)


def audit_local_structure(repo: Path, base_url: str, problems: list[str]) -> dict[str, int]:
    repo = repo.resolve()
    summary = {
        "sitemap_urls": 0,
        "html_files": 0,
        "h1_pages": 0,
        "id_pages": 0,
        "json_ld_blocks": 0,
        "sitemap_file_errors": 0,
        "h1_errors": 0,
        "duplicate_id_errors": 0,
        "json_ld_errors": 0,
    }
    sitemap_path = repo / "sitemap.xml"
    try:
        root = ET.fromstring(sitemap_path.read_bytes())
    except (OSError, ET.ParseError) as error:
        summary["sitemap_file_errors"] += 1
        problems.append(f"SITEMAP_FILE_MISMATCH: ローカルsitemap解析失敗: {error}")
        return summary

    namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    if root.tag != namespace + "urlset":
        summary["sitemap_file_errors"] += 1
        problems.append(f"SITEMAP_FILE_MISMATCH: ローカルsitemapルート要素: {root.tag}")
    sitemap_urls = [(node.text or "").strip() for node in root.findall(f"{namespace}url/{namespace}loc")]
    summary["sitemap_urls"] = len(sitemap_urls)
    if not all(sitemap_urls):
        summary["sitemap_file_errors"] += 1
        problems.append("SITEMAP_FILE_MISMATCH: ローカルsitemapに空のlocがある")
    duplicates = [url for url, count in Counter(sitemap_urls).items() if count > 1]
    for url in duplicates:
        summary["sitemap_file_errors"] += 1
        problems.append(f"SITEMAP_FILE_MISMATCH: ローカルsitemap重複URL: {url}")

    sitemap_paths: set[Path] = set()
    for url in sitemap_urls:
        local_path = local_path_for_url(repo, base_url, url)
        if local_path is None or not local_path.is_file():
            summary["sitemap_file_errors"] += 1
            problems.append(f"SITEMAP_FILE_MISMATCH: 対応ファイルなし: {url}")
            continue
        sitemap_paths.add(local_path.resolve())

    public_pages: dict[Path, PageParser] = {}
    for path in repo.rglob("*.html"):
        if ".git" in path.parts:
            continue
        page = parse_html(path.read_bytes())
        if is_local_html_excluded(repo, path, page):
            continue
        public_pages[path.resolve()] = page

    summary["html_files"] = len(public_pages)
    for path in sorted(public_pages, key=lambda item: item.as_posix()):
        if path in sitemap_paths:
            continue
        summary["sitemap_file_errors"] += 1
        problems.append(
            "SITEMAP_FILE_MISMATCH: sitemap未掲載: "
            f"{display_local_path(repo, path)} -> {local_url_for_path(repo, base_url, path)}"
        )

    for path, page in sorted(public_pages.items(), key=lambda item: item[0].as_posix()):
        relative = display_local_path(repo, path)
        summary["h1_pages"] += 1
        if page.h1_count != 1:
            summary["h1_errors"] += 1
            problems.append(f"H1_COUNT: {relative}: expected=1 actual={page.h1_count}")

        summary["id_pages"] += 1
        id_lines: dict[str, list[int]] = {}
        for element_id, line in page.ids:
            id_lines.setdefault(element_id, []).append(line)
        for element_id, lines in sorted(id_lines.items()):
            if len(lines) < 2:
                continue
            summary["duplicate_id_errors"] += 1
            problems.append(
                f"DUPLICATE_ID: {relative}: id={element_id} count={len(lines)} "
                f"lines={','.join(str(line) for line in lines)}"
            )

        summary["json_ld_blocks"] += len(page.json_ld_blocks)
        for block_number, (line, payload) in enumerate(page.json_ld_blocks, start=1):
            try:
                json.loads(payload)
            except json.JSONDecodeError as error:
                summary["json_ld_errors"] += 1
                problems.append(
                    f"JSON_LD_PARSE: {relative}: block={block_number} line={line}: "
                    f"{error.msg} (JSON line {error.lineno}, column {error.colno})"
                )

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/") + "/"
    sitemap_url = urljoin(base_url, "sitemap.xml")
    robots_url = urljoin(base_url, "robots.txt")
    problems: list[str] = []
    warnings: list[str] = []
    local_summary = audit_local_structure(args.repo, base_url, problems)

    sitemap_status, sitemap_final, sitemap_headers, sitemap_body = fetch(sitemap_url, args.timeout)
    sitemap_type = sitemap_headers.get_content_type()
    print(f"sitemap: {sitemap_status} {sitemap_type} {sitemap_final}")
    if sitemap_status != 200:
        problems.append(f"sitemap HTTP {sitemap_status}")
    if sitemap_type not in {"application/xml", "text/xml"}:
        problems.append(f"sitemap Content-Type: {sitemap_type}")

    try:
        root = ET.fromstring(sitemap_body)
    except ET.ParseError as error:
        print(f"ERROR: sitemap XML解析失敗: {error}")
        return 1

    namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    if root.tag != namespace + "urlset":
        problems.append(f"sitemapルート要素: {root.tag}")
    urls = [(node.text or "").strip() for node in root.findall(f"{namespace}url/{namespace}loc")]
    duplicates = [url for url, count in Counter(urls).items() if count > 1]
    if not all(urls):
        problems.append("空のlocがある")
    if duplicates:
        problems.append(f"重複URL {len(duplicates)}件")
    print(f"sitemap URLs: {len(urls)}（重複 {len(duplicates)}）")

    url_set = set(urls)
    status_counts: Counter[int] = Counter()
    noindex_count = 0
    canonical_mismatches = 0
    missing_canonicals = 0
    missing_local = 0
    page_parsers: dict[str, PageParser] = {}

    for url in urls:
        if not url.startswith(base_url):
            problems.append(f"ベースパス不一致: {url}")
        status, final_url, headers, body = fetch(url, args.timeout)
        status_counts[status] += 1
        if status != 200:
            problems.append(f"HTTP {status}: {url}")
            continue
        if normalize_page_url(final_url) != normalize_page_url(url):
            problems.append(f"リダイレクト: {url} -> {final_url}")
        if "noindex" in headers.get("X-Robots-Tag", "").lower():
            noindex_count += 1
            problems.append(f"X-Robots-Tag noindex: {url}")
        page = parse_html(body)
        page_parsers[url] = page
        if any("noindex" in directive.lower() for directive in page.robots):
            noindex_count += 1
            problems.append(f"meta noindex: {url}")
        if not page.canonicals:
            missing_canonicals += 1
            problems.append(f"canonicalなし: {url}")
        elif normalize_page_url(page.canonicals[0]) != normalize_page_url(url):
            canonical_mismatches += 1
            problems.append(f"canonical不一致: {url} -> {page.canonicals[0]}")
        local_path = local_path_for_url(args.repo, base_url, url)
        if local_path is None or not local_path.is_file():
            missing_local += 1
            warnings.append(f"ローカル対応ファイルなし: {url}")

    robots_status, robots_final, robots_headers, robots_body = fetch(robots_url, args.timeout)
    robots_text = robots_body.decode("utf-8", errors="replace")
    print(f"robots: {robots_status} {robots_headers.get_content_type()} {robots_final}")
    if robots_status != 200:
        problems.append(f"robots HTTP {robots_status}")
    if any(line.strip().lower() == "disallow: /" for line in robots_text.splitlines()):
        problems.append("robots.txtに全体拒否がある")
    if f"Sitemap: {sitemap_url}" not in robots_text:
        warnings.append("robots.txtのSitemap行が完全URLと一致しない")

    graph: dict[str, set[str]] = {url: set() for url in urls}
    for source, page in page_parsers.items():
        for href in page.links:
            target = normalize_page_url(urljoin(source, href))
            if target in url_set:
                graph[source].add(target)
    reached = {base_url} if base_url in graph else set()
    queue = deque(reached)
    while queue:
        for target in graph.get(queue.popleft(), set()):
            if target not in reached:
                reached.add(target)
                queue.append(target)
    unreachable = sorted(url_set - reached)
    if unreachable:
        problems.append(f"ホームから静的リンクで到達不能: {len(unreachable)}件")

    print(f"HTTP: {dict(sorted(status_counts.items()))}")
    print(f"noindex: {noindex_count}")
    print(f"canonical不一致: {canonical_mismatches}（欠落 {missing_canonicals}）")
    print(f"ローカル対応ファイルなし: {missing_local}")
    print(f"ホームから静的リンクで到達: {len(reached)}/{len(url_set)}")
    print(
        "Sitemap/file consistency:",
        "PASS" if local_summary["sitemap_file_errors"] == 0 else "FAIL",
        f"（sitemap {local_summary['sitemap_urls']} URL / HTML {local_summary['html_files']}ファイル）",
    )
    print(
        "H1 count:",
        "PASS" if local_summary["h1_errors"] == 0 else "FAIL",
        f"（{local_summary['h1_pages']}ページ）",
    )
    print(
        "Duplicate IDs:",
        "PASS" if local_summary["duplicate_id_errors"] == 0 else "FAIL",
        f"（{local_summary['id_pages']}ページ）",
    )
    print(
        "JSON-LD syntax:",
        "PASS" if local_summary["json_ld_errors"] == 0 else "FAIL",
        f"（{local_summary['json_ld_blocks']}ブロック）",
    )

    for warning in warnings:
        print(f"WARN: {warning}")
    for problem in problems:
        print(f"ERROR: {problem}")
    print("判定:", "PASS" if not problems else "FAIL")
    return 0 if not problems else 1


if __name__ == "__main__":
    sys.exit(main())
