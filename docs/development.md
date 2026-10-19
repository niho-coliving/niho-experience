# 開発手順

公開サイトは合成データだけで動く。NIHOの内部リポジトリ、DB、本番Stripe、管理者token、`.env` は不要。

## 初回セットアップ

```sh
# Node 24（.nvmrc）。nvm利用時は `nvm use`
npm ci
npm run dev
```

http://localhost:3000 を開く。画面上部の黒い帯「Preview with sample data」は、mockで動いていることの表示。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run lint` | ESLint（Next.js推奨ルール + アクセシビリティ） |
| `npm run typecheck` | 型検査（route型の生成 → アプリ → E2E） |
| `npm test` | 単体テスト（契約・mock・表示ロジック） |
| `npm run build` | 本番ビルド（`output: "standalone"`） |
| `npm start` | ビルド済みのサーバーをコンテナと同じ方法で起動（`PORT`・`HOSTNAME` で待受先を指定） |
| `npm run test:e2e` | Playwright。先に `npm run build` が必要。初回は `npx -w @niho-experience/web playwright install chromium` |
| `npm run check` | lint + typecheck + test + build |

Claude Codeのクラウド環境のようにChromiumが入っている環境では、`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` を付けるとブラウザの取得を省ける。

## コンテナ

本番はCloud Run（入口はCloudflare）で動かす（[ADR 0001](adr/0001-web-stack.md)）。

```sh
docker build -t niho-experience .
docker run --rm -p 8080:8080 niho-experience        # http://localhost:8080
sh scripts/container-smoke.sh niho-experience       # 表示と、設定による切替の確認
```

環境ごとの値はビルドに入れず、`docker run -e HOST_SIGNUP_MODE=open` のように実行時に渡す。同じイメージをプレビューと本番で使う。

## 構成

```text
apps/web/                 Next.js 16（App Router）。画面・SSR・SEO・予約入力
  src/app/                ページ（/, /experiences, /experiences/[slug], /book, /booking/return, /host, /preview/*）
  src/components/         表示部品
  src/lib/                SSR公開API・ブラウザ用API・表示用の整形
  e2e/                    Playwright（360px・320px・デスクトップ、axe）
packages/api-client/      NIHO選別公開APIのOpenAPI・型・クライアント・合成mock
```

`packages/experience-ui` と root の `fixtures/` は、必要になるまで作らない（#5 Notes）。fixtureは契約と一緒に `packages/api-client/src/fixtures/` に置いている。

## 環境変数

すべて任意。既定値で新規cloneから動く。一覧と説明は `apps/web/.env.example`。秘密情報は置かない。

| 変数 | 既定 | 用途 |
| --- | --- | --- |
| `EXPERIENCE_API_MODE` | `mock` | `http` は NIHO 公開 Web origin の選別APIへ接続 |
| `EXPERIENCE_PUBLIC_API_VERSION` | `1.0` | `1.1` は NIHO 側の v1.1 API（bio・写真alt・流入元項目）が stg/prod に配備・検証された後だけ有効化 |
| `MOCK_CATALOG` | `synthetic` | mock時の体験一覧。`pilot` は掲載許可のある最初の5体験を推奨値で表示（[docs/content/README.md](content/README.md)）。検索には出ない |
| `NEXT_PUBLIC_NIHO_WEB_ORIGIN` | `https://niho.life` | 公開Web APIのorigin。stgでは `https://app-stg.niho.life` |
| `SITE_INDEXING` | 未設定＝検索除外 | `allow` かつ `EXPERIENCE_API_MODE=http` の時だけindex許可（合成データは設定を誤っても検索に出ない）。本番受入（#15）後に設定 |
| `SITE_URL` | `http://localhost:3000` | canonical・sitemapの起点。正式ドメインは未定 |
| `BOOKINGS_ENABLED` | `true` | `false` で新規予約を止める（障害時。#15の手順） |
| `HOST_SIGNUP_MODE` | `pilot` | `open` はNIHO側のセルフ登録（連携B）が使えるようになってから |
| `NIHO_HOST_START_URL` / `HOST_PILOT_CONTACT_URL` / `NIHO_BOOKING_HELP_URL` | なし | NIHO側の遷移先。固定URLのみ。利用者入力で戻り先を変えない |

## プレビューで状態を確認する

- `/preview/states`：空結果と読込などの表示を確認できる（mock時のみ存在）。
- `?mock=slow`・`?mock=empty`・`?mock=error`：読込中・掲載なし・API障害を再現（mock時のみ有効）。
- 選別mockのcheckoutエラーは `createMockExperienceFetch` の scenario で再現できる。メールアドレスをトリガーにしない。
- 決済は `/preview/checkout` の模擬ページへ進む。カード情報は扱わない。

## データの扱い

- fixtureは架空の提供者・日程・価格のみ。実在の人物・連絡先・住所・レビュー・販売実績を入れない。写真は抽象的なSVGの仮素材で、画面に「Sample」と表示する。
- 予約入力（氏名・メール・備考・回答）はブラウザ内だけで保持し、ブラウザからNIHO公開APIへ直接送る。Next.js Server Action、URL、storage、ログ、計測、公開cacheへ入れない。予約関連ページは `Cache-Control: private, no-store` と `X-Robots-Tag: noindex`。
- 価格・在庫・販売者の正はNIHO。画面は契約の料金式で合計を表示し、`expectedTotalYen` として照合用に送る。

## 担当範囲

| ファイル | 窓口 |
| --- | --- |
| `package.json`、`package-lock.json`、`.nvmrc`、`tsconfig.base.json`、`.github/workflows/`、`apps/web/` の設定 | 担当1（サイト・デザイン） |
| `packages/api-client/contract/`、fixtureの構造 | 担当2（契約・NIHO連携、#7）。契約は `docs/api-contract.md` とOpenAPIを正とする |
| 英語文言・商品の事実 | 担当3（商品・集客）。現在の文言は合成例 |

lockfileはrootの `package-lock.json` 1つだけ。パッケージのフォルダで `npm install` / `npm ci` をせず、rootで `npm install -w <パッケージ名> <依存>` のように入れる。依存を追加・更新する時は lockfile ごと担当1のPRにまとめる。`playwright-core` は `@axe-core/playwright` が別版を引き込まないよう root の `overrides` で `@playwright/test` と同じ版に揃えている。
