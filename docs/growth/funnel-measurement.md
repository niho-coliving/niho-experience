# 予約ファネルの計測設計

最終更新：2026-10-19（担当3）。対象：[#14](https://github.com/niho-coliving/niho-experience/issues/14)。
計測ツールの選定と実装は担当1、確定予約・売上・流入情報の保存は担当2。この文書はイベント契約と指標の定義を決める。

## 原則

- **確定予約と売上は共通基盤の確定データを正とする。** Checkout開始やStripeからの戻りURLを予約・売上として数えない。
- 計測に個人情報、予約token、非公開URL、決済セッションIDを送らない。
- 計測を拒否した人も同じように予約できる。計測の読み込み失敗で予約の操作を止めない。
- 分母・期間・重複排除・流入条件を指標ごとに記録する。

## ファネルの段階

```mermaid
flowchart LR
  L[一覧] --> D[詳細]
  D --> S[枠・人数の選択]
  S --> F[予約入力の開始]
  F --> C[Checkout開始]
  C --> R[予約リクエスト受付]
  R --> A[予約確定]
  A --> P[参加]
  R -.-> X[辞退・期限切れ]
  A -.-> Z[取消・返金]
```

L〜Cはブラウザの計測（cookieを使わない計測ツール。[analytics-decision.md](analytics-decision.md)）。R以降は共通基盤の記録（全件）。
リクエスト予約では、Rは「カードの与信と提供者への承認依頼」、Aは「提供者の承認と決済の確定」。即時予約ではRとAが同時に起きる。

## ブラウザのイベント（担当1が実装済み）

イベント名と値の正本は [docs/analytics-events.md](../analytics-events.md)（担当1、`apps/web/src/lib/analytics.ts`）。この文書の当初案（`slot_select` など）は実装の名前に読み替える。

| ファネルの段階 | 実装のイベント | 使う値 |
| --- | --- | --- |
| 一覧 | `list_view` | `result_count` |
| 詳細 | `experience_view` | `experience` |
| 枠・人数の選択 | `slot_continue` | `experience`、`guests` |
| 予約入力の表示 | `booking_form_view` | `experience`、`guests`、`total_jpy`（見積。売上ではない） |
| 予約入力を出せない | `booking_unavailable` | `experience`、`error_code` |
| Checkout開始 | `checkout_start` | `experience`、`guests`、`total_jpy`（同上） |
| Checkoutへ進めない | `checkout_error` | `experience`、`error_code` |
| 提供者向け | `host_view`、`host_start` | `signup_mode` |

当初案の `experience_card_click`（表示位置）と `checkout_return` は実装しない。決済後の状態はNIHOが表示し、このサイトでは支払結果を数えない。

### ファネルの分母と重複排除（担当1からの質問への回答）

Umami の `visitor` を単位にする。これは人そのものではなく、サイトID・hostname・User-Agent等と月初に変わるsaltから作るsession hashである（[公式のmetric定義](https://docs.umami.is/docs/metric-definitions)）。同じhashが月内の複数日に残ることがあるため、週や月を一度に指定したレポートでは期間中のvisitorとしてまとめて数えられ、「体験×visitor×日」の単位にならない。

| 率 | 分子 | 分母 | 重複排除 |
| --- | --- | --- | --- |
| 詳細→枠選択 | 同じ体験で `slot_continue` のあった訪問者 | 同じ体験で `experience_view` のあった訪問者 | 体験×訪問者×日で1回 |
| 枠選択→予約入力 | `booking_form_view` のあった訪問者 | `slot_continue` のあった訪問者 | 同上。人数を変えて見積を取り直しても1回 |
| 予約入力→Checkout開始 | `checkout_start` のあった訪問者 | `booking_form_view` のあった訪問者 | 同上。同じ見積で何度押しても1回 |
| Checkoutへ進めない割合 | `checkout_error` の件数 | `checkout_start` の件数 | 件数で数え、`error_code` 別に出す（入力不備での再試行も見える） |
| 予約入力を出せない割合 | `booking_unavailable` の件数 | `slot_continue` の件数 | 件数・`error_code` 別 |
| 予約確定率（参考値） | — | — | 現状は算出しない。共通基盤の確定予約件数とUmamiのvisitor-dayを別々に報告する。visitor単位の結合は、同意・公表方針と安全な結合方法の承認後に再定義する |

- 期間はJSTの暦日。週次の振り返りは月曜0時〜日曜24時。
- Umamiでは各イベントstepに `experience` が対象slugと一致するフィルターを設定し、体験ごとに日次ファネルを実行する。Umami Cloudはファネルのstepごとのフィルターに対応している（[公式changelog](https://docs.umami.is/docs/cloud/changelog)）。
- 日次ファネルのvisitor数を週・30日分それぞれ合計し、率は合計した分子÷合計した分母で計算する。日ごとの率は平均しない。同じvisitor hashが別の日に再訪した場合は、その日ごとに1回ずつ数える。週・月の合計を「人数」とは表現しない。
- Umamiのファネルは順序どおりのstepを設定した `Window` 内に完了したvisitorを数える（[公式Funnel仕様](https://docs.umami.is/docs/funnel)）。初期の検証では隣接するstep間の `Window` を60分に固定し、週次記録にも設定値を残す。日をまたぐstepや60分を超えたstep間の遷移は、その日次ファネルの完了に含めない。
- NIHO運営の内部アクセスは計測ツールの「自分の訪問を除外」の機能で除く（[analytics-decision.md](analytics-decision.md)）。
- プレビュー（mock）のイベントは計測ツールへ送らない（担当1の実装どおり）。

### 送らないもの

氏名、メールアドレス、電話番号、備考欄（アレルギー等の健康情報を含みうる）、予約token、予約確認URL、Stripeのセッション ID、予約・決済ページのクエリ文字列を含む完全なURL、IPアドレスの保存。
予約入力・Checkout・予約確認のページではsession replayを使わない。v1ではsession replay自体を使わない案を推す。

## 共通基盤の記録（担当2）

| 状態 | 記録する時刻 | 集計に使う属性 |
| --- | --- | --- |
| 予約リクエスト受付 | requested_at | booking_id、experience、option、開催日、人数、見積額 |
| 予約確定 | confirmed_at | 確定額（税込・円）、販売・提供主体 |
| 辞退・期限切れ | declined_at / expired_at | 理由の区分 |
| 取消 | cancelled_at | 取消した側（旅行者・提供者・天候・最少催行未達）、返金額 |
| 参加・不参加 | 開催日の後 | 参加 / 不参加（提供者またはNIHO運営が記録） |

### 流入の突き合わせ（担当2への依頼）

ブラウザの計測と確定予約を、計測サービスへ直接識別子を送らずに結び付けるため、ゲストCheckout APIに次の任意項目を受け付けてほしい。

| 項目 | 内容 |
| --- | --- |
| `attribution_id` | 将来案。予約情報と結び付く仮名識別子として扱う。sessionStorageへの保存、APIへの送信・保管、Umamiのvisitorとの結合方法は、同意・公表の要否、利用目的、保存期間、閲覧権限とともにオーナーと担当2が決めて承認するまで実装しない。承認前は予約とvisitorを結び付けず、予約確定件数と計測値を別々に報告する |
| `utm_source` / `utm_medium` / `utm_campaign` / `utm_content` | 最初の流入時の値。許可した文字種だけ |
| `landing_page_type` | 最初に見たページの種類 |

APIの対応前は、予約フォームの任意の質問「How did you hear about us?」（選択式）で代替できるかをオーナーと担当2に相談する。NIHOapp側には予約時の質問を設定する仕組みが既にある。

## 流入の識別（UTM）

| パラメータ | 値の例 | 規則 |
| --- | --- | --- |
| `utm_source` | `niho_space`、`niho_instagram`、`niho_line`、`niho_site`、`partner_a01` | 小文字・英数字・アンダースコア。提携先は公開文書では匿名のコード（a01など）にし、対応表は非公開台帳に置く |
| `utm_medium` | `qr`、`social`、`referral`、`email`、`print` | 媒体の種類 |
| `utm_campaign` | `pilot_2026q4` | 検証の期間単位 |
| `utm_content` | `table_card`、`entrance_poster`、`story_1103` | 置き場所・投稿の区別 |

OTA経由の予約はOTAの管理画面で数える。OTAからこのサイトへの誘導は行わない（[pilot-30day-plan.md](pilot-30day-plan.md)）。
NIHO運営の内部アクセスは、計測ツールの「自分の訪問を除外」の機能で除く。IPアドレスによる除外は使わない。

## 指標の定義

期間の区切りはJST。ファネル指標は「その日に起きたイベント」で、取消・参加は「開催日」で数える。

| 指標 | 分子 | 分母 | 重複排除・注意 |
| --- | --- | --- | --- |
| ファネルの各率 | 上の「ファネルの分母と重複排除」 | 同左 | 同左 |
| 予約確定率（サイト） | 現段階では算出しない | — | `attribution_id` とvisitorの結合は未承認。Umamiの訪問とNIHOの予約を同一人物として突き合わせない |
| 承認率 | 予約確定 | 予約リクエスト受付 | リクエスト予約の商品だけ。booking_idで一意 |
| 客単価 | 予約確定の確定額の合計（税込・円） | 予約確定の件数 | 1予約あたりと1名あたりを両方出す。返金は別に集計 |
| 提供者対応時間 | confirmed_at − requested_at | — | 中央値と90パーセンタイル。予約前の質問への初回返信時間はNIHO運営の対応記録から |
| 取消率 | 取消された予約確定 | 開催日が期間内の予約確定 | 取消した側と理由で分ける |
| 不参加率 | 不参加 | 開催日が期間内で取消されなかった予約確定 | |
| チャネル別の予約数 | 流入元がNIHO側に記録された確定予約だけ | — | 流入元のAPI記録が未実装の間は算出しない。OTAはOTA管理画面の件数を別集計。UmamiのUTM別訪問を予約件数へ読み替えない |

### 週次・30日の突合手順

1. JSTの期間を固定する。Umamiは同じ期間の体験別・UTM別の日次イベントと60分Windowのファネルを記録し、計測できた訪問だけを数える。
2. NIHO共通基盤では、`booking_id` を一意キーに、同期間に `confirmed_at` が入った確定予約の件数と確定額（税込JPY）を出す。リクエスト受付、Checkout開始、決済復帰は含めない。重複webhookで同じ予約を二度数えない。
3. 取消・返金は別列で出す。期間中の確定額、期間中に実行した返金額、差引額を混同しない。取消率は開催日が期間内の確定予約を母数にし、申込日基準の確定件数と異なる集計であることを記す。
4. 予約の `utm_*` がNIHO側の承認済み仕様で保存されるまでは、**体験別のUmamiファネルと全件の確定予約・売上を横並びで報告**する。導線別の予約率・売上・手取りは出さない。OTAの予約はOTA管理画面とNIHO台帳の重複がないか運営が照合する。
5. 非公開台帳へ抽出日時、期間、時区、NIHO側の抽出方法・対象状態、UmamiのフィルタとWindow、除外条件、欠測を記録する。公開Issueには判断と未完了事項だけを書く。

## 同意と計測拒否

- v1の計測はcookieや端末への保存を使わない方式にし、同意バナーを出さない（[analytics-decision.md](analytics-decision.md)）。ブラウザのDo Not Trackの設定は尊重する。
- 計測の読み込みに失敗したり、ブロックされたりしても、予約入力・Checkout・確認への遷移は同じように動く。
- ブロックされた訪問は分母に入らない。報告では計測ツールの数字と、予約確定の総数（共通基盤、全件）を並べる。
- cookieを使う計測・広告タグ（GA4等）を入れる場合は、同意の取得（CMP）を先に設計する。

## 受入の確認

- 合成データで一覧→詳細→枠選択→Checkout開始までのイベントが、上の属性だけで送られることを確認する（担当1）。
- 送信内容に氏名・メール・電話・備考・token・決済IDが含まれないことを、開発者ツールの送信記録で確認する（担当1）。
- 計測をブロックした状態でCheckoutまで進めることを確認する（担当1）。
- 予約確定の件数と金額を共通基盤から取得し、Checkout開始の件数と別に報告できることを確認する（担当2）。
