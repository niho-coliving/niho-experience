# プレビュー配備の準備（Cloud Run）

`main` に入った変更を、合成データのプレビューとしてCloud Runへ自動で出すための初回準備。構成の判断は [ADR 0001](adr/0001-web-stack.md)、本番の受入・停止は [release-acceptance.md](release-acceptance.md)。

## 何が起きるか

```text
main に merge → GitHub Actions（.github/workflows/deploy-preview.yml）
  1. イメージをビルドし、smoke test（ここまで資格情報なし）
  2. GitHubのOIDCでGoogle Cloudに認証（鍵ファイルなし。mainのこのリポだけが使える）
  3. Artifact Registryへ登録 → Cloud Runの niho-experience-preview を更新
  4. 公開URLで表示とrobots.txt（検索除外）を確認し、URLを実行結果に表示
```

- プレビューは合成データ（`EXPERIENCE_API_MODE=mock`）で、検索に出ず、予約も決済もできない。
- 最小インスタンス0なので、使わない時はほぼ費用がかからない（しばらく使わないと最初の表示に数秒かかる）。
- NIHOappとは別のGCPプロジェクトに作る。NIHOappの権限・データには触れない。
- 準備が済むまで、このworkflowは何もせずに終わる（`GCP_PROJECT_ID` 変数がない間はskip）。

## 手順1：Google Cloudの準備（オーナーが1回だけ）

`@niho.life` の管理者アカウントで [Cloud Shell](https://shell.cloud.google.com/) を開く（iPhoneのブラウザでも使える）。次の2行を実行する。

```sh
curl -fsSLO https://raw.githubusercontent.com/niho-coliving/niho-experience/main/scripts/gcp/setup-preview.sh
bash setup-preview.sh
```

スクリプトがすること（何度実行しても安全）：

| 作るもの | 内容 |
| --- | --- |
| プロジェクト `niho-experience-web` | NIHOの組織に作り、請求先を紐付ける |
| Artifact Registry `web`（asia-northeast1） | イメージ置き場。新しい10個を残し、30日より古いものを消す |
| サービスアカウント `experience-runtime` | サイトが動く時の身元。権限なし |
| サービスアカウント `experience-deployer` | 配備用。Cloud Runの更新・イメージ登録・runtimeの指定だけ |
| Workload Identity（`github` / `niho-experience`） | GitHub Actionsのうち、このリポ（ID固定）の `main` だけがdeployerを使える |

止まった時：

| 表示 | 対処 |
| --- | --- |
| `Found N candidates for ORG_ID` / `BILLING_ACCOUNT` | 表示された候補から選び、`ORG_ID=… bash setup-preview.sh` のように付けて再実行 |
| プロジェクトIDが使われている | `PROJECT_ID=niho-experience-web2 bash setup-preview.sh` のように別のIDで再実行 |
| 権限がない（PERMISSION_DENIED） | 組織の管理者（プロジェクト作成・請求先の紐付けができる人）のアカウントで実行 |

最後に `GCP_…=…` の6行が表示される。パスワードや鍵ではない（貼り間違いを確認するためにチャットへ貼っても問題ない）。

## 手順2：GitHubの設定（オーナー、ブラウザで5分）

iPhoneの場合はSafariで github.com を開き、画面下の「aA」→「デスクトップ用Webサイトを表示」にすると Settings が出る。

**2-1. 配備できるブランチを `main` に限る**

1. https://github.com/niho-coliving/niho-experience/settings/environments を開く
2. **New environment** → 名前 `preview` → **Configure environment**
3. **Deployment branches and tags** で **Selected branches and tags** を選ぶ → **Add deployment branch or tag rule** → `main` → **Add rule**
4. 他は空のまま **Save protection rules**

**2-2. 手順1の6行を登録する**

1. https://github.com/niho-coliving/niho-experience/settings/variables/actions を開く（**Variables** タブ。Secretsではない）
2. **New repository variable** で、`=` の左を Name、右を Value にして6つ登録する

| Name | Value の例 |
| --- | --- |
| `GCP_PROJECT_ID` | `niho-experience-web` |
| `GCP_REGION` | `asia-northeast1` |
| `GCP_ARTIFACT_REPOSITORY` | `web` |
| `GCP_WIF_PROVIDER` | `projects/123456789012/locations/global/workloadIdentityPools/github/providers/niho-experience` |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `experience-deployer@niho-experience-web.iam.gserviceaccount.com` |
| `GCP_RUNTIME_SERVICE_ACCOUNT` | `experience-runtime@niho-experience-web.iam.gserviceaccount.com` |

値は手順1で表示されたものを使う（上は例）。

## 手順3：最初の配備

Actions → **Deploy preview** → Run workflow（branch: main）。5〜10分で終わり、実行結果の上部にプレビューのURL（`https://niho-experience-preview-….a.run.app`）が出る。以後は `main` へのmergeごとに自動で更新される。

## うまくいかない時

| 症状 | 確認すること |
| --- | --- |
| `auth` の段で `Permission 'iam.serviceAccounts.getAccessToken' denied` | 手順1を最後まで実行したか。権限の反映に数分かかることがある |
| `auth` の段で `unauthorized_client` / attribute condition | `main` 以外から実行していないか |
| `Deploy` の段で権限エラー | `GCP_RUNTIME_SERVICE_ACCOUNT` と `GCP_DEPLOY_SERVICE_ACCOUNT` の値が手順1の表示と同じか |
| URLを開くと403 | 組織のポリシーで公開が禁止されている可能性。Cloud Runの「認証が不要」が有効か確認する |

## Cloudflareについて

**プレビューにはCloudflareは不要。** Cloud RunのURLで見られる。

本番（独自ドメイン）では、NIHOappと同じくCloudflareを入口に置く。公開ドメインが決まった時に、次を決めてから設定する。

1. **ホスト名**：例 `experience.niho.life`。NIHOのDNSはCloudflareにある。
2. **入口の方式**（どちらかを選ぶ）：
   - **A. Cloud Runのドメインマッピング＋CloudflareのDNS**：費用が増えない。Googleの証明書の発行・更新のため、Cloudflareは「DNSのみ（グレーの雲）」で使う。WAFやCDNはCloudflareで効かない。
   - **B. GCPのロードバランサー＋Cloudflareのproxy（オレンジの雲）**：NIHOappの本番と同じ。WAF・CDN・攻撃対策が効く。ロードバランサーの月額費用がかかる。手順はNIHOappの `gcp/runbooks/prod-public-edge-control-plane.md` を基にする。
3. **cacheの設定**：Cloudflareでcacheするのは `/_next/static/*` と画像だけ。予約入力・決済後ページはアプリが `no-store` を返すので、cacheしない設定を確認する。

試験販売の前に、本番用のサービス（`niho-experience`、最小インスタンス1、実APIの設定）と配備workflowを追加する。その時にA・Bを決めてもらえれば、Claudeが設定手順をこの文書に追記する。
