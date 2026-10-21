# stg合成商品の実API受入

対象: Experience #39 / #42。実予約を受け入れる前の合成fixtureと接続条件の確認。

## 確認済み

- オーナー指定「推奨でよい」に従い、stg管理画面で合成原稿・単色の合成表紙・英語ページを保存し、公開した。
- 掲載同意はオーナーが実行時に承認。stgで申請→管理審査→掲載を行った。
- slug: `stg-synthetic-booking-acceptance`。通常の拠点紹介ページへの参加方法掲載はOFF。
- 商品: `Synthetic test session`、100円、30分、定員2名、1組1〜2名、月/木18:00、1日前締切、即時確定、24時間前まで無料キャンセル。
- stg決済キー2種類がテスト用、対象口座がREADY・受付可能であることを確認。キー・口座IDは記録しない。
- `verify:live -- --origin https://app-stg.niho.life` で一覧・詳細・開催枠200と未掲載slug404がすべてv1.0契約に一致。
- 公開詳細の `booking.checkoutAvailable=true`、開催枠に `bookable=true / seatsLeft=2` を確認。availabilityは `no-store`。
- 実APIと公開Booking文書を使う予約停止画面で、PC幅1600pxとモバイル幅320pxの横はみ出しなし、入力欄0、`noindex,nofollow`を確認。モバイルで「Back to the experience」から詳細へ復帰できた。
- 合成掲載を管理画面で停止した後、詳細・availabilityの両方が404／`no-store`に切り替わることを確認。
- 同じslugで掲載を再開し、一覧・詳細・開催枠・未掲載404のv1.0契約検証が再び成功。合成掲載は予約受入を続けられる状態で保持している。

## 接続待ち・未完了

- stg Webの `EXPERIENCE_SITE_ALLOWED_ORIGINS` は未設定。候補originからのOPTIONSは204だが許可ヘッダーがなく、ブラウザからの送信は未接続。
- 専用候補の配備はこのCORS設定を前提とする。設定不足のまま受入済みとせず、preflightで停止する。
- 実APIのゲスト入力→Checkout→テスト決済→webhook確定→取消、計測ブロック・満席・停止・失敗時復帰は未完了。
- このfixtureは既存の公開集合場所を使う。非公開集合案内の受入には使わず、v1.1/v1.2のprivate-meeting gateとは分ける。
- 合成表紙は機能確認用。実商品の写真・原稿・多言語・GA4/GSC接続の受入を代替しない。

ゲスト情報・予約token・Checkout URL・内部IDはこの記録に含めない。
