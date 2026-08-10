# 文字数とバイト数の違い ゴマ知識 個別実装仕様書 Version1.0

## 1. 文書情報

| 管理項目 | 内容 |
| --- | --- |
| 対象シリーズ | ゴマ知識 |
| 対象記事 | 文字数とバイト数の違い |
| 状態 | 実装済み・公開前 |
| URL | `/knowledge/character-count-byte-difference/` |
| 公開形式 | 静的HTML |
| 作成日 | 2026-08-10 |
| Commit・Push | 未実施 |

## 2. 目的と役割

文字数は文章上の文字の数、バイト数は保存・送信時のデータ量であり、両者が一致するとは限らないことを初心者向けに説明する。

実際の文章を数える役割は「文字数カウント」、文字コード自体の仕組みは「文字コードって何？」、変換操作は「文字コード変換」へ分離する。

## 3. ページ情報

- H1: 文字数とバイト数は何が違う？日本語・英数字の違いを分かりやすく解説
- title: 文字数とバイト数は何が違う？日本語・英数字の違いを分かりやすく解説｜ゴマツール
- URL: `knowledge/character-count-byte-difference/`
- canonical: `https://goma-dango-matcha.github.io/gomatools/knowledge/character-count-byte-difference/`

## 4. 掲載内容

- 文字数とバイト数が数えているものの違い
- 1文字が必ず1バイトとは限らないこと
- UTF-8での `ABC`、`あいう`、`Aあ` の比較
- 全角・半角だけではバイト数を決められないこと
- 絵文字では見た目の文字数と内部の数え方が異なる場合があること
- 文字数とファイルサイズも同じではないこと

「日本語は必ず3バイト」「全角は必ず2バイト」などの誤った一般化は行わない。

## 5. 文字数カウントとの整合

文字数カウントは `Array.from(text).length` を使用し、Unicodeコードポイント単位で数える。結合文字や複数コードポイントからなる絵文字では、見た目の1文字と一致しない場合があることを必要な範囲で説明する。ツールの計算ロジックは変更しない。

## 6. 回遊導線

### 関連するゴマ知識

- 文字コードって何？

### 関連ツール

1. 文字数カウント
2. 文字コード変換
3. テキスト整形
4. テキスト比較

文字数カウントと「文字コードって何？」から本記事へ相互リンクする。件数合わせで関連性の弱いページは追加しない。

## 7. 情報源

- Unicode Consortium「The Unicode Standard」
- WHATWG「Encoding Standard」
- Ecma International「ECMAScript Language Specification」

一次仕様・公式技術資料を優先し、技術仕様を初心者向けに要約する。

## 8. SEO・構造化データ

- Article
- BreadcrumbList
- FAQPage
- canonical、OGP、Twitter Cardを既存ゴマ知識の現行形式に合わせる
- 画面表示と構造化データを一致させる

## 9. 実装対象

- `knowledge/character-count-byte-difference/index.html`
- `knowledge/what-is-character-encoding/index.html`
- `knowledge.html`
- `index.html`
- `text-counter/index.html`
- `sitemap.xml`
- `docs/spec-index.md`
- `docs/goma-knowledge-implementation-spec.md`

## 10. 完了条件

- 技術的説明とUTF-8の具体例が正しい
- 誤った固定値・一般化がない
- 文字数カウントの実装と記事説明が矛盾しない
- 文字数カウント、文字コード記事、文字コード変換への導線が自然
- 一覧、ホーム、sitemap、仕様索引が同期している
- Article、BreadcrumbList、FAQPageが画面表示と一致している
- 320pxを含むスマートフォンとPCで表・本文が崩れない
- 横スクロール、リンク切れ、Consoleエラーがない
- Commit・Pushは利用者の明示的な指示に従って行われる
