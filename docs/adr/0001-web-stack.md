# ADR 0001：公開サイトの技術構成とホスティング

- 状態：フレームワークは採用。ホスティングは提案（本番配備前にオーナー承認）
- 日付：2026-10-19
- 関連：[#5 開発基盤](https://github.com/niho-coliving/niho-experience/issues/5)

## 判断材料

`docs/architecture.md` の条件に従い、SSRの可否、公開データだけでのビルド、開発速度、運用費で比べた。既存NIHOapp（`apps/web`）は Next.js 16 / Tailwind CSS 4 / TypeScript / Vitest / Node 24 で動いている。

## フレームワーク

| 候補 | SSR・SEO | 予約フォーム等の動的処理 | NIHOとの相性 | 判断 |
| --- | --- | --- | --- | --- |
| **Next.js 16（App Router）** | Server Componentで本文をSSR。metadata/sitemap/robotsを標準で持つ | Server Actionでサーバー側からゲストAPIを呼べ、PIIをブラウザ保存せずに済む | 同じ版・同じ書き方。担当間で知識を共有できる | **採用** |
| Astro | 静的・SSRとも得意。JSが少ない | 予約入力は島（React等）を別に組む必要 | 新しい技術を一つ増やす | 不採用 |
| React Router v7 | SSR可 | loader/actionで可 | NIHOに前例なし | 不採用 |

採用した版（`package-lock.json` で固定）：

- Next.js 16.3.8（NIHOappと同じ）、React 19.3、TypeScript 5.9、Tailwind CSS 4.3
- zod 4（契約の検証）、Vitest 4.1、Playwright 1.56 + axe-core（E2E・アクセシビリティ）
- 書体は `@fontsource-variable` の Fraunces と Nunito を npm から同梱（ビルド時に外部取得しない）
- Node 24（`.nvmrc`）。npmは workspaces を使う

## ホスティング（提案）

| 候補 | 長所 | 注意点 |
| --- | --- | --- |
| **Cloud Run（NIHOと同じGCP、別サービス）** | 既存の請求・IAM・運用知識を使える。SSR/Server Actionがそのまま動く。少量アクセスなら低コスト | PRごとのプレビュー環境は自前で作る必要 |
| Vercel | PRプレビューが最も簡単 | 商用利用は有料プラン。別ベンダーの権限・請求が増える |
| Cloudflare Workers（OpenNext） | 配信が速く安い | Next.jsとの間に変換層が入り、検証範囲が増える |

推奨は Cloud Run。有料契約や本番公開はこのPRでは行わない（#5 Notes）。決定時に `output: "standalone"` とコンテナ定義を追加する。

## CIと配備の分離

- 公開PRのCIは GitHub-hosted runner、`permissions: contents: read`、secretなし、合成データのみ（`.github/workflows/ci.yml`）。外部PRも同じ条件で走り、社内runner・本番secret・配備権限に触れない。
- Actionは commit SHA で固定する。依存は lockfile で固定し `npm ci` で入れる。
- 同じPRの古い実行は `concurrency` で止める。
- `docs/**` と `*.md` だけの変更ではCIを起動しない。必須チェックに設定する場合は、文書だけのPRが待ち状態にならないよう、ブランチ保護の設定と合わせて決める。
- 本番配備は、レビュー済みの固定SHAを対象に、secretを持たないビルドと、信頼済みのdeploy（保護された環境・承認者付き）を別ジョブ・別権限に分ける。このPRには配備工程を含めない。

## 結果

- 新規cloneから `npm ci && npm run dev` で、英語の画面と合成データが表示できる（`docs/development.md`）。
- 本物のAPIは `EXPERIENCE_API_MODE=http` で接続するが、契約確定（#7・連携A）まで意図的に失敗する。
