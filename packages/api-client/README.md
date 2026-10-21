# @niho-experience/api-client

NIHO 共通基盤の公開 API（体験の一覧・詳細・残席・ゲスト予約の開始）の、選別された契約・型・クライアント・合成 mock。
契約の意味・公開範囲・エラーと再送は [docs/api-contract.md](../../docs/api-contract.md) が正。

**状態：NIHO側で合意済みの公開API v1.2.0（配備待ち）。** [NIHO-app #19160](https://github.com/niho-coliving/niho-app/issues/19160) / [#19161](https://github.com/niho-coliving/niho-app/issues/19161) / [#19267](https://github.com/niho-coliving/niho-app/pull/19267) の反映・配備後に `verify:live` が成功するまで、実 API 接続済みとは扱いません。

| 入口 | 用途 |
| --- | --- |
| `@niho-experience/api-client` | 型・`createExperienceApiClient`・表示と再送の規則（ブラウザ・SSR） |
| `@niho-experience/api-client/mock` | 合成データの fetch（プレビュー・テストだけ。本番 build で読み込まない） |
| `@niho-experience/api-client/testing` | 契約の検証器（Node・test だけ） |

```sh
npm ci                                     # リポジトリのrootで一度だけ（lockfileはrootの1つ）
npm -C packages/api-client run check      # 型の drift・型検査・テスト
npm -C packages/api-client run gen:types  # 契約を変えたとき
npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life  # 実 API の読み取りを同じ契約で検証
```

- `contract/experience-public-api.openapi.json`：契約（OpenAPI 3.0.3）。`src/generated/openapi.ts` はここから生成する。
- `contract/public-field-policy.json`：公開してはいけない名前と、要求にだけ置ける個人情報の項目。
- `src/fixtures/`：架空の体験。`mock-assets/`：仮素材の SVG（`node scripts/write-mock-assets.ts` で再生成）。
