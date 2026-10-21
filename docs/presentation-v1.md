# Portable presentation v1

Phase A は、公開サイトの英語 code-default 表示を `@niho/experience-presentation/v1` として固定する。公開 Next アプリは metadata、routing、`PageDocument` 選択、API read、availability、analytics、booking／payment の権限を引き続き持つ。presentation package は home、catalogue、detail、gallery、booking の2画面と detail booking card、help、host、card、chrome の実表示構造を持つ。

NIHO staff preview は公開サイトと同じ view component を利用する設計とし、認証付き管理画面への接続は niho-app#19260 で行う。実管理画面は選別された公開表示データと編集中の訳を使い、検証用 fixture は合成データとする。preview の callback は no-effects とし、別実装の見た目を再現しない。公開サイトの published `PageDocument` は従来どおり code-default fallback 全体を置き換える。Phase A は authored document の block 解釈を変更しない。

## package と version identity

固定 SHA からの root package install を前提に、次を公開する。

- `@niho/experience-presentation/v1`: React view、型、manifest、copy／asset helper
- `@niho/experience-presentation/v1/styles.css`: `.nexp-v1` に scope した CSS と固定 font
- `@niho/experience-presentation/v1/metadata`: React 非依存の version／copy metadata export
- `@niho/experience-presentation/v1/metadata.json`: schema 2 の完全な静的 copy 定義

`PRESENTATION_MANIFEST_V1` は renderer、legacy copy、static copy、decorative assets、CSS、font、React peer を SHA-256 で識別する。consumer は `assertPresentationIdentityV1` で完全一致を検証し、不明／改ざん identity を最新版として再解釈しない。将来の redesign は `/v2` を追加し、保存済み snapshot 用の `/v1` を残す。

React と ReactDOM は `^18.2.0 || ^19.0.0` の peer であり、Next、workspace web app、API client、router、auth、DB、payment runtime は package dependency に含めない。

## view model と behavior seam

全 view は公開可能な display string／media と狭い callback を受け取る。

- `HomeViewModelV1`: hero、finder seam、theme、experience card、editorial feature、video strip、host feature、figure、postcard
- `DetailViewModelV1`: typed gallery、host／fact、timeline、provider、inclusion、typed meeting、typed cancellation、typed detail booking card
- `BookingSelectionViewModelV1`: option、date status／card、guest counter、表示済み total／line。callback は選択、retry、show-more、continue のみ
- `BookingCheckoutViewModelV1`: availability 状態、contact、4種の question、review rows、canonical terms／consent、action 状態。callback は controlled field／answer／consent／submit のみ
- `DetailBookingCardModelV1`: price／schedule／assurance と、availability controller が作る `DetailBookingDatesV1` の狭い dates seam
- `DetailGalleryModelV1`: safe image、alt、back href。公開 wrapper は swipe index と dialog open/close だけを持つ

package は価格、在庫、seat、checkout、terms／consent version の決定をしない。公開 controller が権威ある値を計算・検証し、presentation には表示値と操作通知だけを渡す。preview の action は disabled／no-effects にする。

decorative asset は安定 ID、`src`／`srcset`／`alt`／`position` と content digest で binding する。listing、host、provider の写真は package にコピーせず、safe display model として都度渡す。`SAMPLE_MEDIA` release gate は維持する。

## copy registry

- schema 1: NIHO selected public UI registry 239 keysを byte-stable な legacy metadata codec として保持
- schema 2: schema 1 全239 keysと、実 code-default で不足した97 keysを合わせた完全な336-key static registry

schema 2 は home の2見出しを whole rich message として持つ。`{em}...{/em}` は保護された paired marker であり、順序を変えた翻訳でも `RichMessageV1` が text／emphasis segment だけを描画する。HTML、eval、DOM replacement は使わない。key 集合、placeholder multiset、marker の種類／回数／balance／order は入力時に完全一致を要求する。

追加97 keysには、分割されていた home／brand／price／host-line 見出し、home model の固定 label、gallery の件数表示、booking selection／checkout／detail card の残存固定 UI、canonical terms／consent 周辺、controller が view に渡す error copy、navigation／notice の accessibility label を含む。編集／feature／host／listing 名、日時、価格、人数などの可変内容は翻訳 UI key ではなく明示的 display model である。現時点で共有 v1 view に残る未登録の固定 UI copy はない。

## 実ブラウザでの最終補修

公開Server Componentからclient moduleの関数を直接実行しないよう、booking cardの純粋なmodel変換を中立moduleへ分離した。availabilityはclient componentとして渡し、価格・在庫の権限は従来のcontrollerに残す。日付読込後の価格はrich messageとして描画し、装飾markerを持つkeyをtext()へ渡す誤用を型でも拒否する。既存ENのhero見出しは原文どおり維持する。
