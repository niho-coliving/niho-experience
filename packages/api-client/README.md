# @niho-experience/api-client

NIHO 共通基盤の公開 API（体験の一覧・詳細・残席・ゲスト予約の開始）と、ホスト API（体験の提供者の本人向け API）の、選別された契約・型・クライアント・合成 mock。
契約の意味・公開範囲・エラーと再送は [docs/api-contract.md](../../docs/api-contract.md) が正。

**状態：NIHO側で合意済みの公開API v1.2.0（配備待ち）。** [NIHO-app #19160](https://github.com/niho-coliving/niho-app/issues/19160) / [#19161](https://github.com/niho-coliving/niho-app/issues/19161) / [#19267](https://github.com/niho-coliving/niho-app/pull/19267) の反映・配備後に `verify:live` が成功するまで、実 API 接続済みとは扱いません。

| 入口 | 用途 |
| --- | --- |
| `@niho-experience/api-client` | 型・`createExperienceApiClient`・表示と再送の規則（ブラウザ・SSR） |
| `@niho-experience/api-client/mock` | 合成データの fetch（プレビュー・テストだけ。本番 build で読み込まない） |
| `@niho-experience/api-client/testing` | 契約の検証器と監査（公開・ホスト。Node・test だけ） |
| `@niho-experience/api-client/host` | ホスト API の型・`createExperienceHostApiClient`（**サーバー専用**。ID token を Bearer で送る） |
| `@niho-experience/api-client/host/mock` | ホスト API の合成データの fetch（プレビュー・テストだけ） |

```sh
npm ci                                     # リポジトリのrootで一度だけ（lockfileはrootの1つ）
npm -C packages/api-client run check      # 型の drift・型検査・テスト
npm -C packages/api-client run gen:types  # 契約を変えたとき
npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life  # 実 API の読み取りを同じ契約で検証
```

- `contract/experience-public-api.openapi.json`：契約（OpenAPI 3.0.3）。`src/generated/openapi.ts` はここから生成する。
- `contract/public-field-policy.json`：公開してはいけない名前と、要求にだけ置ける個人情報の項目。
- `contract/experience-host-api.openapi.json`（＋`.sha256`）：ホスト API の契約（**状態：draft・v0.1.0**。NIHO の `contracts/exports` の書き出しをそのまま置く）。`src/generated/host-openapi.ts` はここから生成する。
- `contract/host-field-policy.json`：ホスト API の範囲（path・Bearer）、閉じない schema の許可リスト、入れてはいけない名前・語。監査は `auditHostContractDocument`（公開の `auditContractDocument` とは別）。

### ホスト API

```ts
import { createExperienceHostApiClient } from "@niho-experience/api-client/host"; // サーバーのコードだけ

const api = createExperienceHostApiClient({ nihoWebOrigin: "https://niho.life", idToken });
const result = await api.listExperienceProviders();
if (!result.ok && result.kind === "error") console.log(result.status, result.code, result.reason); // reason は error.details.reason
```

- メソッド名は契約の operationId と同じ（`getAuthMe`・`listExperienceProviders`・`registerExperienceProvider`・`getExperienceProvider`・`updateExperienceProvider`・`submitExperienceProvider`・`getExperienceProviderPaymentReadiness`・`listExperienceProviderPaymentReuseCandidates`・`reuseExperienceProviderPayment`・`start|resume|syncExperienceProviderPaymentConnect`）。
- 結果は `{ ok: true, data }` か、`{ kind: "error", status, code, reason }`・`network_error`・`unexpected_response`。応答は契約の項目だけを取り出す（`getAuthMe` は表示名と顔写真だけ）。
- Stripe の接続の `url` へ遷移する前に `isStripeConnectUrl(url)` で確かめる（mock の URL は `isMockConnectUrl`）。
- mock：`createMockExperienceHostFetch({ scenario })`。`scenario` は `empty`（提供者 0 件）・`two-providers`（OWNER・承認済み・口座準備済みの台所と、EDITOR・下書きの工房）・`payments-pending`（口座未接続・再利用の候補あり）。登録・変更・申請・再利用・接続は同じ fetch のインスタンスの中だけで状態を変える。
- `src/fixtures/`：架空の体験。`mock-assets/`：仮素材の SVG（`node scripts/write-mock-assets.ts` で再生成）。
