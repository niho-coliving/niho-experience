# 予約ファネルのイベント（画面側）

[#14](https://github.com/niho-coliving/niho-experience/issues/14) のうち、画面が出すイベントの約束。計測ツール（GA4等）、同意の取り方、30日の実験計画、指標の分母・重複排除の定義は担当3と決める。実装は `apps/web/src/lib/analytics.ts`。

## 現状

- **どこにも送っていない。** 計測ツールと同意の扱いが決まるまで、本番では何も送らない。
- プレビュー（mock）では、ブラウザ内の `window.__nihoEvents` に記録し、開発者ツールのconsoleにも出す。E2Eで内容を検証している。
- 確定予約・売上は数えない。Checkoutへ進んだことは売上ではない。確定予約と売上は、NIHO共通基盤の確定データ（webhook後の台帳）を正にする。

## イベント

| イベント | いつ | 値 |
| --- | --- | --- |
| `list_view` | 一覧を表示 | `theme`（v0.1では `all`）、`date_filtered`（v0.1では `false`）、`result_count` |
| `experience_view` | 詳細を表示 | `experience`（slug）。v0.1のSSR詳細応答には残席がないため、availability は送らない |
| `slot_continue` | 日時・人数を選び「Continue」 | `experience`、`guests` |
| `booking_form_view` | 見積が取れて予約入力を表示 | `experience`、`guests`、`total_jpy` |
| `booking_unavailable` | 見積が取れず予約入力を出せない | `experience`、`error_code` |
| `checkout_start` | 予約入力で決済へ進むボタンを押した（入力不備でも1回） | `experience`、`guests`、`total_jpy` |
| `checkout_error` | 決済へ進めなかった | `experience`、`error_code`（`invalid_contact` / `slot_sold_out` / `unavailable` 等） |
| `host_view` | 提供者向けページを表示 | `signup_mode`（`pilot` / `open`） |
| `host_start` | 提供者の開始・問い合わせリンクを押した | `signup_mode` |

決済後の確認・復帰はNIHOが担当するため、このサイトでは支払結果のイベントを数えない。

## 個人情報を送らない仕組み

- イベントごとに許可した値だけを残し、それ以外は捨てる。
- 文字列は英小文字・数字・`-`・`_` の64文字以内だけを通す。氏名・メール・電話・メモ・URL・tokenは形の時点で落ちる。
- 予約入力の値、見積ID、idempotency key、URLのquery はイベントに含めない。
- v0.1の公開APIは一覧のテーマ/日付絞り込みやSSR残席を返さないため、それらを実行した扱いのイベント値を作らない。
- 計測ツールを入れる時は、ページビューのURLから `/experiences/*/book` と `/booking/*` のqueryを取り除く。session replay（画面録画）は予約入力・決済復帰で使わない。
- 計測の失敗や拒否で予約が止まらない（送信は投げっぱなしで、例外を握りつぶす）。

## 計測ツールを決めた後の作業

1. 担当3がツール・同意の方式・保存期間を決める（広告タグや有料契約は授権の確認後）。
2. `AnalyticsSetup`（`apps/web/src/components/Analytics.tsx`）で、同意がある時だけ `setAnalyticsSink` に送信処理を登録する。
3. CSPの `script-src` / `connect-src` に送信先を追加する（`apps/web/next.config.ts`）。
4. 同意しない場合でも一覧→予約→決済が動くことをE2Eで確認する。
5. ファネルの分母と重複排除を決める。例：`booking_form_view` から `checkout_start` までの率は、同じ見積で重複を数えるか。確定予約は共通基盤のデータと突き合わせる。
