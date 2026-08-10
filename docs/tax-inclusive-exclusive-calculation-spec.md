# 税込・税抜の計算方法 ゴマ知識 個別実装仕様書 Version1.0

## 1. 文書情報

| 管理項目 | 内容 |
| --- | --- |
| 対象シリーズ | ゴマ知識 |
| 対象記事 | 税込・税抜の計算方法 |
| 状態 | 実装済み・公開前 |
| URL | `/knowledge/how-to-calculate-tax-inclusive-exclusive/` |
| 公開形式 | 静的HTML |
| 作成日 | 2026-08-10 |
| Commit・Push | 未実施 |

## 2. 目的と役割

税抜価格から税込価格、税込価格から税抜価格、消費税額を求める基本的な考え方を初心者向けに説明する。

本記事は計算の仕組みを理解するための解説記事とし、具体的な金額を入力して結果を得る役割は「消費税計算」へ分離する。事業者向けの税務申告・経理処理は扱わない。

## 3. ページ情報

- H1: 税込・税抜はどう計算する？消費税の求め方を分かりやすく解説
- title: 税込・税抜はどう計算する？消費税の求め方を分かりやすく解説｜ゴマツール
- URL: `knowledge/how-to-calculate-tax-inclusive-exclusive/`
- canonical: `https://goma-dango-matcha.github.io/gomatools/knowledge/how-to-calculate-tax-inclusive-exclusive/`

## 4. 掲載内容

- 標準税率10％：税抜から税込は `×1.10`、税込から税抜は `÷1.10`
- 軽減税率8％：税抜から税込は `×1.08`、税込から税抜は `÷1.08`
- 税込価格から税率分を単純に引いても税抜価格に戻らない理由
- 消費税額だけを求める方法
- 端数処理を一律に断定しない注意書き

税率や税抜相当額への換算方法は、実装時点の国税庁公式情報で確認する。制度変更時は優先レビュー対象とする。

## 5. 回遊導線

### 関連するゴマ知識

- パーセントはどう計算する？

### 関連ツール

1. 消費税計算
2. パーセント計算
3. 割引率計算

消費税計算から本記事への相互リンクを設ける。公開済みのパーセント記事とも自然に相互リンクし、件数合わせで関連性の弱いページは追加しない。

## 6. 情報源

- 国税庁「軽減税率制度の概要」
- 国税庁「No.6351 納付税額の計算のしかた」

制度説明は一次情報を優先し、長い引用や税務申告向けの専門説明を掲載しない。

## 7. SEO・構造化データ

- Article
- BreadcrumbList
- FAQPage
- canonical、OGP、Twitter Cardを既存ゴマ知識の現行形式に合わせる
- 画面表示と構造化データを一致させる

## 8. 実装対象

- `knowledge/how-to-calculate-tax-inclusive-exclusive/index.html`
- `knowledge/how-to-calculate-percentage/index.html`
- `knowledge.html`
- `index.html`
- `tax/index.html`
- `sitemap.xml`
- `docs/spec-index.md`
- `docs/goma-knowledge-implementation-spec.md`

## 9. 変更しないもの

- 消費税計算ツールの計算ロジック
- 共通デザイン、共通CSS、共通JavaScript
- URL構造
- 既存記事の主要本文

## 10. 完了条件

- 国税庁の一次情報で現行税率を確認している
- 10％・8％の計算例と逆算理由が正しい
- 端数処理を過度に断定していない
- 消費税計算とパーセント記事との役割分担・相互導線が明確
- 一覧、ホーム、sitemap、仕様索引が同期している
- Article、BreadcrumbList、FAQPageが画面表示と一致している
- 320pxを含むスマートフォンとPCで表示崩れがない
- 横スクロール、リンク切れ、Consoleエラーがない
- Commit・Pushは利用者の明示的な指示に従って行われる
