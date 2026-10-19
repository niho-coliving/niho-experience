# 体験サイトのアクセス計測に関する公開文案

更新：2026-10-19。#14の決定済み範囲に限る文案。**まだ公開・適用していない。** オーナーがNIHOの既存プライバシーポリシーとの整合を確認し、本番で `UMAMI_WEBSITE_ID` を設定して送信を始める前に掲載する。

## 日本語案

> NIHO Experienceでは、ページの利用状況と予約までの操作を把握し、体験の案内と予約画面を改善するためにUmami Cloudを利用します。閲覧したページ、体験の表示・日時選択・予約入力表示・決済開始などの操作、リンクに付いた流入元の識別子、使用するブラウザや端末の種類、おおよその地域などを送信します。氏名、メールアドレス、電話番号、申込時の回答、予約番号、決済情報はUmamiへ送りません。
>
この計測ではCookieや端末内の識別子保存を使いません。ブラウザの「Do Not Track」設定を尊重し、計測がブロックされても予約はできます。Umami Cloudの現在のプランでは、計測データの保存期間は6か月です。予約の確定と売上はNIHOの予約記録で管理し、Umamiの訪問者データと個人単位で結び付けません。

## English draft

> NIHO Experience uses Umami Cloud to understand which pages people view and where they stop in the booking flow. We use this information to improve experience descriptions and booking pages. We send page views, actions such as viewing an experience, choosing a date, seeing the booking form and starting checkout, source tags attached to our links, browser and device information, and approximate location. We do not send your name, email address, phone number, answers in the booking form, booking reference or payment details to Umami.
>
This measurement does not use cookies or store an identifier on your device. We respect your browser's Do Not Track setting. You can still book if measurement is blocked. Under our current Umami Cloud plan, measurement data is kept for six months. Confirmed bookings and sales are recorded by NIHO separately; we do not link them to an individual Umami visitor.

## 掲載前の照合

- [ ] 本番 `experience.niho.life` の送信先がUmami Cloudだけである。previewやmockからは送らない。
- [ ] 実際の送信内容が[`analytics-decision.md`](analytics-decision.md)と[`funnel-measurement.md`](funnel-measurement.md)の許可範囲に収まる。URLのqueryは許可したUTMだけ、予約関連のquery・hash・referrerのpath/queryは送らない。
- [ ] 計測イベントに自由記述、健康情報、予約token、StripeセッションID、個人の連絡先が入らない。計測を遮断しても予約操作が動く。
- [ ] Umamiのプランと保存期間を公開時に再確認する。広告タグ・cookie・session replay・個人単位の流入突合を追加するなら、この文案をそのまま流用しない。
- [ ] NIHOの既存ポリシーの管理者・問い合わせ先、外部送信の説明と矛盾しないようオーナーが統合する。掲載URLと掲載日を#14の受入に記録する。

根拠：[Umamiの計測項目](https://docs.umami.is/docs/metric-definitions)、[トラッカー設定とDo Not Track](https://docs.umami.is/docs/tracker-configuration)、[Hobbyプランの保存期間](https://umami.is/pricing)。Umamiの公式説明では、IPアドレスは地域の判定に用いるが保存しない。サイト実装が文案と一致するかは本番受入で別途確認する。
