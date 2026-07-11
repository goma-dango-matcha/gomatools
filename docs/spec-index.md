# ゴマツール 現行仕様書一覧

## 目的

docs配下の現行仕様書を一覧化し、仕様書の優先順位・役割・保管ルールを明確にする。

仕様書を追加・更新した場合は、本一覧も更新する。

---

## 仕様書の優先順位

1. [ブランド仕様書](brand-guidelines.md)
2. [共通用語辞書](common-terminology.md)
3. [共通文章設計仕様書](writing-guidelines.md)
4. 領域別の共通仕様書
5. 個別ページ・個別ツール仕様書
6. レビュー仕様書・運用メモ

矛盾がある場合は、上位仕様を優先する。

---

## 現行仕様書

| 優先度 | ファイル | 現行Version | 役割 |
| --- | --- | --- | --- |
| 1 | [brand-guidelines.md](brand-guidelines.md) | Version1.1 | ゴマツール全体の最上位ブランド仕様 |
| 2 | [common-terminology.md](common-terminology.md) | Version1.1 | UI名称・表示名称・役割の統一 |
| 3 | [writing-guidelines.md](writing-guidelines.md) | Version1.1 | タイトル・リード文・説明文など文章設計の統一 |
| 4 | [tool-common-spec-v3.md](tool-common-spec-v3.md) | Version3.1 | 全ツール共通の構成・導線・UI方針 |
| 5 | [brand-growth-phase-spec.md](brand-growth-phase-spec.md) | Version1.0 | 既存43ツールのブランド育成フェーズ共通改善方針 |
| 6 | [date-time-brand-improvement-spec.md](date-time-brand-improvement-spec.md) | Version1.0 | 日付・時間カテゴリのブランド改善方針 |
| 7 | [inputless-tool-spec.md](inputless-tool-spec.md) | Version1.1 | 入力不要ツール専用の設計方針 |
| 8 | [inputless-brand-improvement-spec.md](inputless-brand-improvement-spec.md) | Version1.0 | 入力不要ツールシリーズのブランド改善方針 |
| 9 | [today-info-brand-improvement-spec.md](today-info-brand-improvement-spec.md) | Version1.0 | 「今日の情報」固有のブランド改善方針 |
| 10 | [quick-access-feature.md](quick-access-feature.md) | Version1.1 | 「すぐわかる」特集の表示・運用方針 |
| 11 | [brand-review-spec.md](brand-review-spec.md) | Version1.0 | ブランド改善完了後のカテゴリ横断レビュー方針 |
| 12 | [money-brand-review-spec.md](money-brand-review-spec.md) | Version1.0 | お金カテゴリのブランド改善完了後レビュー方針 |

---

## 現行扱い

上記の仕様書を、2026年7月時点の現行仕様として扱う。

旧Versionの内容は、現行仕様へ統合済みとする。

---

## archive運用

旧版仕様書をファイルとして残す必要がある場合は、`docs/archive/` 配下へ移動する。

archiveへ移動する条件:

- 現行仕様と重複している
- 参照頻度が低い
- 履歴として残す価値がある
- 現行実装の判断材料としては使用しない

archive内の仕様書は、現行仕様として扱わない。

---

## 個別仕様書の扱い

個別ページ・個別ツール仕様書は、必要に応じてdocs配下または該当ページの管理メモとして保管する。

個別仕様書には、上位仕様と重複する説明を長く書かない。

個別仕様書には、そのページ・ツールだけに必要な差分、SEO情報、固有のUI、固有のデータ仕様を中心に記載する。

---

## 更新ルール

- 上位仕様を更新した場合は、下位仕様に重複や矛盾がないか確認する
- 新しい共通仕様書を追加した場合は、本一覧へ追加する
- 旧版を残す場合は、archiveへ移動し、現行扱いしない
- 公開ページや機能の変更を伴わない文書整理では、公開ページの最終更新月は変更しない
