# 計測ツールと同意の方式（決定案）

最終更新：2026-10-19（担当3）。対象：[#14](https://github.com/niho-coliving/niho-experience/issues/14)。担当1から依頼された「計測ツール、同意の取り方、保存期間」への回答。
**アカウントの作成はオーナーが行う。** 有料プランの契約と広告タグの導入は、それぞれの授権の後にする。

## 結論

| 項目 | 決定案 |
| --- | --- |
| 計測ツール | **Umami Cloud**（無料のHobbyプランで開始） |
| 同意 | cookie・端末への保存・独自の訪問者IDを使わない範囲では、**同意バナーを出さない案**。プライバシーポリシーと外部送信の公表で計測の内容を知らせ、Do Not Trackを尊重する |
| 保存期間 | Hobbyプランの保存期間（6か月）に従う。長く残す数字は、月ごとの集計を非公開台帳に写す |
| 送るもの | 担当1が実装した10イベント（[analytics-events.md](../analytics-events.md)）とページビュー。PII・token・クエリ文字列は送らない |
| 見送るもの | GA4・広告タグ・session replay。広告の授権が出たときに、同意の取得（CMP）と一緒に改めて検討する |

## 選んだ理由

2026-10-19にUmamiの公式ページで次を確認した（[料金](https://umami.is/pricing)、[設定](https://docs.umami.is/docs/tracker-configuration)）。

- Hobbyプラン：月10万イベントまで無料、保存期間6か月。Proプラン：月100万イベントで月$20、保存期間2年。
- 独自イベント・イベントの値・ファネルが無料プランから使える。
- cookieを使わず、個人データを集めないとしている。
- オープンソースで、自前で運用することもできる。規模や保存期間が合わなくなったら、Cloud Runでの自前運用に移せる。

v1の規模（少数の体験、30日の検証）では、無料枠と6か月の保存期間で足りる見込み。ただしイベント数は実測で確かめる。

### 比べた他の選択肢

| ツール | 見送った理由 |
| --- | --- |
| Google Analytics 4 | cookieや広告識別子などの利用と地域別の同意設計が必要になる。GoogleのConsent Mode自体は同意を集める画面を提供しないため、採用時はCMP等の取得方法と地域別要件を先に確認する（[Google](https://support.google.com/analytics/answer/9976101)）。広告を始めるときに改めて検討する |
| Plausible | cookieを使わない点は同じ。2026-10-19の時点で公式の料金ページを確認できず、ファネルとイベントの値が含まれるプランと料金を検証できなかった |
| PostHog | session replayなど、v1では使わない機能が多い。cookieを使わない設定（`persistence: "memory"`）ではページをまたぐと同じ訪問者として扱われず、ファネルが成り立たない（[PostHog](https://posthog.com/docs/libraries/js/persistence)） |
| Cloudflare Web Analytics | 独自イベントがなく、ファネルを測れない |

## 設定（担当1が実装）

| 設定 | 値 | 理由 |
| --- | --- | --- |
| `data-domains` | 公開ドメイン（決定後） | プレビューや別のホストで動かさない |
| `data-do-not-track` | `true` | ブラウザのDo Not Trackを尊重する |
| `data-exclude-hash` | `true` | URLのハッシュを送らない |
| `data-before-send` | 関数を用意する | クエリ文字列は `utm_source`・`utm_medium`・`utm_campaign`・`utm_content` だけを残す。`/experiences/*/book` と `/booking/*` はクエリをすべて落とす。予約入力の値は送らない |
| `data-distinct-id` | 使わない | 訪問者に識別子を付けない |
| `data-performance` | 使わない（必要になったら検討） | v1の目的に要らない |

- UTMをページビューで受け取るため、`data-exclude-search` は使わず、上の `data-before-send` で残す値を絞る。
- 送信先のホストをCSPの `script-src` と `connect-src` に加える。
- プレビュー（mock）では送らない（現状どおり `window.__nihoEvents` に記録）。
- NIHO運営の内部アクセスは、Umamiの「自分の訪問を除外」の機能で除く。手順はアカウント作成後に公式の案内で確認する。

## サイト登録と実装

- Umami Cloudのサイト名は `NIHO Experience`、登録ドメインは `experience.niho.life`。
- Website IDは `f7a8b3ed-ef71-4a35-969e-955b88f01902`。公開IDのためコードへ直書きせず、`UMAMI_WEBSITE_ID` の実行時環境変数で渡す。
- `UMAMI_WEBSITE_ID` が設定され、APIモードが `http` で、`SITE_URL` が `https://experience.niho.life` と完全一致する場合だけトラッカーを読み込む。preview（mock）と他ホストでは送信しない。
- 現時点で本番サービス・本番配備workflowは未作成。将来、本番サービスを作る際にこのIDを本番サービスだけへ設定し、プライバシーポリシーへ計測内容を追記してから送信を有効にする。previewには設定しない。
- ブラウザの `Do Not Track` を尊重し、URLは許可したUTMだけ残す。予約入力URL・予約結果URLのqueryや予約結果識別子、URL hash、リファラーのpath/queryは送らない。

## 同意と公表

- 同意バナーは出さない。計測をブロックされても予約は同じように動く（担当1の実装どおり）。
- この案は、cookie・端末保存・独自の訪問者IDを使わない計測に限る。`attribution_id` をsessionStorage等へ保存して予約と結び付ける変更は前提外であり、コードやデータ保存を始める前にオーナーと担当2が同意・公表の要否、目的、保存期間、閲覧権限を判断して承認する。承認までは識別子を生成・保存・送信しない。
- プライバシーポリシーに、計測ツールの名前、送る情報（閲覧したページ、イベント、おおよその地域・端末の種類など）、目的、保存期間を書く。文面はNIHOの既存のポリシーとそろえ、他の追記と合わせて後でまとめて行う（2026-10-19 オーナー決定）。本番で計測の送信を始める前に済ませることを推奨する。
- 電気通信事業法の外部送信規律：今回の内容（この文書の計測）までは問題ないことをオーナーが確認した（2026-10-19）。送る情報や送信先を増やすときは改めて確認する。
- cookieを使う計測や広告タグを入れる場合は、先に同意の取得を設計する。地域ごとの初期設定もそのときに決める。

## 役割

| 作業 | 担当 |
| --- | --- |
| Umami Cloudのアカウントとサイトの登録（無料プラン）。サイトIDを担当1に渡す（秘密ではない） | オーナー |
| 送信処理、`data-before-send`、CSP、計測をブロックしても予約できることのE2E | 担当1 |
| ファネル（`experience_view` → `slot_continue` → `booking_form_view` → `checkout_start`）とUTM別の表示の設定、週次の振り返り | 担当3 |
| 予約確定・売上の集計（計測ツールではなく共通基盤から） | 担当2 |

ファネルの分母と重複排除は [funnel-measurement.md](funnel-measurement.md) の「ファネルの分母と重複排除」に定義した。
