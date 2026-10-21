# 公開文書のstg受入（2026-10-21）

対象: #39 / #42。#54の公開運用部分。実施者: paneB-8。

## 環境と確認範囲

- NIHO stgの認証済みエディターで、安全な合成原稿を保存・公開・復帰した。本番の原稿・掲載・予約・決済・Google設定は変更していない。
- 公開文書API: `https://app-stg.niho.life/api/public/experiences/pages/{home|booking}/en`。認証なしのGETで確認。
- Experience consumer: main `b3dd47ccb7876aa3cb581516e1fb16eb19e0c58f` をローカルで起動し、`EXPERIENCE_API_MODE=http` / API v1.2 / `SITE_INDEXING=block` で確認した。公開Cloud Runの受入結果ではない。
- Chromeの通常プロファイルを利用。予約画面は320pxと1280pxで確認した。スマートフォン実機の結果ではない。

## 実際の保存・公開・復帰

両ページとも、開始時は公開文書がなくAPIは404だった。必須のExperienceGrid / BookingPanelを残し、ページタイトルとテスト用見出しだけを編集した。

| 操作 | Home | Booking |
| --- | --- | --- |
| 安全な原稿を下書き保存し、差分確認後に初回公開 | revision 2、10:17 JST | revision 2、10:20 JST |
| 本文をupdatedへ変更して下書き保存 | 公開APIはrevision 2のbaselineを維持 | 下書き保存成功 |
| 差分確認後に更新版を公開 | revision 3、10:19 JST | revision 3、10:26 JST |
| baselineの旧版を選び、差分確認後に復帰 | revision 4 | revision 4 |
| 最終API確認（10:27 JST） | HTTP 200 / `Cache-Control: no-store` | HTTP 200 / `Cache-Control: no-store` |

最終本文は `Staging acceptance · baseline` / `Staging booking · baseline`。updated本文は残っていない。復帰は旧revisionの内容を新しいrevision 4として保存し、旧公開版を上書きしない。

Homeは、下書きのみの変更では公開本文が変わらず、公開後の次のSSRでupdatedへ変わり、復帰後の次のSSRでbaselineへ戻ることを確認した。初回未公開によるHome・BookingのAPI 404は、このstgの英語ページについて解消した。

## 予約画面の表示確認

stgの商品一覧はHTTP 200で0件だったため、実商品の予約ページは確認できない。追加の画面検証では、公開文書のGETだけを実stgへ転送し、商品・開催回は既存の合成fixtureへ隔離したローカル検証サーバーを使った。GET以外は405とし、予約・Checkout要求を実環境へ転送しない。

| 合成商品の状態 | 結果 |
| --- | --- |
| 予約可能なdinner | 実公開Booking原稿と日時・人数フォームをSSR。日時選択後、予約者入力へ進めた |
| 停止中のpottery | 同じ実公開原稿と停止案内をSSR。日時選択・入力フォームは出ず、体験詳細へ戻れる |
| 320px / 1280px | 主要操作とフォームを表示。横はみ出しなし |

個人情報・同意は入力せず、決済へは進めていない。合成商品の写真表示は今回の合否対象外。実商品の写真・代替文や決済・在庫競合を受入済みとは扱わない。ローカルNext devのHTTPキャッシュヘッダーは、本番配備の`no-store` / CDN確認の代用にしない。

## 残る公開ゲート

- 承認済みのstg商品・開催回を用意し、実APIだけで予約可能・停止・満席・失敗時の復帰を確認する（#42）。
- 配備済みのExperience consumerで、公開原稿のSSR、更新、復帰、CDNキャッシュを再確認する（#39）。
- 初回未保存状態を案内するniho-web修正と、NIHOホストの`hasSavedDraft`接続を配備して受入する（niho-web #54 / PR #55）。今回のエディターはその修正の配備受入ではない。
- stgの公開確認ダイアログが本番ドメインを表示するため、環境と反映先を誤認しない表示・設定に直す（[NIHOapp #19264](https://github.com/niho-coliving/niho-app/issues/19264)）。実書込み先はstgで確認した。
- 本番向けの写真・原稿、販売条件、検索公開、予約開始は既存の公開ゲートを満たしてから切り替える。

#39 / #42 / #54は未完了部分があるため、この記録だけではcloseしない。

## 公式公開API検証

`npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life --api-version 1.0` は成功。空の商品一覧（200）と未掲載slug（404）の応答・キャッシュ・Cookie・機密値の契約検証を通過した。0件のため、掲載商品の詳細・開催回は走っていない。v1.1/v1.2の切替・予約・決済を受入済みとは扱わない。
