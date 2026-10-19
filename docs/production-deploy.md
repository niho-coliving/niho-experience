# 本番候補の配備と公開ゲート

対象: [#5](https://github.com/niho-coliving/niho-experience/issues/5)、[#15](https://github.com/niho-coliving/niho-experience/issues/15)。2026-10-19 時点の準備案。**販売開始、検索公開、外部提供者登録は別々に受入する。**

## 固定する構成

| 項目 | 設定 |
| --- | --- |
| GCP | プレビュー `niho-experience-web` と NIHOapp から分離した `niho-experience-prod`。`asia-northeast1` |
| Cloud Run | `niho-experience`、`experience-runtime`（権限なし）、1 vCPU / 512 MiB、候補段階は min 0 / max 2 |
| イメージ | 本リポのレビュー済み `main` の40文字SHA。資格情報なしで build と smoke を行い、SHA256確認済みのイメージだけを配備jobへ渡す |
| 配備権限 | 本番プロジェクト専用の `experience-deployer`。専用 Workload Identity Pool は GitHub repository ID `1425500695`、`refs/heads/main`、`production` environment の同時一致を要求 |
| GitHub | `production` environment に `main` のみの branch rule と required reviewer を設定。repository variable `PRODUCTION_DEPLOY_ENABLED=true` は設定が揃うまで付けない |
| 初期revision | `EXPERIENCE_API_MODE=http`、`SITE_URL=https://experience.niho.life`、`NEXT_PUBLIC_NIHO_WEB_ORIGIN=https://niho.life`、`SITE_INDEXING=block`、`BOOKINGS_ENABLED=false`、`HOST_SIGNUP_MODE=pilot`。`MOCK_CATALOG` と `UMAMI_WEBSITE_ID` は渡さない |

本番プロジェクトの新設・請求先連結・ロードバランサーの利用料金はオーナー判断事項。推奨は**専用本番プロジェクト＋global external Application Load Balancer＋Cloudflare proxy**。Googleは Cloud Run domain mapping を production に推奨していないため、DNS only の domain mapping は採らない。Cloud Run は候補段階で公開 `run.app` URL を使うが、販売開始前に ALB 経由だけを受ける ingress と候補revisionの検証経路を整える。プレビュー用 deployer に本番プロジェクトの権限を付けない。

## 初回準備（オーナーが請求先・権限を承認した後）

1. 管理者アカウントで `ORG_ID`、`BILLING_ACCOUNT`、`PROJECT_ID=niho-experience-prod` を確認する。`ORG_ID=... BILLING_ACCOUNT=... bash scripts/gcp/setup-production.sh` を実行する。スクリプトはプロジェクト、請求先、Artifact Registry、runtime/deployer SA、専用 OIDC pool/provider を作り、GitHub variables の値を出す。既存プレビュー・NIHOappのプロジェクトを指定すると停止する。
2. GitHub の `production` environment を作り、**required reviewer と main のみの branch rule** を設定する。スクリプトが出した `PROD_GCP_*` 6変数を repository variables に登録する。preview 用 `GCP_*` と混ぜない。最後に `PRODUCTION_DEPLOY_ENABLED=true` を登録する。
3. `.github/workflows/deploy-production.yml` を `main` から手動起動し、入力 `commit_sha` を起動時の `main` SHA と完全一致させる。最初は `promote_traffic=false`。workflow は資格情報なしで build/smoke → 保護環境で image push → `--no-traffic --tag candidate-<sha12>` → revision専用URL・runtime env・robots・preview 404 を確認する。
4. 確認済み候補を公開入口へ切り替える時だけ `promote_traffic=true` で同じSHAを再実行する。候補SHA・revision・配備run・環境変数・HTTP結果を #15 に記録する。予約停止と検索除外は維持する。

`--set-env-vars` に渡す6項目は本サービスの初期 runtime 設定全量である。運用で値を足す際は workflow を同時に更新し、Cloud Run画面での一時変更を正本としない。`UMAMI_WEBSITE_ID` はポリシーの追記後、別PRで本番だけに追加する。

## `experience.niho.life` の入口案（有料の ALB を承認後）

| 層 | 作るものと値 | 確認 |
| --- | --- | --- |
| GCP | 本番プロジェクトに global external Application Load Balancer。`asia-northeast1` の `niho-experience` を指す serverless NEG、HTTPS backend service、HTTP→HTTPS redirect、専用 global static IPv4 を割り当てる | `Host: experience.niho.life` でトップと静的assetが 200 |
| TLS | Certificate Manager の DNS authorization で `experience.niho.life` の証明書を発行し、ALB の HTTPS proxy に付ける。DNS authorization の CNAME を Cloudflare DNS へ追加する | 証明書が active、TLS hostname が一致、HTTP が HTTPS へ転送 |
| Cloudflare | `experience` の A record を専用 ALB IPv4 に向けて proxy を有効にする。SSL/TLS は Full (strict)。既存 `niho.life` / `app` / `api` の DNS は触らない | DNS、TLS、`cf-ray`、ALB access log を突合 |
| cache | この hostname の既定は bypass。後順位の例外 rule として `/_next/static/*` のみ cache eligible。`/experiences/*/book`、`/booking/*`、`/preview/*`、API、HTML は常に bypass。`/_next/image` は初回は bypass | 予約関連の `Cache-Control: private, no-store`、`CF-Cache-Status` が `HIT` でないことを確認 |
| origin protection | 販売前に Cloud Run ingress を `internal-and-cloud-load-balancing` にし、`run.app` の直アクセスが拒否されることを確認。候補revisionの検証を ALB 経由に切り替えたworkflowを同時に入れる | `run.app` でアクセス不可、ALB経由は正常 |

ALB/DNSは、この文書の設定と Google Cloud の [Cloud Run custom domain 手順](https://cloud.google.com/run/docs/mapping-custom-domains)、[revision の段階切替](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration)、Cloudflare の [cache rule 順序](https://developers.cloudflare.com/cache/how-to/cache-rules/order/)を照合して適用する。DNS cutover前に現行レコードの値とIDを保存し、切戻しは旧レコードへ戻す。

## NIHO の実APIとの整合

連携Aの [#19137](https://github.com/niho-coliving/niho-app/pull/19137) を merge・stg配備し、契約 [#26](https://github.com/niho-coliving/niho-experience/pull/26) を取り込んでから、`npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life` を実行する。検証環境に公開した合成商品と開催枠がない場合、空一覧は契約不一致ではなくfixture不足として記録する。

NIHOapp側の変更は連携Aの担当へ集約する。stg Web の `EXPERIENCE_SITE_ALLOWED_ORIGINS` は検証用サイトの exact origin、本番 Web は `https://experience.niho.life` の exact origin に限定する。GET availability と POST checkout の path/method だけ CORS を許し、ワイルドカードや資格情報付きCORSを使わない。`EXPERIENCE_SITE_PUBLIC_ORIGIN` は、承認済み原稿が本番ホストで表示されるまで**未設定**とする。この変数を入れると NIHO側の canonical・sitemap・中断時の戻り先が新サイトへ切り替わるため、両側を同時にreadbackする。env の反映は [NIHO連携runbook](https://github.com/niho-coliving/niho-app/blob/main/ops/runbooks/experience-site/experience-site-integration.md) と Cloud Run manifest の経路を使う。

## 個別ゲートと切戻し

| ゲート | 開く前の証跡 |
| --- | --- |
| 表示 | 本番候補で mock/pilot fixture が出ず、`/preview/states` と `/preview/checkout` が404。公開APIは掲載済みだけ。モバイル・デスクトップと主要エラー表示、商品原稿・写真許諾を確認 |
| 予約・販売 | 合成提供者と Stripe test の掲載→予約→決済→確定→予約一覧→売上→返金、販売者/口座/条件、停止・期限切れ・再送を確認。P-01/02の実条件、サポート窓口、販売開始判断者が確定してから `BOOKINGS_ENABLED=true` と NIHO側受付を開く |
| 検索 | canonical・sitemap・robots、公開原稿と写真、計測の公表が揃ってから `SITE_INDEXING=allow`。販売開始とは別に判断 |
| 外部提供者 | 連携B #19123 の登録・権限・口座・売上の受入後にだけ `HOST_SIGNUP_MODE=open` |
| 計測 | NIHOのプライバシーポリシーに Umami Cloud の送信内容・目的・保存期間を追記し、同意方針の確認後だけ `UMAMI_WEBSITE_ID` を設定。previewには設定しない |

緊急停止はまず NIHO の掲載/受付を止め、サイト側も `BOOKINGS_ENABLED=false` の安全revisionへ戻す。サイトのtrafficを直前revisionへ戻しても、成立済み予約・返金は NIHO の予約一覧と台帳で追う。Cloud Run trafficの変更後に revision、100% の配分、トップ/詳細/予約停止、NIHO側の予約一覧・返金導線をreadbackする。停止・切戻し・再開の日時とSHAを #15 に残す。
