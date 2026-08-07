#!/usr/bin/env python3
"""公開サイトの sitemap・canonical・noindex・内部リンクを軽量監査する。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, deque
from dataclasses import dataclass, field
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


@dataclass
class ToolRegistryData:
    urls_by_category: dict[str, list[str]] = field(default_factory=dict)


@dataclass
class ToolCategoryData:
    name: str
    anchor: str
    displayed_count: int | None
    urls: list[str]


class AllToolsParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.categories: list[ToolCategoryData] = []
        self.total_text_parts: list[str] = []
        self._current: dict[str, object] | None = None
        self._section_depth = 0
        self._in_heading = False
        self._in_heading_count = False
        self._in_total = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        tag = tag.lower()
        if self._current is not None and tag == "section":
            self._section_depth += 1
        elif tag == "section" and "all-tools-category" in classes:
            self._current = {
                "name_parts": [],
                "count_parts": [],
                "anchor": "",
                "urls": [],
            }
            self._section_depth = 1
        if self._current is not None and tag == "h3":
            self._in_heading = True
            self._current["anchor"] = values.get("id", "")
        elif self._in_heading and tag == "span":
            self._in_heading_count = True
        if self._current is not None and tag == "a" and values.get("href"):
            urls = self._current["urls"]
            assert isinstance(urls, list)
            urls.append(values["href"])
        if tag == "p" and "all-tools-eyebrow" in classes:
            self._in_total = True

    def handle_data(self, data: str) -> None:
        if self._in_total:
            self.total_text_parts.append(data)
        if not self._in_heading or self._current is None:
            return
        key = "count_parts" if self._in_heading_count else "name_parts"
        parts = self._current[key]
        assert isinstance(parts, list)
        parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "span" and self._in_heading_count:
            self._in_heading_count = False
        elif tag == "h3" and self._in_heading:
            self._in_heading = False
        if tag == "p" and self._in_total:
            self._in_total = False
        if tag != "section" or self._current is None:
            return
        self._section_depth -= 1
        if self._section_depth:
            return
        count_text = " ".join(self._current["count_parts"])
        count_match = re.search(r"\d+", count_text)
        self.categories.append(
            ToolCategoryData(
                name=" ".join(self._current["name_parts"]).strip(),
                anchor=str(self._current["anchor"]),
                displayed_count=int(count_match.group()) if count_match else None,
                urls=list(self._current["urls"]),
            )
        )
        self._current = None


@dataclass
class HomeCategoryData:
    name: str
    href: str
    displayed_count: int | None


class HomeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.categories: list[HomeCategoryData] = []
        self.visible_text_parts: list[str] = []
        self._current: dict[str, object] | None = None
        self._in_name = 0
        self._in_count = 0
        self._skip_text = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        tag = tag.lower()
        if tag in {"script", "style"}:
            self._skip_text += 1
        if tag == "a" and "category-link" in classes:
            self._current = {
                "name_parts": [],
                "count_parts": [],
                "href": values.get("href", ""),
            }
        if self._current is None or tag != "span":
            return
        if self._in_name:
            self._in_name += 1
        if self._in_count:
            self._in_count += 1
        if "category-name" in classes:
            self._in_name = 1
        if "category-count" in classes:
            self._in_count = 1

    def handle_data(self, data: str) -> None:
        if not self._skip_text and data.strip():
            self.visible_text_parts.append(data.strip())
        if self._current is None:
            return
        if self._in_count:
            parts = self._current["count_parts"]
            assert isinstance(parts, list)
            parts.append(data)
        elif self._in_name:
            parts = self._current["name_parts"]
            assert isinstance(parts, list)
            parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style"} and self._skip_text:
            self._skip_text -= 1
        if tag == "span":
            if self._in_count:
                self._in_count -= 1
            if self._in_name:
                self._in_name -= 1
        if tag != "a" or self._current is None:
            return
        count_text = " ".join(self._current["count_parts"])
        count_match = re.search(r"\d+", count_text)
        self.categories.append(
            HomeCategoryData(
                name=" ".join(self._current["name_parts"]).strip(),
                href=str(self._current["href"]),
                displayed_count=int(count_match.group()) if count_match else None,
            )
        )
        self._current = None
        self._in_name = 0
        self._in_count = 0


class KnowledgeIndexParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.published_card_links: list[list[str]] = []
        self._current_links: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        tag = tag.lower()
        if tag == "article" and "knowledge-card" in classes:
            self._current_links = [] if values.get("data-status") == "published" else None
        elif tag == "a" and self._current_links is not None and values.get("href"):
            self._current_links.append(values["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "article" and self._current_links is not None:
            self.published_card_links.append(self._current_links)
            self._current_links = None


class ReferenceIndexParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        if tag.lower() == "a" and "reference-card" in classes and values.get("href"):
            self.links.append(values["href"])


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


def normalize_content_url(base_url: str, url: str, source_url: str | None = None) -> str:
    normalized = normalize_page_url(urljoin(source_url or base_url, url))
    parsed = urlparse(normalized)
    path = parsed.path
    if path.endswith("/index.html"):
        path = path[: -len("index.html")]
    return parsed._replace(path=path).geturl()


def parse_with(parser: HTMLParser, path: Path) -> HTMLParser:
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def parse_tool_registry(
    path: Path,
    base_url: str,
    warnings: list[str],
) -> ToolRegistryData | None:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as error:
        warnings.append(f"TOOL_REGISTRY_PARSE_FAILED: 読み込み失敗: {error}")
        return None

    current_category = ""
    header: list[str] | None = None
    data = ToolRegistryData()
    malformed_rows = 0
    for raw_line in lines:
        line = raw_line.strip()
        if line.startswith("## "):
            current_category = line[3:].strip()
            header = None
            continue
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if "URL" in cells and "公開状態" in cells:
            header = cells
            continue
        if header is None or all(set(cell) <= {"-", ":"} for cell in cells if cell):
            continue
        if len(cells) != len(header):
            malformed_rows += 1
            continue
        row = dict(zip(header, cells))
        if row.get("公開状態") != "公開":
            continue
        url = row.get("URL", "")
        if not current_category or not url:
            malformed_rows += 1
            continue
        data.urls_by_category.setdefault(current_category, []).append(
            normalize_content_url(base_url, url)
        )

    if malformed_rows:
        warnings.append(
            f"TOOL_REGISTRY_PARSE_WARNING: 公開行として解析できない候補 {malformed_rows}件"
        )
        return None
    if not data.urls_by_category or not any(data.urls_by_category.values()):
        warnings.append("TOOL_REGISTRY_PARSE_FAILED: 公開ツール行を取得できない")
        return None
    return data


def match_category_name(raw_name: str, expected_names: set[str]) -> str | None:
    candidates = [name for name in expected_names if name in raw_name]
    return candidates[0] if len(candidates) == 1 else None


def duplicate_values(values: list[str]) -> list[str]:
    return sorted(value for value, count in Counter(values).items() if count > 1)


def append_url_set_difference(
    code: str,
    expected_label: str,
    expected: set[str],
    actual_label: str,
    actual: set[str],
    problems: list[str],
) -> bool:
    if expected == actual:
        return False
    lines = [
        f"{code}: {expected_label}={len(expected)} {actual_label}={len(actual)}"
    ]
    missing = sorted(expected - actual)
    unexpected = sorted(actual - expected)
    if missing:
        lines.append(f"missing from {actual_label}: " + ", ".join(missing))
    if unexpected:
        lines.append(f"unexpected in {actual_label}: " + ", ".join(unexpected))
    problems.append("\n  ".join(lines))
    return True


def sitemap_urls_for_section(
    sitemap_urls: set[str],
    base_url: str,
    section: str,
) -> set[str]:
    prefix = urljoin(base_url, section.rstrip("/") + "/")
    return {
        normalize_content_url(base_url, url)
        for url in sitemap_urls
        if normalize_content_url(base_url, url).startswith(prefix)
        and normalize_content_url(base_url, url) != prefix
    }


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


def audit_local_structure(repo: Path, base_url: str, problems: list[str]) -> dict[str, object]:
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
        "sitemap_url_list": [],
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
    summary["sitemap_url_list"] = sitemap_urls
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


def audit_public_content_counts(
    repo: Path,
    base_url: str,
    local_summary: dict[str, object],
    problems: list[str],
    warnings: list[str],
) -> None:
    repo = repo.resolve()
    group_errors: Counter[str] = Counter()
    group_warnings: Counter[str] = Counter()

    def error(group: str, code: str, message: str) -> None:
        group_errors[group] += 1
        problems.append(f"{code}: {message}")

    def warn(group: str, code: str, message: str) -> None:
        group_warnings[group] += 1
        warnings.append(f"{code}: {message}")

    def status(group: str) -> str:
        if group_errors[group]:
            return "FAIL"
        if group_warnings[group]:
            return "WARN"
        return "PASS"

    sitemap_file_errors = local_summary.get("sitemap_file_errors")
    if isinstance(sitemap_file_errors, int) and sitemap_file_errors:
        group_errors["sitemap"] += sitemap_file_errors

    content_warning_start = len(warnings)
    registry = parse_tool_registry(repo / "docs/internal/tool-registry.md", base_url, warnings)
    if len(warnings) > content_warning_start:
        group_warnings["tools"] += len(warnings) - content_warning_start

    sitemap_list = local_summary.get("sitemap_url_list", [])
    if not isinstance(sitemap_list, list) or not sitemap_list:
        warn("sitemap", "PUBLIC_SITEMAP_PARSE_FAILED", "ローカルsitemap URL集合を取得できない")
        sitemap_urls: set[str] | None = None
    else:
        sitemap_urls = {
            normalize_content_url(base_url, url)
            for url in sitemap_list
            if isinstance(url, str) and url
        }

    if sitemap_urls is None:
        warn("tools", "TOOL_SITEMAP_COMPARISON_SKIPPED", "sitemap URL集合を取得できない")
        warn("knowledge", "KNOWLEDGE_SITEMAP_COMPARISON_SKIPPED", "sitemap URL集合を取得できない")
        warn("reference", "REFERENCE_SITEMAP_COMPARISON_SKIPPED", "sitemap URL集合を取得できない")

    all_tools: AllToolsParser | None = None
    try:
        parsed = parse_with(AllToolsParser(), repo / "all-tools/index.html")
        assert isinstance(parsed, AllToolsParser)
        if not parsed.categories:
            warn("tools", "ALL_TOOLS_PARSE_FAILED", "カテゴリを取得できない")
        else:
            all_tools = parsed
    except (OSError, AssertionError) as exc:
        warn("tools", "ALL_TOOLS_PARSE_FAILED", str(exc))

    home: HomeParser | None = None
    try:
        parsed = parse_with(HomeParser(), repo / "index.html")
        assert isinstance(parsed, HomeParser)
        if not parsed.categories:
            warn("tools", "HOMEPAGE_COUNT_PARSE_FAILED", "カテゴリ表示を取得できない")
        else:
            home = parsed
    except (OSError, AssertionError) as exc:
        warn("tools", "HOMEPAGE_COUNT_PARSE_FAILED", str(exc))
    if home is None:
        warn("knowledge", "HOMEPAGE_KNOWLEDGE_COUNT_SKIPPED", "ホームを解析できない")

    registry_counts: Counter[str] = Counter()
    registry_urls: set[str] | None = None
    registry_category_by_url: dict[str, str] = {}
    if registry is not None:
        registry_values = [
            url
            for urls in registry.urls_by_category.values()
            for url in urls
        ]
        for duplicate in duplicate_values(registry_values):
            warn("tools", "TOOL_REGISTRY_DUPLICATE_URL", duplicate)
        registry_urls = set(registry_values)
        registry_counts = Counter(
            {
                category: len(urls)
                for category, urls in registry.urls_by_category.items()
            }
        )
        for category, urls in registry.urls_by_category.items():
            for url in urls:
                registry_category_by_url.setdefault(url, category)

    all_tools_counts: Counter[str] = Counter()
    all_tools_urls: set[str] | None = None
    all_tools_category_by_url: dict[str, str] = {}
    all_tools_display_total: int | None = None
    if all_tools is not None and registry is not None:
        expected_categories = set(registry.urls_by_category)
        all_tools_values: list[str] = []
        seen_categories: set[str] = set()
        all_tools_structure_valid = True
        for item in all_tools.categories:
            category = match_category_name(item.name, expected_categories)
            if category is None:
                all_tools_structure_valid = False
                warn(
                    "tools",
                    "ALL_TOOLS_CATEGORY_PARSE_FAILED",
                    f"カテゴリ名を特定できない: {item.name or item.anchor}",
                )
                continue
            if category in seen_categories:
                all_tools_structure_valid = False
                warn("tools", "ALL_TOOLS_DUPLICATE_CATEGORY", category)
            seen_categories.add(category)
            urls = [
                normalize_content_url(base_url, href, urljoin(base_url, "all-tools/"))
                for href in item.urls
            ]
            all_tools_values.extend(urls)
            all_tools_counts[category] += len(urls)
            for url in urls:
                all_tools_category_by_url.setdefault(url, category)
            if item.displayed_count is None:
                warn("tools", "ALL_TOOLS_CATEGORY_COUNT_PARSE_FAILED", category)
            elif item.displayed_count != len(urls):
                error(
                    "tools",
                    "ALL_TOOLS_CATEGORY_DISPLAY_MISMATCH",
                    f"{category}: displayed={item.displayed_count} links={len(urls)}",
                )
        all_tools_duplicates = duplicate_values(all_tools_values)
        for duplicate in all_tools_duplicates:
            warn("tools", "ALL_TOOLS_DUPLICATE_URL", duplicate)
        if all_tools_duplicates:
            all_tools_structure_valid = False
        if all_tools_structure_valid:
            all_tools_urls = set(all_tools_values)
            before = len(problems)
            append_url_set_difference(
                "TOOL_URL_SET_MISMATCH",
                "registry",
                registry_urls or set(),
                "all-tools",
                all_tools_urls,
                problems,
            )
            group_errors["tools"] += len(problems) - before
            for url in sorted((registry_urls or set()) & all_tools_urls):
                expected_category = registry_category_by_url.get(url)
                actual_category = all_tools_category_by_url.get(url)
                if expected_category != actual_category:
                    error(
                        "tools",
                        "TOOL_CATEGORY_MISMATCH",
                        f"{url}: registry={expected_category} all-tools={actual_category}",
                    )
            for category in sorted(set(registry_counts) | set(all_tools_counts)):
                if registry_counts[category] != all_tools_counts[category]:
                    error(
                        "tools",
                        "TOOL_CATEGORY_COUNT_MISMATCH",
                        f"{category}: registry={registry_counts[category]} all-tools={all_tools_counts[category]}",
                    )
        total_text = " ".join(all_tools.total_text_parts)
        total_match = re.search(r"公開中\s*(\d+)\s*ツール", total_text)
        if total_match:
            all_tools_display_total = int(total_match.group(1))
            if all_tools_structure_valid and all_tools_display_total != len(all_tools_values):
                error(
                    "tools",
                    "ALL_TOOLS_TOTAL_DISPLAY_MISMATCH",
                    f"displayed={all_tools_display_total} links={len(all_tools_values)}",
                )
        else:
            warn("tools", "ALL_TOOLS_TOTAL_COUNT_PARSE_FAILED", "総件数表示を取得できない")

    home_counts: Counter[str] = Counter()
    home_tool_totals: list[int] = []
    home_knowledge_count: int | None = None
    if home is not None:
        visible_text = " ".join(home.visible_text_parts)
        total_patterns = [
            r"公開中の\s*(\d+)\s*ツール",
            r"(\d+)\s*ツールをすべて見る",
            r"公開中\s*(\d+)\s*ツール",
        ]
        for pattern in total_patterns:
            home_tool_totals.extend(int(value) for value in re.findall(pattern, visible_text))
        if not home_tool_totals:
            warn("tools", "HOMEPAGE_TOOL_COUNT_PARSE_FAILED", "総件数表示を取得できない")
        knowledge_matches = re.findall(r"ゴマ知識\s*(\d+)\s*記事", visible_text)
        if len(knowledge_matches) == 1:
            home_knowledge_count = int(knowledge_matches[0])
        elif not knowledge_matches:
            warn("knowledge", "HOMEPAGE_KNOWLEDGE_COUNT_PARSE_FAILED", "記事数表示を取得できない")
        else:
            warn(
                "knowledge",
                "HOMEPAGE_KNOWLEDGE_COUNT_AMBIGUOUS",
                f"候補={','.join(knowledge_matches)}",
            )

    if home is not None and registry is not None:
        expected_categories = set(registry.urls_by_category)
        seen_home_categories: set[str] = set()
        home_category_structure_valid = True
        for item in home.categories:
            category = match_category_name(item.name, expected_categories)
            if category is None:
                home_category_structure_valid = False
                warn(
                    "tools",
                    "HOMEPAGE_CATEGORY_PARSE_FAILED",
                    f"カテゴリ名を特定できない: {item.name or item.href}",
                )
                continue
            if category in seen_home_categories:
                home_category_structure_valid = False
                warn("tools", "HOMEPAGE_DUPLICATE_CATEGORY", category)
            seen_home_categories.add(category)
            if item.displayed_count is None:
                home_category_structure_valid = False
                warn("tools", "HOMEPAGE_CATEGORY_COUNT_PARSE_FAILED", category)
                continue
            home_counts[category] = item.displayed_count
        if home_category_structure_valid:
            for category in sorted(set(registry_counts) | set(home_counts)):
                if category not in home_counts:
                    error("tools", "HOMEPAGE_CATEGORY_MISSING", category)
                elif registry_counts[category] != home_counts[category]:
                    error(
                        "tools",
                        "HOMEPAGE_CATEGORY_COUNT_MISMATCH",
                        f"{category}: registry={registry_counts[category]} homepage={home_counts[category]}",
                    )

        for displayed in home_tool_totals:
            if displayed != len(registry_urls or set()):
                error(
                    "tools",
                    "HOMEPAGE_TOOL_COUNT_MISMATCH",
                    f"registry={len(registry_urls or set())} homepage={displayed}",
                )
    if registry_urls is not None and sitemap_urls is not None:
        missing_from_sitemap = sorted(registry_urls - sitemap_urls)
        if missing_from_sitemap:
            error(
                "tools",
                "TOOL_SITEMAP_MISSING",
                ", ".join(missing_from_sitemap),
            )
    if registry_urls is not None:
        missing_files = [
            url
            for url in sorted(registry_urls)
            if (path := local_path_for_url(repo, base_url, url)) is None or not path.is_file()
        ]
        if missing_files:
            error("tools", "TOOL_LOCAL_FILE_MISSING", ", ".join(missing_files))

    knowledge_count: int | None = None
    knowledge_sitemap_count: int | None = None
    try:
        parsed = parse_with(KnowledgeIndexParser(), repo / "knowledge.html")
        assert isinstance(parsed, KnowledgeIndexParser)
        malformed_cards = [links for links in parsed.published_card_links if len(links) != 1]
        if not parsed.published_card_links:
            warn("knowledge", "KNOWLEDGE_INDEX_PARSE_FAILED", "公開カードを取得できない")
        elif malformed_cards:
            warn(
                "knowledge",
                "KNOWLEDGE_CARD_PARSE_FAILED",
                f"リンクが1件ではない公開カード {len(malformed_cards)}件",
            )
        else:
            knowledge_values = [
                normalize_content_url(base_url, links[0], urljoin(base_url, "knowledge.html"))
                for links in parsed.published_card_links
            ]
            for duplicate in duplicate_values(knowledge_values):
                warn("knowledge", "KNOWLEDGE_INDEX_DUPLICATE_URL", duplicate)
            knowledge_urls = set(knowledge_values)
            knowledge_count = len(knowledge_urls)
            if sitemap_urls is not None:
                knowledge_sitemap_urls = sitemap_urls_for_section(
                    sitemap_urls, base_url, "knowledge"
                )
                knowledge_sitemap_count = len(knowledge_sitemap_urls)
                before = len(problems)
                append_url_set_difference(
                    "KNOWLEDGE_URL_SET_MISMATCH",
                    "knowledge-index",
                    knowledge_urls,
                    "sitemap",
                    knowledge_sitemap_urls,
                    problems,
                )
                group_errors["knowledge"] += len(problems) - before
            if home_knowledge_count is not None and home_knowledge_count != knowledge_count:
                error(
                    "knowledge",
                    "HOMEPAGE_KNOWLEDGE_COUNT_MISMATCH",
                    f"knowledge-index={knowledge_count} homepage={home_knowledge_count}",
                )
    except (OSError, AssertionError) as exc:
        warn("knowledge", "KNOWLEDGE_INDEX_PARSE_FAILED", str(exc))

    reference_count: int | None = None
    reference_sitemap_count: int | None = None
    try:
        parsed = parse_with(ReferenceIndexParser(), repo / "quick-reference/index.html")
        assert isinstance(parsed, ReferenceIndexParser)
        if not parsed.links:
            warn("reference", "REFERENCE_INDEX_PARSE_FAILED", "個別カードを取得できない")
        else:
            reference_values = [
                normalize_content_url(
                    base_url, href, urljoin(base_url, "quick-reference/")
                )
                for href in parsed.links
            ]
            for duplicate in duplicate_values(reference_values):
                warn("reference", "REFERENCE_INDEX_DUPLICATE_URL", duplicate)
            reference_urls = set(reference_values)
            reference_count = len(reference_urls)
            if sitemap_urls is not None:
                reference_sitemap_urls = sitemap_urls_for_section(
                    sitemap_urls, base_url, "quick-reference"
                )
                reference_sitemap_count = len(reference_sitemap_urls)
                before = len(problems)
                append_url_set_difference(
                    "REFERENCE_URL_SET_MISMATCH",
                    "reference-index",
                    reference_urls,
                    "sitemap",
                    reference_sitemap_urls,
                    problems,
                )
                group_errors["reference"] += len(problems) - before
    except (OSError, AssertionError) as exc:
        warn("reference", "REFERENCE_INDEX_PARSE_FAILED", str(exc))

    def display_value(value: object) -> str:
        return "unavailable" if value is None else str(value)

    home_total_display: object = None
    if home_tool_totals:
        unique_totals = sorted(set(home_tool_totals))
        home_total_display = unique_totals[0] if len(unique_totals) == 1 else "/".join(map(str, unique_totals))

    print("Public content counts")
    print("Tools")
    print(f"  registry: {display_value(len(registry_urls) if registry_urls is not None else None)}")
    print(f"  all-tools: {display_value(len(all_tools_urls) if all_tools_urls is not None else None)}")
    print(f"  homepage: {display_value(home_total_display)}")
    print(f"  status: {status('tools')}")
    print("Tool categories")
    for category in registry_counts:
        print(
            f"  {category}: registry {registry_counts[category]} / "
            f"all-tools {display_value(all_tools_counts.get(category) if all_tools_urls is not None else None)} / "
            f"homepage {display_value(home_counts.get(category) if home is not None else None)}"
        )
    print(f"  status: {status('tools')}")
    print("Knowledge")
    print(f"  index cards: {display_value(knowledge_count)}")
    print(f"  sitemap urls: {display_value(knowledge_sitemap_count)}")
    print(f"  homepage: {display_value(home_knowledge_count)}")
    print(f"  status: {status('knowledge')}")
    print("Reference tables")
    print(f"  index cards: {display_value(reference_count)}")
    print(f"  sitemap individual urls: {display_value(reference_sitemap_count)}")
    print(f"  status: {status('reference')}")
    print("Sitemap")
    print(f"  urls: {display_value(len(sitemap_urls) if sitemap_urls is not None else None)}")
    print(
        "  file consistency:",
        "PASS" if local_summary.get("sitemap_file_errors") == 0 else "FAIL",
    )
    print(f"  status: {status('sitemap')}")


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
    audit_public_content_counts(args.repo, base_url, local_summary, problems, warnings)

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
