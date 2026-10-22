# Admin予約支援（仮契約・合成プレビュー）

対象: [#118](https://github.com/niho-life/niho-experience/issues/118)、[#119](https://github.com/niho-life/niho-experience/issues/119)、親Epic [#117](https://github.com/niho-life/niho-experience/issues/117)。この文書は公開可能な画面契約であり、NIHO内部の権限・DB・決済スキーマではない。

## 現在の提供範囲

`/admin/bookings` は、複数ホストの申込一覧、絞り込み、予約詳細、支援条件、相談、担当、運営メモ、連絡先の種類、Admin本人の対応履歴を確認する画面である。`/admin/notifications` は、サポートONで受け付けた合成予約について、新規申込、変更、取消、返金確認、新しい連絡の受信を確認する画面である。`EXPERIENCE_API_MODE=mock` と `ADMIN_SUPPORT_CONSOLE_ENABLED=true` の両方が設定されたときだけ、明示的な合成Adminログイン、合成予約、合成通知を表示する。フラグの既定値はOFFである。

HTTPモードは、選別済み v1.0.0 契約によるAdmin専用app-connect認証を使う。NIHOで現在のplatform ADMINと専用clientを確認できた場合に、検証済みactorと8時間の絶対期限を表示する。予約・通知のread契約もv1.0.0で固定済みだが未配備で、独立した `ADMIN_SUPPORT_READ_API_ENABLED` は既定OFFである。OFFの間は各画面を「準備中」とし、実予約、通知本文、未読件数、操作成功を表示しない。

認証の契約配布物は `packages/api-client/contract/experience-admin-auth-api.openapi.json`（source `b1bee0090e`）に固定する。予約・通知の読取契約は別配布物 `experience-admin-read-api.openapi.json`（source `08736836328976b130b919bef0ebcdad7d5ba7bb`、SHA `054bcc96e3f3818066512a185fdeeffe6da447f44340ea005d600eb63c8c4d8a`）に固定する。どちらもmanifestに未配備状態を記録し、API配備・三者受入・app-connect scope接続が完了するまで本番でread flagをONにしない。

read flagをONにしたHTTP画面は、予約一覧・deep link詳細・通知一覧・本人の既読だけをNIHOへ接続する。予約検索はBFFから `POST /api/admin/experience-bookings/query` へJSON本文で送り、検索語をブラウザURLやNIHOへのrequest URLへ載せない。cursorはAPI側の継続位置として扱い、表示件数は「読み込み済み」と明示する。通知は全対象の `unreadCount` とpage cursorを使い、既読操作は対象pageを明示し、成功応答後だけ反映する。リアルタイム配信とは表示しない。

`ADMIN_SUPPORT_READ_PREVIEW_ENABLED=true` はmockモード専用のUI確認flagである。既存の合成Admin session上でread-only UIだけを描画し、BFFはmockデータへfallbackせず404のままにする。Playwrightがブラウザ要求へ契約形の合成stubを返し、HTTP session・SDK・BFF境界はunitで別に検証する。HTTPモードではこのflagを無視する。

予約の承認・辞退・取消／返金、連絡送信、担当・内部メモ編集はread flagをONにしても表示しない。旧予約や不正な支援snapshotをOFF・10%へ補完せず、読取契約にない担当・内部メモ・履歴・連絡スレッドも空値で作らない。

## 支援条件

- サポートOFF: NIHO手数料10%。Adminは運営上の全体確認をできるが、日常の承認・辞退・連絡・取消／返金は代行しない。
- サポートON: NIHO手数料は合計15%。予約を事務局の通常の支援対象として共有し、予約状態が許す操作を認める。
- 通訳紹介、料理補助、地元の方への声かけ、返金連絡の代行など、具体的な支援内容はホストと事務局が相談して決める。通訳専用の手配状態や人材管理は追加しない。通訳確保を予約確定条件にしない。
- 支援担当者の人件費は手数料に含めず、合意した条件でホストから担当者へ直接支払う。
- サポート設定は変更後に受け付ける予約へ適用する。予約には受付時のON/OFF、手数料率、操作許可をsnapshotとして残し、後の設定変更を遡及しない。
- 「サポートON」と「要対応」は別の軸である。ONでも対応不要、OFFでも運営上の確認が必要な予約がある。

## プレビュー操作と保存範囲

合成Adminは、サポートONの予約に限り、予約状態に応じた承認、辞退、連絡記録、取消／返金を試せる。確認画面には相手、予約番号、金額、理由を示す。予約状態と返金額の計算にはホスト画面と同じドメイン関数を使う。各操作にはAdmin actorを記録し、同じidempotency keyの再送は同じ結果を返す。取消済み予約への新しい取消は拒否する。

プレビューの変更はAdminセッションごとのサーバープロセスのメモリにだけ保持され、同じセッションの再読込では予約操作と通知の既読状態を引き継ぐ。通知を既読にしても予約状態や要対応は変えない。外部への連絡、通知配信、決済、返金、台帳更新、永続保存は行わず、サーバー再起動、セッション失効、または新しい合成Adminセッションで初期状態へ戻る。失効したセッションには通知データを返さず、状態は操作時に掃除する。セッション数、操作履歴数、セッションごとの既読数には上限を設ける。ホスト設定の変更はその画面上だけで、再読込後は合成fixtureへ戻る。

## セキュリティ境界

- Adminはホストとは別の暗号化・認証付きcookieを使う。cookie名、path（`/admin`）、暗号化purposeを分け、HttpOnly、Secure、SameSite=Laxにする。
- 合成ログインはmockと明示flagの組み合わせ以外では404にする。HTTPモードは合成セッションを読まない。
- AdminのPOSTはAdminセッションに加え、`Origin` と `Sec-Fetch-Site: same-origin` を検証する。通常のホストcookieだけでは401になる。
- HTTPログインのPKCE verifierとstateは10分のAdmin専用cookieへ封印する。callbackは一致するstateを一度だけ受け、成功・失敗ともqueryのないAdmin URLへ移る。
- Admin tokenと接続refresh tokenはexperienceのサーバーだけが封印cookieに保持し、ブラウザJavaScript、storage、URL、ログへ渡さない。接続成立時、画面描画時、token更新時に専用session APIでclient・現在のAdmin role・actor・接続期限を確認する。
- Admin接続はNIHOの期限とサイト側の8時間上限の早い方で終了し、refreshで延長しない。401/403、role喪失、接続不一致ではactorを表示せず入口へ戻す。
- logoutは自分のNIHO接続の失効を試み、通信結果にかかわらずlocal cookieを消す。2xxまたは既に接続がない404だけを解除確認済みとし、401・その他の失敗・通信失敗では、端末からのlogout完了、NIHO側の解除未確認、接続が発行から最長8時間で失効することを表示する。
- `/admin` 全体を `private, no-store`、`noindex, nofollow` とし、旅行者向けの分析・計測を読み込まない。公開cacheやイベント計測へ予約者・ホスト情報を送らない。

HTTPでAdmin認証を有効にするには `ADMIN_SUPPORT_CONSOLE_ENABLED=true`、専用の `ADMIN_SESSION_SECRET`、Firebase Web API key、`SITE_URL` と完全一致する `NIHO_EXPERIENCE_ADMIN_ORIGIN` が必要である。予約・通知の読取には、これらに加えて配備・受入後に `ADMIN_SUPPORT_READ_API_ENABLED=true` を設定する。originは本番HTTPS、ローカルはloopback HTTPだけを許し、NIHO側の `APP_CONNECT_EXPERIENCE_ADMIN_ORIGIN` と同じ値を明示する。公開ドメインはコードへ固定しない。

## NIHO側に必要な契約

認証の選別済み契約は版を固定済みだがNIHO側は未配備である。予約支援の実接続には、NIHO側で次を配備・受入する。

1. 管理者接続: v1.0.0で固定済み。一度きりのコード交換、短寿命Admin token、更新・失効、Admin roleのサーバー検証。NIHO側の配備・本番受入は未完了。
2. 横断予約参照: ホスト、期間、状態、サポート、要対応、予約番号／予約者による検索。レスポンスは画面に必要なDTOだけとし、内部ユーザー・決済・DBスキーマを輸出しない。
3. 予約詳細: 受付時の支援snapshot、相談、担当、運営メモ、連絡スレッド参照、予約条件、金額、返金済額、監査履歴。PIIは権限・目的・保持期間に応じて最小化する。
4. 操作: 承認、辞退、連絡、取消／返金。予約versionまたはETag、idempotency key、理由、期待する金額を受け取り、NIHOが権限・状態・料率・返金可能額を再検証する。成功後は予約と監査履歴を読み直す。
5. ホスト設定: OWNERだけがON/OFFを変更できる。変更時刻とactorを監査し、予約受付時に支援条件をsnapshot化する。EDITORは参照のみ。

experience側はこの境界が配備されるまでHTTPで合成データや操作成功を返さない。実API接続時にはmockと同じ画面DTOへ変換するアダプターを置き、NIHOの認証・権限・価格・決済・返金・台帳を重複実装しない。
