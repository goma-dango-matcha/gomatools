# Search Consoleサイトマップ取得失敗・インデックス停滞 技術監査記録

Version 1.0  
監査日：2026-07-19

> このドキュメントはゴマツール開発・運営専用の内部資料です。
>
> 利用者向けの公開資料ではありません。

## 1. 監査概要

Search Consoleでサイトマップが「取得できませんでした」、検出ページ数が0、インデックス登録済みページ数が1件の状態に対し、公開サイトとリポジトリに技術的な阻害要因があるかを監査した。

対象は、GitHub Pagesの公開HTTP応答、`sitemap.xml`掲載60URL、`robots.txt`、canonical、noindex、内部リンク、JavaScript依存、`/gomatools/`ベースパス、リポジトリと公開成果物の一致である。Search Consoleへのログイン、送信、URL検査、登録リクエストは行っていない。

## 2. 対象URL

- ホーム：`https://goma-dango-matcha.github.io/gomatools/`
- サイトマップ：`https://goma-dango-matcha.github.io/gomatools/sitemap.xml`
- robots：`https://goma-dango-matcha.github.io/gomatools/robots.txt`
- 初期公開ツール：`https://goma-dango-matcha.github.io/gomatools/age/`
- 最近更新したツール：`https://goma-dango-matcha.github.io/gomatools/calculator/`
- 別カテゴリのツール：`https://goma-dango-matcha.github.io/gomatools/tools/body-fat.html`

## 3. 公開HTTP応答

| URL | 状態 | Content-Type | リダイレクト | X-Robots-Tag | 備考 |
| --- | ---: | --- | ---: | --- | --- |
| ホーム | 200 | `text/html; charset=utf-8` | 0 | なし | 正常なHTML |
| sitemap.xml | 200 | `application/xml` | 0 | なし | XMLとして取得・解析可能 |
| robots.txt | 200 | `text/plain; charset=utf-8` | 0 | なし | プレーンテキスト |
| age | 200 | `text/html; charset=utf-8` | 0 | なし | 正常なHTML |
| calculator | 200 | `text/html; charset=utf-8` | 0 | なし | 正常なHTML |
| body-fat | 200 | `text/html; charset=utf-8` | 0 | なし | 正常なHTML |

通常のUser-AgentとGooglebot User-Agentで本文を比較し、6URLすべてでHTTP状態、Content-Type、本文ハッシュが一致した。認証、Cookie、外部APIは不要で、Googlebotだけを拒否する応答は確認されなかった。

- Content-Encoding：ホーム、sitemap、代表3ツールは`gzip`。robotsは圧縮なし
- Content-Length（応答ヘッダー）：ホーム9,603、sitemap 872、robots 91、age 8,440、calculator 6,949、body-fat 4,416バイト
- Cache-Control：6URLすべて`max-age=600`
- Server：6URLすべて`GitHub.com`
- 意図しないリダイレクト：0件

## 4. sitemap.xml

- XML宣言あり、BOMなし
- ルート要素：`urlset`
- 名前空間：`http://www.sitemaps.org/schemas/sitemap/0.9`
- 掲載URL：60件
- 空URL：0件
- 重複：0件
- HTTP 200：60件
- 404：0件
- リダイレクト：0件
- noindex：0件
- canonical不一致・欠落：0件
- `/gomatools/`ベースパス不一致：0件
- ローカル対応ファイル欠落：0件

`lastmod`は60件すべて日付形式として有効で、未来日もない。一方、Git履歴上の各ページ最終変更日と比較すると53件が古い。取得失敗を直接説明する問題ではないが、Googleが`lastmod`を信頼しにくくなる可能性があるため、次回のサイトマップ更新時に実際の重要変更日と同期する。

## 5. robots.txt

```text
User-agent: *
Allow: /

Sitemap: https://goma-dango-matcha.github.io/gomatools/sitemap.xml
```

HTTP 200で取得でき、全体クロール拒否、`/gomatools/`拒否はない。サイトマップの完全URLは公開URLと一致し、Googlebot User-Agentでも同じ内容を返す。

## 6. canonical・noindex

- sitemap掲載60ページすべてにcanonicalがあり、各公開URLと一致する。
- canonical URLはすべてHTTP 200を返す。
- sitemap掲載ページにmeta robots、meta googlebot、X-Robots-Tagのnoindexはない。
- `noindex, nofollow`は公開対象外の`knowledge-template.html`だけにあり、sitemapには掲載されていない。

## 7. 内部リンクとレンダリング

- ホームから静的な`<a href>`をたどり、sitemap掲載60ページすべてへ到達可能。
- 全ツール一覧から公開43ツールへ移動できる。
- sitemap掲載60ページにtitleがあり、H1は各1件。
- 主要本文は初期HTMLに含まれ、クライアント側ルーターやJavaScript実行をページ発見・本文表示の前提としていない。
- `/gomatools/`を欠いたホスト絶対URLやルート相対リンクは確認されなかった。

## 8. GitHub Pagesと公開成果物

- 既定ブランチは`main`。
- GitHub Actionsによる公開ワークフローはない。
- 公開中のsitemap、robots、sitemap掲載60ページはGitの`HEAD`内容と一致した。
- GitHub Pages設定画面は確認していないため設定上の公開元ディレクトリは断定しないが、現在の公開成果物とコミット済み成果物に差異はない。

## 9. 重要な送信URL確認

正しいサイトマップURLは次の完全URLである。

```text
https://goma-dango-matcha.github.io/gomatools/sitemap.xml
```

実測結果：

- `https://goma-dango-matcha.github.io/gomatools/sitemap.xml`：HTTP 200
- `https://goma-dango-matcha.github.io/sitemap.xml`：HTTP 404

Search Consoleへ「`/sitemap.xml`」と入力した事実だけでは、実際に登録された完全URLを確定できない。送信済み一覧に表示される完全URLがホスト直下なら、404となる誤URLが取得失敗の直接原因である。`/gomatools/sitemap.xml`を含む正しい完全URLなら、サイト側の取得・解析阻害要因は今回の監査で確認されていない。

## 10. 問題一覧

### Medium（管理画面での条件確認が必要）

#### Search Consoleへ登録された完全URLが未確認

- 原因候補：先頭スラッシュ付きの入力がホスト直下URLとして登録された可能性
- 影響範囲：サイトマップ取得と検出ページ数
- Search Console現象との関連：誤URLなら直接原因
- 対応：送信済み一覧の完全URLが`https://goma-dango-matcha.github.io/gomatools/sitemap.xml`か確認する

### Low

#### sitemapのlastmodがGit履歴上の重要変更日より古いページが53件

- 原因：ブランド改善後にlastmodを同期していない
- 影響範囲：更新日の信頼性
- Search Console現象との関連：取得失敗の直接原因ではない
- 対応：次回のサイトマップ更新時に実際の重要変更日だけを正確に反映する

### Critical・High

該当なし。

## 11. 最終判定

**サイト側に、Search Consoleの「取得できませんでした」とインデックス停滞を直接説明する明確な技術的不具合は確認されなかった。**

ただし登録された完全URLは管理画面を操作しない今回の監査では確認できないため、判定は次の条件付きとする。

- 登録URLが`https://goma-dango-matcha.github.io/gomatools/sitemap.xml`：判定C。サイト側の技術修正は不要。Googleの再取得・再集計・クロール・インデックス判断を待つ。
- 登録URLが`https://goma-dango-matcha.github.io/sitemap.xml`：誤URL。正しい完全URLでの送信が必要。

サイトマップの正常性と、Googleが個々のページをインデックスへ採用するかは別の問題である。インデックス登録は保証しない。

## 12. 変更内容

- 公開ページ、`sitemap.xml`、`robots.txt`、canonical、noindex、SEO設定：変更なし
- 追加：本監査記録
- 追加：`scripts/audit_search_console.py`
- 更新：引き継ぎメモのSEO状況と関連ドキュメント

## 13. Search Consoleで人が行う確認

1. 送信済みサイトマップ一覧で完全URLを確認する。
2. 正しいURLなら、サイトマップ詳細の最終読み込み日時とエラー詳細を確認する。
3. 代表URLのページインデックス登録状況と最終クロール日時を確認する。
4. 必要な重要ページだけURL検査を行い、インデックス可能であることを確認してから登録をリクエストする。
5. 連続再送信やSEO設定の変更は行わず、レポート更新を待つ。

## 14. 再確認条件

- サイトマップの最終読み込み日時が更新されたとき
- 新しいエラー詳細が表示されたとき
- ページレポートが更新されたとき
- 2026-07-19から7〜14日経過したとき
- GitHub Pagesの公開設定またはURL構造を変更したとき

## 15. 再監査コマンド

```powershell
python scripts/audit_search_console.py
```

外部ライブラリは不要で、ゴマツールの公開URLだけを取得する。XML、掲載URL、HTTP状態、canonical、noindex、robots、ローカル対応ファイル、ホームからの静的リンク到達性を再確認する。

## 16. 参考資料

- Google Search Console ヘルプ「サイトマップ レポート」：サイトマップ取得エラー、正しいURL、Googlebotからのアクセス確認、サイトマップ送信とインデックス登録が別であることを確認
- Google Search Console ヘルプ「URL検査ツール」：ライブテストで検出できない問題があり、インデックス登録を保証しないことを確認
- Google Search Console ヘルプ「プロパティを追加する」：URLプレフィックスはサブパスを含む完全な先頭文字列として扱われることを確認
- Google Search Central「サイトマップの作成と送信」：絶対URL、正確な`lastmod`、サイトマップ送信がヒントであり取得・クロールを保証しないことを確認
- Google Search Central「再クロールをリクエストする」：再クロールには数日から数週間かかる場合があり、繰り返しリクエストしても速くならず、掲載を保証しないことを確認

参照URL：

- `https://support.google.com/webmasters/answer/7451001`
- `https://support.google.com/webmasters/answer/9012289`
- `https://support.google.com/webmasters/answer/34592`
- `https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap`
- `https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl`
