# @niho-experience/api-client

> **仮契約（v0.1.0-draft）**。NIHOのAPIとはまだ合意していない。正本はNIHO側で、[#7](https://github.com/niho-coliving/niho-experience/issues/7) の担当（契約・NIHO連携）が選別した配布物に置き換える。

画面担当が実APIを待たずに開発するための、型・検証・合成データ・mockをまとめたパッケージ。

| ファイル | 内容 |
| --- | --- |
| `src/contract.ts` | zodスキーマと型。公開してよい項目だけを持つ |
| `src/client.ts` | `ExperienceApi`（サイトが使う5操作）、`withContractValidation`、HTTPクライアントの枠（未接続） |
| `src/mock/fixtures.ts` | 合成の体験5件（予約可・一部満席・全満席・販売停止・グループ料金） |
| `src/mock/adapter.ts` | mock実装。JSTで今日から6週間分の開催枠を作る。決済は行わず、模擬決済ページへのURLを返す |

## 操作

| 操作 | 入力 | 出力 | 備考 |
| --- | --- | --- | --- |
| `getCatalog` | area / theme / date（JST） | 体験の要約、掲載のあるテーマ | 掲載済みだけ。下書き・非公開は返さない |
| `getExperience` | slug | 詳細 または null | 集合はエリア単位の公開情報だけ |
| `getSlots` | experienceId | 開催枠（JST、状態、単価、受付可能人数） | 表示用。確定は見積 |
| `createQuote` | experienceId, slotId, guests | 見積（内訳・総額・販売者・取消条件・期限）またはエラー | 価格・在庫・販売者はAPIが決める |
| `startGuestCheckout` | quoteId, 連絡先, 同意した規約版, idempotency key | Stripe Checkout のURL またはエラー | サイトは `checkout.stripe.com` 以外へ遷移しない |

APIとmockの応答は、どちらも `withContractValidation` で同じスキーマ検証を通す。

## 境界

- ブラウザは金額・販売者・口座を確定しない。画面の金額はAPIの見積を表示し、選択画面の金額は「Estimated」。
- 連絡先はサーバー側（Server Action）からAPIへ送る。URL・ブラウザ保存・ログ・計測に入れない。エラーは項目名だけを返し、入力値を返さない。
- 戻りURLは予約成立の証明にしない。成立はwebhookを正としてNIHOが確認する。
- fixtureは架空のデータだけ。`synthetic: true`、画像は `placeholder: true`。
