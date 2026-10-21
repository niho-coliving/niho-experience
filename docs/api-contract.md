# 公開API契約（v1.2.0・合意済み／配備前）

作成日：2026-10-19。担当：契約・NIHO連携（[#7](https://github.com/niho-coliving/niho-experience/issues/7)）。

**状態：仕様合意済み（agreed）・v1.2.0、NIHO側PR #19160/#19161/#19267 の配備待ち。** 正本は NIHO 共通基盤の `contracts/openapi.yaml` です。このサイトでは NIHO の公開契約から、利用する path と項目だけを選んで `packages/api-client/contract/experience-public-api.openapi.json` に管理します。サイトで扱わない帰属計測項目や NIHO Web 文書APIは含めません。sha256 は選別済み契約ファイルの破損検知に使います。v1.1詳細の `meetingOverview` はNIHOの #19267 が追加した項目で、API配備後に `verify:live` で確認します。

実 API と接続済みかどうかは、NIHO の配備と `verify:live`（§11）の結果で判断します。サイトは `EXPERIENCE_PUBLIC_API_VERSION=1.2` が明示された場合だけフィルターを表示してv1.2一覧を呼びます。仮契約 v0.1.0 からの変更は §14 にまとめています。

機械可読の契約は [`packages/api-client/contract/experience-public-api.openapi.json`](../packages/api-client/contract/experience-public-api.openapi.json)、公開項目の規則は [`public-field-policy.json`](../packages/api-client/contract/public-field-policy.json) です。この文書と食い違ったら JSON を正とし、文書を直します。

## 1. 境界

| 持つ側 | 持つもの |
| --- | --- |
| このリポ | 画面、SSR/SEO、表示用の計算（合計の表示・日本時間の表示）、この契約のクライアント・型・合成 mock |
| NIHO 共通基盤 | 掲載の可否、価格・在庫・販売者・決済口座の確定、席の仮押さえ、Stripe Checkout、webhook、予約確認ページ、メール、返金、売上台帳 |

- 画面担当は、この契約と mock だけで一覧・詳細・予約入力・失敗状態を作れます。NIHO のリポ・DB・資格情報は要りません。
- 契約に無い項目・操作が必要になったら、画面側で代用を作らず連携担当（#7）へ要望を出します。

## 2. 接続方式

- 接続先は NIHO の公開 Web origin の `/api/public/experiences`（本番 `https://niho.life`、stg `https://app-stg.niho.life`。値は配備設定で渡す）。API サーバーへ直接つながない。
- 認証は使いません。Cookie・Authorization を送らず、NIHO のログイン状態をこのサイトへ持ち込みません。
- 一覧・詳細はサーバー（SSR）から読んでよい。応答の `Cache-Control`（最長 `public, max-age=60, stale-while-revalidate=300`）より長く保持しません。
- 残席と checkout は**旅行者のブラウザから**送ります。checkout をサイトのサーバーから代理送信しません（NIHO の IP ごとの申込制限が旅行者単位で効くこと、旅行者の入力がこのサイトのサーバー・ログを通らないことのため）。
- ブラウザからの要求は `credentials: "omit"`・`Referrer-Policy: no-referrer`。NIHO は**登録された体験サイトの origin だけ**に、この path の `GET`（残席）と `POST`（checkout）の CORS を返します。CORS は認可ではないため、価格・在庫・掲載の判定は NIHO が毎回行います。

## 3. 操作

| 操作 | method / path | どこから | キャッシュ |
| --- | --- | --- | --- |
| 一覧 | `GET /api/public/experiences?region=` | SSR | 60 秒まで |
| 詳細 | `GET /api/public/experiences/{experienceSlug}` | SSR | 60 秒まで |
| 写真alt付き一覧 | `GET /api/public/experiences/v1.1/catalog?region=` | SSR | 60 秒まで |
| テーマ・開催予定日付き一覧 | `GET /api/public/experiences/v1.2/catalog?region=&theme=&availableOn=` | SSR | 60 秒まで |
| 写真alt・提供者bio・公開集合概要付き詳細 | `GET /api/public/experiences/v1.1/{experienceSlug}` | SSR | 60 秒まで |
| 開催回と残席 | `GET /api/public/experiences/{experienceSlug}/availability?offerId=` | ブラウザ | `no-store` |
| 予約の開始 | `POST /api/public/experiences/{experienceSlug}/checkout` | ブラウザ | `no-store` |
| 画像 | `GET /api/public/experiences/{experienceSlug}/media/{mediaKey}?v=` | ブラウザ（`<img>`） | 1 時間（`v` が変われば別の URL） |

- 掲載中でない体験（不存在・下書き・審査中・停止・販売者の準備が外れた）は、区別せず本文なしの 404 です。
- `experienceSlug` は体験サイトでの slug です。NIHO の拠点・ページの slug や内部 ID ではありません。掲載後は変わりません。
- v1.0 の応答は `additionalProperties: false` なので、v1.1 の `alt`、`bio`、`meetingOverview` は別の読取 path にだけ載せます。画面担当②は `listExperiencesV11` / `getExperienceV11` を使えます。旧 path と旧 client はそのまま使えます。
- v1.2一覧の `themes` は掲載審査で管理者が明示した値だけです。テーマは本文から推定しません。`availableOn` は日本時間の日付に開催予定がある商品だけを返し、残席・予約可否を示しません。実際の予約可否はブラウザから残席を再確認し、checkoutで確定します。
- 画像の URL は詳細・一覧が返すもの（`PublicExperienceImage.url`）をそのまま使い、組み立てません。`v` は画像の版で、差し替えると URL が変わり、古い `v` は 404 になります。中身は EXIF を除いた WebP の派生だけで、objectKey・署名・期限を URL に含みません。

## 4. 公開してよい項目・出さない項目

全 object は閉じた形（`additionalProperties: false`）で、応答の項目は常に返します（値が無いときは `null` か空配列）。新しい項目は「禁止されていないから足す」のではなく、公開の目的と同意の根拠をここへ書いてから足します。

| 項目 | 公開 | 根拠・条件 |
| --- | --- | --- |
| 題名・紹介・見どころ・当日の流れ・説明・含まれる/含まれない・注意事項 | ○ | 提供者が公開ページ用に書き、掲載に同意した本文 |
| 写真 | ○（派生画像の URL だけ） | EXIF を除いた公開用の派生。保存先（objectKey）・原本・署名の仕組みは出さない |
| 迎える人 | ○（表示名・顔写真・v1.1 の紹介文） | bio は本人が掲載を許諾した本文だけ。ユーザー ID・連絡先は出さない |
| 提供者 | ○（名前・種類・ひとこと・ロゴ） | 公開ページの表示用。外部提供者は `INDIVIDUAL` / `BUSINESS` |
| 写真の説明 | ○（v1.1 の `alt`） | 原稿の写真と同時に提供者が保存した200字以内の説明。未入力は null |
| 販売者 | ○（表示名・特定商取引法の表示 URL） | 決済の相手を予約前に示すため |
| 集合場所 | 条件つき | 公開可能な概要だけ `meetingOverview`（v1.1、200字以内、nullable）で示せる。住所・アクセス・入口案内・地図URLは含めない。公開可能な場所だけ `meetingPoint` を返す。個人宅・非公開住所は `AFTER_BOOKING` で `meetingPoint` を常に `null` にし、詳しい案内は予約確定後に NIHO の確認ページとメールだけで伝える（この規則は `createContractValidator` が確かめる） |
| 料金・定員・上限人数・最少人数・所要・開始時刻・曜日・取消条件・受付方式・申込時の質問 | ○ | 予約前の確認に必要 |
| 開催回の残席 | ○（`no-store`） | 表示の目安。確保は checkout |
| 旅行者の名前・メール・備考・回答 | 送るだけ | checkout の要求にだけ入る。応答・ログ・URL・計測・storage に複製しない |

出さない項目（契約のどの応答にも入れない）：顧客・旅行者の情報、予約・売上、未公開の原稿、審査メモ、非公開の集合場所と座標、提供者の連絡先・本人確認、拠点・ページ・予約・ユーザー・決済の内部 ID、Stripe の口座・顧客・決済 ID、PaymentEntity、保存先の objectKey、管理者 token、秘密鍵。名前の規則は `public-field-policy.json`、検査は `packages/api-client/test/contract.test.ts` です。

## 5. 値の意味

- **金額**：円の整数・税込・1 人あたり。合計 = 大人の人数 × `adultPriceYen` + 子どもの人数 × `child.priceYen`。追加料金・手数料の上乗せは無い。`child` が `null` の商品は子どもを受け付けない。
- **時刻**：`startAt` / `endAt` / `updatedAt` / `generatedAt` は UTC の ISO 8601。`date` と `startTime` は日本時間（Asia/Tokyo）。画面には日本時間であることを明示する（`toJstDateTimeParts`）。
- **残席の鮮度**：`availability` は要求のたびに数えた値（`generatedAt`）。表示の目安で、席は checkout の時点で NIHO が確保する（31 分の仮押さえ）。一覧・詳細には残席を入れない。
- **取消条件**：`FREE_UNTIL_24H` / `FREE_UNTIL_48H` は開始の 24 / 48 時間前まで全額返金、`NONE` は返金なし。申込の時点の条件が予約に固定される。期限は `freeCancellationDeadline`。
- **受付方式**：`INSTANT` は決済で確定。`APPROVAL` はカードの仮押さえの後に提供者が承認して確定し、承認されなければ請求しない。ボタンの文言を変える（例：Request to book）。
- **販売者**：`seller` は決済の相手で、`provider`（体験を提供する人・場）・体験サイトの運営者・サポート窓口とは別に表示する。
- **言語**：`contentLanguage` は原稿の言語。v1 は英語の体験だけを掲載する。
- **正規 URL**：`canonicalUrl` は NIHO が決め、画面はそのまま `link rel=canonical` に使う（NIHO 側のページと二重に index されないよう両側で揃える）。
- **画像**：URL は応答から少なくとも 1 時間有効。保存・再配信しない。
- **申込の可否**：`booking.checkoutAvailable` が `false` の体験は、紹介は出してよいが予約の入口を出さない。

## 6. ゲスト予約の流れ

1. 詳細から商品・料金・販売者・取消条件・同意文書（`booking.legalDocuments`）を読む。
2. ブラウザで残席を読み、予約できる開催回だけを選べるようにする。
3. 予約入力：名前・メール・（任意の）備考・申込時の質問だけ。合計・販売者・取消条件・同意文書を送信前に見せる。会員登録は求めない。
4. `POST …/checkout`。`clientRequestKey`（試行ごとの UUID）と、画面に出した合計 `expectedTotalYen` を送る。オーナー承認（2026-10-20）により、任意の `utmSource` / `utmMedium` / `utmCampaign` / `utmContent`（小文字英数字・`_`・`-` の1〜64字）だけを送れます。値は同一タブのナビゲーション中だけメモリに保持し、cookie・端末保存・訪問者IDは使いません。Do Not Track が有効な場合は収集・送信しません。NIHOはUTMを予約行の既存保持期間・閲覧権限で扱い、確定予約の集計にだけ使います。Umamiの訪問者とは結合しません。
5. `201` の `checkoutUrl` へ遷移する。遷移先が Stripe Checkout（`https://checkout.stripe.com`）か NIHO の予約確認ページでなければ遷移しない（`isAllowedCheckoutRedirect`）。
6. 決済の後、Stripe は **NIHO の予約確認ページ**へ戻す。確認中・確定・要対応の表示と確認メールは NIHO が行う。決済を取りやめたときは、体験サイトの `/experiences/{experienceSlug}?checkout=cancelled` へ戻る（入力は旅行者の同じタブに残してよい）。
7. 戻り先は NIHO が登録情報から作る。要求に戻り先 URL を入れない。このサイトは「予約完了」を表示しない（確認中を成功と誤表示しない）。

ブラウザから金額・販売者・決済口座は確定できません：要求にそれらの項目は無く、`expectedTotalYen` は「表示した合計と違えば止める」ための照合だけに使います。請求額は NIHO が商品の料金と人数から計算し、決済は販売者の Stripe 口座（Connect Direct）で行います。

## 7. エラーと再送

| code | status | 意味 | 席 | 画面の対応 |
| --- | --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 本文が JSON でない等 | 作らない | 実装の誤り。入力を直す |
| `INPUT_INVALID` | 422 | 項目の誤り（`field`） | 作らない | その項目を直す（新しい key） |
| `ANSWERS_INVALID` | 422 | 質問形式・選択肢 ID・回答の字数（`questionId`） | 作らない | その質問を直す |
| `CONSENT_OUTDATED` | 422 | 同意文書の版が古い | 作らない | 詳細を読み直して同意し直す |
| `OCCURRENCE_INVALID` | 422 | 開催回でない・締切後・受付停止（`occurrenceReason`） | 作らない | 残席を読み直して選び直す |
| `UNAVAILABLE` | 409 | 今は申込を受けていない | 作らない | 予約の入口を閉じる |
| `FULL` | 409 | 残席が足りない（`seatsLeft`） | 作らない | 残席を読み直す |
| `HOLD_LIMIT` | 409 | 決済中の申込が多い | 作らない | 少し待つか別の回を案内 |
| `QUESTIONS_CHANGED` | 409 | 質問が変わった・必須の回答が無い | 作らない | 詳細を読み直して答え直す |
| `PRICE_CHANGED` | 409 | 表示した合計と違う（`currentTotalYen`） | 作らない | 新しい合計を見せて確認し直す |
| `REQUEST_MISMATCH` | 409 | 同じ key で別の内容を送った | 作らない | 内容を確かめて新しい key で送る |
| `RATE_LIMITED` | 429 | IP ごとの上限（`Retry-After`） | 作らない | 秒数だけ待つ |
| `CHECKOUT_UNAVAILABLE` | 503 | 決済画面を用意できなかった | 解放済み | 同じ key・同じ内容で時間をおいて再送 |

- 通信の失敗・時間切れは、**同じ `clientRequestKey`・同じ内容**で再送します。NIHO は同じ申込として扱い、同じ `checkoutUrl` を返します（二重予約は NIHO が防ぐ。画面の二重クリック防止だけに頼らない）。
- 人数・日付・名前など内容を変えたら key を作り直します。
- 対応の判定は `checkoutRecoveryFor(code)` にまとめています。`message` は開発者向けで、画面の文言は `code` から作ります。
- 失敗の本文は契約の閉じた形（`error` の 8 項目）だけです。NIHO の API 共通のサポート ID（`supportId`）はこの path では付きません。クライアントは契約に無い項目を持つ本文を「想定外の応答」として扱います。

## 8. このサイトでの個人情報の扱い

- 旅行者の入力・予約確認の token を URL、localStorage、SSR の HTML、計測、エラー記録、公開キャッシュに入れない。
- checkout の要求本文をログに出さない。失敗の記録は `code` と status だけにする。
- 決済の取りやめから戻ったときに入力を残す場合は、同じタブの sessionStorage に限り、予約の遷移が成功したら消す。

## 9. 提供者の入口

「体験を提供する」は NIHO の `/experiences/provider` へ遷移します。未ログインなら NIHO ログインへ誘導され、同じ画面へ戻ります。ここで個人事業主・小規模店舗が登録し、原稿、Stripe、掲載申請、予約・売上を管理します。体験サイト側にログイン状態を持ち込みません。NIHO 側の配備と受入が終わるまでは、画面担当②は問い合わせの案内を維持してください。

## 10. mock

```ts
import { createExperienceApiClient } from "@niho-experience/api-client";
import { createMockExperienceFetch, isMockCheckoutUrl } from "@niho-experience/api-client/mock";

const client = createExperienceApiClient({
  nihoWebOrigin: "https://niho.life",
  fetch: createMockExperienceFetch({ scenario: "default" }),
});
```

- 合成の 4 体験（即時確定・承認制で集合場所非公開・複数商品と子ども料金・申込停止中）。名前に `(sample)`、画像は仮素材。実在の提供者・住所・写真・レビュー・販売実績は入れない。
- `catalog`：`synthetic`（既定。上の合成の体験）／`pilot`（オーナーが掲載許可を確認した最初の5体験を推奨値で載せた `fixtures/pilot-experiences.ts`。写真は仮素材（SVG と、出典を残した無料素材の仮写真 `/sample/photos/*`。2026-10-20のオーナー判断。ホストの顔写真は入れない）、レビュー・実績・残席は入れない。2026-10-19のオーナー決定）／`all`（両方。slug は重ならない）。
- `scenario`：`default` / `empty-catalog` / `sold-out` / `slow` / `network-error` / `checkout-full` / `checkout-hold-limit` / `checkout-price-changed` / `checkout-questions-changed` / `checkout-consent-outdated` / `checkout-rate-limited` / `checkout-unavailable`。
- mock の checkout は Stripe へ遷移しない URL を返します。`isMockCheckoutUrl(url)` で検出し、画面の mock 決済ページ（請求なしと明示）へ切り替えてください。
- mock は決済・DB・ログインを持ちません。本番の build では `@niho-experience/api-client/mock` を読み込まず、mock のプレビューには「Sample data」を常に表示します。
- 画像を Next.js の画像最適化に通す場合は `imageBaseUrl` を渡し、`packages/api-client/mock-assets/` を配信します。

## 11. 検証

- `npm -C packages/api-client run check`：契約の監査（閉じた形・禁止項目）、生成した型の drift、fixture の検証と PII 走査、mock の各状態、クライアントの境界。
- mock と実 API は同じ検証器（`@niho-experience/api-client/testing`）を通します。実 API の受入は `npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life`（読み取りだけ。checkout は NIHO 側の integration test と Stripe の検証環境で確かめる）。

## 12. 版と更新の手順

1. NIHO 側の OpenAPI を変える（API が正本）。互換の拡張は API を先に配備する。
2. NIHO の `npm -C contracts run export:experience-public-contract`（niho-app）が書き出した `contracts/exports/experience-public-api.openapi.json` と `.sha256` を、そのまま `contract/` へ置く（手で直さない。`info.version` も NIHO 側で上げる）。`src/contract-meta.ts` の版と状態を合わせる。
3. `npm -C packages/api-client run gen:types` → `check`。schema 名は NIHO の命名（`PublicExperience*`）で、画面は `src/types.ts` の別名だけを使う（名前の変更は別名の付け替えで吸収する）。画面を直す。
4. 項目の削除・意味の変更は破壊的変更として新しい path か版で並行提供し、このサイトの切り替え後に古い方を止める。
5. `x-niho-contract-status` を `agreed` にするのは、連携担当が NIHO 側の実装・runtime 検証と突き合わせた後だけ。

## 13. 未確定

| 事項 | 決める時期 | 影響 |
| --- | --- | --- |
| 体験サイトの公開ドメイン | 本番公開前 | `canonicalUrl`、CORS の許可 origin、決済取りやめの戻り先 |
| 地域の key の一覧 | 最初の掲載時（v1 は `kamakura`） | `region` |
| 提供者入口の公開可否 | NIHO 側の配備後 | §9 |
| 販売条件・キャンセル基準・サポート分担 | 有料で公開する前 | 文言と `seller` の表示 |

## 14. 仮契約 v0.1.0 からの変更（v1.0.0）

- schema 名を NIHO の命名にしました（`ExperienceDetail` → `PublicExperienceDetail`、`PublicImage` → `PublicExperienceImage`、`PublicErrorResponse` → `PublicProjectionErrorResponse` など）。`src/types.ts` の別名（`ExperienceDetail` など）は変えていないので、画面のコードは変わりません。
- operationId を NIHO の命名にしました（`listPublicExperiences`・`getPublicExperience`・`getPublicExperienceAvailability`・`postPublicExperienceCheckout`）。`verify:live` と test の `validateResponse` だけが使います。
- 画像の操作 `getPublicExperienceMedia` を足しました（§3）。応答の形は変わりません。
- 項目の意味・必須・上限は変わりません。nullable な参照に `type: object` が付きました（意味は同じ。検証器は `allOf` つきの nullable を null も許す形に直しています）。
- `AFTER_BOOKING` の集合場所の規則は schema の `not` から検証器の規則へ移しました（§4）。
