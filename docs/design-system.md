# デザインシステムと画面仕様（v1）

[#6](https://github.com/niho-life/niho-experience/issues/6) の成果物。方針は [design-brief.md](design-brief.md)。実装は `apps/web/src/app/globals.css`（token）と `apps/web/src/components/`。
画面はプレビュー（mock）で確認できる：`npm run dev` → `/`、`/experiences`、各体験、`/host`、`/preview/states`。`MOCK_CATALOG=pilot` で掲載許可のある体験（仮写真つき）を表示する。

2026-10-20 に UI を刷新した（オーナー承認のモック「改善版」）。白基調のニュートラル、手描きのアイコンと手書きのアクセント、切手の縁と丸スタンプで「近所の人に会いに行く」温度を出す。

同日、オーナー承認のスマホ用モック v2（niho-app の `idea/mock/experience-site-refine-v2.html`）に見た目をできるだけ近づけた（オーナー判断 2026-10-20：「このモックの見た目にできるだけ本番実装を近づける。アセットもそのまま使ってよい」）。あわせて次を決めた。

- プレビューの表記は上部の黒い帯をやめ、フッター最下部の小さな1行に移す（プレビューだけ。pilot と合成で文言を分け、契約版を添える）。
- 写真の「Sample photo」タグと、カード・詳細の「Sample listing / Details to be confirmed」ピルは出さない。
- NIHO の自前の写真（`niho-*.jpg`）とホストの顔（`host-*.jpg`）を仮に使う（§6）。
- 詳細の「Your host(s)」の切手の写真は photos[1]（無ければ表紙）。

モックと意図して違えた点：カードの開催日・一覧の件数・予約の日程は実データ（ブラウザで読んだ availability）で示す。予約入力は既存の2画面（日時・人数 → 入力・確認）を保ち、日付と人数を自動で選ばない。

2026-10-21 に PC 版のデザインを足した（オーナー依頼「PC 版のデザインも対応して欲しい」。モック v3：<https://niho-experience-mock.pages.dev/>、v2 の 440px の枠を外したレスポンシブ版）。スマホの見た目は v2 のまま変えず、PC で組み替える（§2.3）。

## 1. 表現の考え方

- 主役は写真と人。地は白、区切りは淡いグレーの面（sand）と細い線。色は少なく、写真の色を邪魔しない。
- 見出しはやわらかいセリフ体（Fraunces、weight 400 中心）、本文・操作は NIHOapp と同じ Nunito。手書きの Caveat は短いアクセントだけに使う（§2.2）。
- NIHO のブランド緑（leaf）は主ボタンの地と下線に、深い苔色（moss）はリンク・focus・手書きの文字に使う。全面を塗らない。
- 手描きのアイコン（`#sketch` フィルタで線を少し揺らす）、丸スタンプ（`#rubber` フィルタでかすれ）、切手の縁、アーチ形の切り抜きは装飾。意味は必ず隣の文字が持つ（`aria-hidden`）。
- Slowhop から採り入れたのは「大きな写真・余白・人の紹介・整理されたカード」という考え方だけ。写真、ロゴ、文章、配色、ページ構成は流用していない。

## 2. Token と書体

### 2.1 色

| Token | 値 | 用途 | コントラスト |
| --- | --- | --- | --- |
| `canvas` / `surface` | `#ffffff` | ページ背景・カード・入力 | — |
| `sand` | `#f5f5f2` | 区切りの面（ホスト紹介・予約の流れ・取消条件）、スケルトン | — |
| `ink` | `#1c1c1a` | 見出し・本文・二次ボタンの枠 | 17.1:1（白） |
| `ink-soft` | `#4b4b47` | 説明文 | 8.8:1（白）/ 8.0:1（sand） |
| `muted` | `#6c6c67` | 補足 | 5.3:1（白）/ 4.8:1（sand）/ 4.7:1（leaf-pale） |
| `line` / `line-strong` | `#e8e8e4` / `#d4d4cf` | 区切り線 / 入力・チップの枠 | — |
| `moss` | `#355e1f` | リンク・focus（3px）・手書きの文字・✓ | 7.6:1（白）/ 6.9:1（sand）/ 6.8:1（leaf-pale） |
| `leaf` / `leaf-hover` | `#b2d67c` / `#a3c86b` | 主ボタンの地（文字は ink）、下線・波線 | ink 文字 10.4:1 / 9.0:1 |
| `leaf-pale` | `#eef5e3` | 頭文字の丸、日付の強調、選択の背景 | — |
| `danger` / `warn` / `info` + `-pale` | 赤・琥珀・青 | 状態表示。必ずアイコンと文言を併用 | 5.8 / 6.7 / 6.9:1 |

`viewport` の `themeColor` は `#ffffff`。

### 2.2 書体

| 役割 | 書体 | 使いどころ |
| --- | --- | --- |
| 見出し | Fraunces（`--font-display`、400。数字は 300） | h1〜h3、数字の節の大きな数字 |
| 本文・操作 | Nunito（`--font-sans`） | 本文、ボタン、フォーム、価格 |
| 手書き | Caveat（`--font-hand`、`.hand` / `.eyebrow`、moss） | 見出し上の一言（例 "five to choose from"）、行程の時刻（"6:00 PM"）、ホスト名、数字の単位、絵はがきの地名、ヒーローの "home" |

手書きは短いアクセントだけ。本文・操作・価格・法的な文言には使わない。旧来の柿色の eyebrow（大文字の小見出し）は手書きの一言に置き換えた。

文字：本文 16.5px / 行間 1.6。h1 はモバイル 34–42px、デスクトップ 52–78px。補足でも 12px 未満にしない。
角丸：カード・写真 22px、入力 12px、ボタン・チップは pill。影はカードと予約カードだけ。
余白：画面端 20px（モバイル。モック v2 に合わせた）/ 24px / 40px。セクション間 72px（モバイル）/ 104px（デスクトップ）。最大幅 1200px。

### 2.3 画面幅と組み替え

- スマホの組み方が基本。PC は Tailwind の `lg`（64rem = 1024px）から組み替える（モック v3 の 900px に当たる）。`sm`（40rem）〜`lg` 未満のタブレットは、余白と一部の列数だけ広げたスマホの組み方。
- 予約入力の2画面だけは、画面幅ではなく部品自身の幅（container query `@4xl` = 56rem）で2列にする。公開文書の枠の中など狭い所に置かれたときは1列のまま。
- PC の組み替え：ヘッダーに Host with NIHO、トップの検索は1行のピル、一覧の人数と日付チップは1行、詳細はパンくず → タイトル → ページ幅の中のモザイク → 本文と右の予約カード、予約入力は左に step・右に要約カードと追従する合計のカード、提供者入口の流れは4列（§4）。
- 実装の注意：presentation の CSS（`@niho/experience-presentation/v1/styles.css`）は全規則が `@scope (.nexp-v1)` で包まれていて、同じ詳細度なら scope の近さで Web 側の規則に勝つ。`.nexp-v1` の中に置く Web 側の部品（トップの検索欄など）で、presentation の CSS にもある基本クラス（`relative`・`grid-cols-2`・`rounded-2xl` など）を `lg:` で上書きすると、PC の指定が負ける（2026-10-21、トップの検索欄が PC でも2段のままだった）。画面幅で変える値は `max-lg:` と `lg:` に分けて書き、基本クラスを持たせない。

## 3. 部品

| 部品 | ファイル | 決まり |
| --- | --- | --- |
| ボタン | `ui.tsx` `buttonClass` | primary＝leaf の地＋ink 文字（pill、高さ 48px）。secondary＝透明＋ink の 1.5px 枠。1画面の主操作は1つ |
| 手描きアイコン | `HandIcon.tsx` | sprite（`HandIconSprite`）を layout で1回だけ描き、`<use>` で参照。stroke は currentColor。20種（bowl, bean, enso, mend, brush, clock, chat, people, train, pin, cal, check, cross, card, mail, table, house, umbrella, arrow, search）と、操作用の線（back, plus, minus）。常に `aria-hidden` |
| 丸スタンプ | `HandIcon.tsx` `RubberStamp` | "NIHO · KAMAKURA · NEIGHBORS ·" と中央「鎌倉」。ヒーロー（白）、ホスト紹介・詳細のホスト・フッター（moss）。`aria-hidden` |
| 切手の縁 / アーチ | `globals.css` `.postage` `.postage-paper` / `.arch` | 切手の縁は mask（Safari 用に `-webkit-mask` も）。ホスト紹介・詳細のホスト・絵はがきに使う。アーチは集合場所の外観とホスト募集の動画 |
| Notice | `ui.tsx` | info / warn / danger / success / neutral。アイコン + 読み上げ用ラベル + 見出し + 次の行動 |
| Pill | `ui.tsx` | 状態（満席・停止）だけ。プレビュー掲載のピルは出さない。人気・残りわずか等の演出には使わない |
| 写真 | `Photo.tsx` | 比率固定でレイアウトのずれを防ぐ。`sizes` 指定。仮の写真にもタグを付けない（プレビューであることはフッターの1行で伝える） |
| プレビュー表記 | `SiteChrome.tsx` `PreviewNote` | プレビュー（mock）だけ、フッター最下部に小さな1行（`role="note"`）。pilot は「real hosts; dates, prices and photos are provisional · nothing can be booked」、合成は「hosts, dates and prices are invented · nothing can be booked」、どちらも契約版を添える。公開文書の共通枠（chrome）を使うときも同じ |
| 顔 | `Face.tsx` | ホストの顔写真。無ければ頭文字の丸（leaf-pale 地＋moss 文字）。名前は必ず隣に書くので `aria-hidden` |
| 体験カード | `ExperienceCard.tsx` `CardDates.tsx` | 表紙（4:5。一覧のスマホは 4:3）→ 左上に定員チップ（"Up to 8 guests" / 全商品が 2 人以上なら "Private · 2–4 guests"）→ 右下にはみ出すホストの顔（写真、無ければ頭文字）→ "with ホスト名"（いなければ提供者名。`lib/themes.ts` の上書きがあればその語）→ 題名 →（一覧だけ）2行のリード → 所要時間・言語の略記 → "Next" と次の開催日3つのピル（"Thu 22"）→ "¥X / adult"。開催日はブラウザで読んだ availability から作る（一覧は一覧の読み取り結果を共有、トップはカードが読む）。読めるまで・読めないときは開催曜日と時刻（JST）の要約を同じ1行の高さで出し、レイアウトを跳ねさせない。日付を選んだ一覧では "Sat 24 Oct · 6:00 PM" を強調。カード全体が1つのリンク。人気・残りわずか・レビュー・残席は出さない |
| 動画 | `AmbientVideo.tsx` | muted・loop・playsInline・poster・`preload="metadata"`、`aria-hidden`。画面に入っている間だけ再生し、`prefers-reduced-motion: reduce` では再生しない（poster のまま）。LCP はヒーローの画像で、動画に依存しない |
| 日時・人数選択 | `SlotPicker.tsx` | 画面1。サマリーカード → （商品が複数のときだけ）商品の選択 → 手書き "step 1" と "Choose a date"：2列の日付カード（ラジオは見えないが focus・読み上げ・キーボードで操作できる。満席・締切は理由付きで無効化。最初の6件＋"Show N more dates"）→ "step 2" と "Who's coming"：大人・子どもの行に −/+（中身は数値入力なので直接入力もできる）→ 下端の固定バーに合計・日付と Continue。詳細ページから渡された日付（`?date=&offer=`）は予約可能なときだけ選択済みにする |
| 予約フォーム | `BookingForm.tsx` | 画面2。同じサマリーカード → "step 3" と "Your details"（`.fld` の見た目の入力欄、申込時の質問）→ "step 4" と "Check and pay"（承認制は "Check and send"）：日付・人数・内訳・合計の行カード、取消・受付方式・Stripe と販売者の注記（アイコン付き）、規約リンクと同意 → 下端の固定バーに合計と送信ボタン。ラベル・説明・エラーを近接。失敗しても入力を保持 |
| 予約の部品 | `BookingParts.tsx` | サマリーカード（表紙の小さな写真・題名・"所要時間 · 開始時刻 JST · 商品名"。公開文書が無いとき題名が h1）、手書きの step 見出し、下端の固定バー。2列のときはサマリーカードを右列の縦長のカード（写真は 16:10）に、下端のバーを同じ要素のまま右列で追従するカード（`top: 88px`）にする。読み上げと focus の順は「要約 → step → 合計と送信」のまま。表示だけで業務の判断を持たない |
| 取消条件 | `Policy.tsx` | 取消条件の見出し（"Free cancellation until 48 hours before the start" / "Non-refundable"） |

カードの表示モデルは `lib/card-model.ts`。一覧の要約（契約の `ExperienceSummary`）にはホスト・曜日・定員が無いので、SSR で各体験の詳細を並列に読み（HTTP では 60 秒の共有キャッシュ）合成する。詳細を読めなかった体験は要約だけでカードを描き、落とさない。

## 4. 画面

### トップ（`/`）

上から：ヘッダー → ヒーロー → テーマ → カード → 特集 → 動画の帯 → ホスト紹介 → 数字 → 予約の流れ → 絵はがき → ホスト募集の帯 → フッター（プレビューだけ最下部に1行の表記）。

| 節 | 内容 |
| --- | --- |
| ヘッダー | 白。ロゴ、Experiences（一覧では淡い面で選択状態、`aria-current="page"`）、Host with NIHO（スマホは Experiences だけ）、"EN · ¥"（操作ではない表示。読み上げは "In English, prices in Japanese yen"） |
| ヒーロー | 全面の写真（NIHO のディナーの長いテーブル、`lib/site-media.ts`、priority）、h1 "Meet the people who make Kamakura *home*"（home を手書き）、リード "Cook, sit, mend and write with people who live here. Small groups, booked in minutes, no account needed."、右上に白い丸スタンプ。下端に重なる検索（スマホは日付・人数の2列＋下の行にボタン、PC は写真の下端にまたがる1行のピル。GET で `/experiences` へ。`date`＝Any day＋今日から14日（JST）、`guests`＝1〜8、既定は "2 adults"）。JS なしでも動く |
| テーマ | 掲載中の体験から作る（空のテーマを作らない）。slug を明示した編集用の表でアイコンと短いラベルを決める（`lib/themes.ts`：Cook & eat / Roast coffee / Sit zazen / Mend a bowl / Write kanji）。題名からは推測しない（#36）。各テーマはその体験の詳細へ |
| カード | 手書き "N to choose from"、h2 "Experiences hosted by neighbors"、See all。スマホは横スクロールの snap、PC は3列。最後に "Your experience here?"（`/host` へ） |
| 特集 | コミュニティディナーの slug が掲載中なら編集用の内容（`lib/themes.ts` の `FEATURED_STORY`）：データの曜日・時刻の手書き（"Tue, Thu & Sat · 6 PM"）、h2 "One long table, eight guests and a few neighbors"、本文、"See the dinner"、NIHO の自前の写真5枚のモザイク。掲載されていなければ写真が5枚以上ある最初の体験（題名、リード、"See details"、その写真） |
| 動画の帯 | "Slow down, you're among neighbors" と手書きの副題。下に縦長の動画カード（掲載中のテーマだけ）。ラベルは手書きの動詞＋編集用の短い名前（"Cook / Community dinner"。表に無ければ題名の短縮）。書道は書道の動画で上書き。ホストの実名は書かない |
| ホスト紹介 | sand の面。書道の slug が掲載中ならモックどおり（`FEATURED_HOST`）：データの hosts[0] の名前を手書き、役割 "Calligrapher, MC and event producer"、本文、切手の縁の中に書道の動画＋丸スタンプ、"See Shiryu's workshop"。掲載されていなければ個人の提供者（`provider.kind = INDIVIDUAL`）の体験の表紙・`provider.tagline`・リード。下にホストの顔（写真、無ければ頭文字。名前のあるホストを先に、ホストのいない体験は編集用の顔）を各体験へのリンクで並べ、紹介中の人を緑の縁で強調 |
| 数字 | "Small on purpose"：駅からの分数（"From Kamakura Station West Exit to the living room door."）、最大定員（計算）、体験数（計算。掲載中の全体験にテーマがあれば "Food, coffee, Zen, mending and calligraphy." のように並べる）、言語数（"English and Japanese, often both at the same table."）。Fraunces 300 の数字＋手書きの単位 |
| 予約の流れ | Pick a date（"See the next dates on every card. Times are Japan time."）/ Pay securely（"Checkout by Stripe in Japanese yen, tax included."）/ Meet your hosts（"The meeting point and your booking arrive by email."）、手書き "no account needed — book as a guest" |
| 絵はがき | "Kamakura is small. Walk it."。切手の縁で少し傾け、手書きの地名。リンクなし |
| ホスト募集 | アーチ形の動画、"Share what you love about Kamakura"、`/host` へ |
| フッター | 白、丸スタンプ、説明 "Small experiences hosted by people who live in Kamakura. Made by NIHO, a shared living room two minutes from Kamakura Station."、既存ルート（`/experiences`、`/host`）だけ。プレビューだけ最下部に1行の表記 |

### 一覧（`/experiences`）

- 手書き "small groups · local hosts"、h1 "Experiences in Kamakura"、円・税込・JST の補足。
- ヘッダーの下に固定する絞り込み：上の行に人数のピル（Any group／1〜8）、下の行に Any day と今日から7日の日付チップ（曜日＋日、JST。トップから8日目以降の日付が来たらそのチップを足す）。チップの行の右端に小さな丸い検索ボタン（虫眼鏡）。PC は人数のピルと日付チップを1行に並べ、間を細い線で区切る。
- 検索（`q`。API 1.2 ではテーマも）は `<details>/<summary>` の中の GET フォームで、押すと入力欄がチップの下に開く。JS なしでも開閉・送信できる。`q`（やテーマ）が URL にあるときは開いた状態で語を表示する。0件や日程を読めないときは同じ検索を独立した行に出す。
- 日付・人数の絞り込みはブラウザから各体験の availability を1回ずつ読み、その日に予約可能で残席 ≥ 人数、かつ商品の1組の上限 ≥ 人数の開催回がある体験だけを出す（`lib/date-filter.ts`）。残席数そのものは表示しない。読込後はチップの下に件数、0件の日は無効。読込中は控えめな文言、失敗したら絞り込みを出さず全件と短い案内。
- URL の `date`・`guests` を読み、変更は `history.replaceState` で同期する。`date` 付きの URL は noindex（canonical は `/experiences`）。
- 0件と通信失敗はそれぞれ行動できる表示にする（検索を消す、Any day に戻す、人数を減らす、再試行）。

### 詳細（`/experiences/[slug]`）

- スマホ：先頭に横スワイプのギャラリー（"1 / N"、一覧へ戻る丸ボタン）。PC：パンくず → タイトル → 表紙＋4枚のモザイク（ページの幅の中・角丸）、"Show all N photos"（`<dialog>`。Esc・閉じるボタン、読み上げ見出し付き）。文書の順はタイトルが先で、スマホではギャラリーを見た目だけ先頭に出す。
- タイトル部：手書きの開催曜日と時刻、h1（題名の下にピルは出さない）、ホストの行（顔写真／頭文字の重なり＋"Hosted by …"＋提供者名）、手描きアイコン付きの事実（所要時間と時刻 JST、言語、人数と子どもの条件、集合を公開している場合は accessNote の要約）。
- 本文：リード、highlights（語でアイコンを選ぶ）、What you'll do（3段落目以降は畳む）、行程（写真付き、時刻は手書きの12時間表記、写真なしはアイコンのタイル）、ホスト（見出しは Your host(s)、ホストがいなければ Who runs it。切手の縁の写真＝photos[1] か表紙（オーナー判断 2026-10-20）、丸スタンプ、`provider.tagline` を手書きの引用、顔写真付きのホストのチップ）、含む／含まない（手描きの ✓ / ×）、集合場所、Good to know（3件＋"Show all N"）、Not suitable for、取消（全商品共通の条件のときだけ要約。補足は全商品が承認制なら "Your hosts confirm each request. You are only charged if they accept."、即時確定なら "Your booking is confirmed as soon as you pay."、混在なら "This policy applies to the option and date you select."）、販売者と Seller information。決済取消からの戻りは案内を出す。
- 集合場所：PUBLIC なら名前・住所・アクセス・入口の案内・"Open in Maps"（https のみ）と、`exteriorPhotoIndex` の写真をアーチ形で。AFTER_BOOKING は「予約確定後に案内」。
- 予約：PC は右の固定カード（"¥X / adult"、子ども料金、税込、開催曜日と時刻、ブラウザで読んだ次の開催日を最大3つ＝押すと `/book?date=&offer=` でその日を選んだ状態から、"Check dates and book"、取消の時間、承認制なら "Your hosts confirm each request — you're only charged if they accept"、"No account needed"、"Secure payment by Stripe"）。人数・合計は置かない（予約入力の役割）。スマホは下端の固定バー（価格＋次回日 or 曜日の要約＋"Check dates"。次回日は商品が1つなら "Next: Thu 22 Oct · 6:00 PM" と商品名を付けない）。予約停止中（`BOOKINGS_ENABLED=false` か `checkoutAvailable=false`）は停止の案内だけで、予約の入口を出さない。
- NIHO の公開 DTO から表示する。正規 URL は API の `canonicalUrl`。プレビューの fixture は構造化データとして出さない。

### 予約入力（`/experiences/[slug]/book`）

- 見た目はモック v2（pBook）。2画面の流れ（SlotPicker → Continue → BookingForm）はそのまま。戻るリンク "‹ 短い名前"、サマリーカード（公開文書が無いとき題名が h1）、手書きの step 1〜4、下端の固定バー（§3）。公開文書（`booking` / `BookingPanel`）を使うときは文書の見出しがあるので題名は h1 にしない。
- PC（部品の幅が 56rem 以上）は2列：左に戻るリンクの下の step（商品の選択、step 1〜2／3〜4、案内、確認の行、注記、同意）、右の 380px にサマリーカード（スクロールで流れる）と、その下で追従する合計のカード（合計・日付と時刻・Continue／送信）。下端の固定バーは出さない。公開文書があるときと予約停止中は従来の幅（1列）。
- ブラウザから `getAvailability` を読み、商品・開催日・大人/子どもの人数を選ぶ。連絡先・回答は URL や Server Action へ送らない。詳細ページから来た `date`・`offer`（公開の日程だけ）は選択の初期値にする。
- 送信前に開催日（JST）、商品、料金内訳・税込総額、販売者、取消条件、同意文書と版を表示する。
- 入力は氏名・メール・任意の備考と、商品に定義された申込時の質問だけ。未対応の電話・国は収集しない。
- ブラウザから選別クライアントの `startCheckout` で NIHO へ直接送る。内容が同じ再送は同じ `clientRequestKey`、内容変更後は新しい key を使う。
- mock ではブラウザ内で合成 checkout を処理し、個人情報を伴わず `/preview/checkout` へ進む。

### 決済からの復帰

- 決済後の確認画面は NIHO が所有する。サイトの旧 `/booking/return` は予約成立を表示せず、NIHO の案内だけを出す。

### 提供者入口（`/host`）

- 見た目はモック v2（pHost）：ヒーローの下にアーチ形の動画（`HOST_BAND_VIDEO`）、案内は leaf-pale の面＋家のアイコン、流れ4段は Caveat の数字と点線の区切りの行、"who does what" / "You host. We help." の YOU（sand）と NIHO（leaf-pale）の2つの面（✓）、料金と支払い（同じトーンの sand の面。数字は合意まで載せない）、最後に "See the experiences"（登録が開いているときは登録ボタンを主操作に残すため二次ボタン）。文言と登録の分岐は従来どおり。
- PC：ヒーローは文と動画の2列、案内の面はページの幅いっぱい、流れ4段は4列（Caveat の数字が上、列の間に点線）、YOU / NIHO は2列、最後のボタンは文字の幅。
- `HOST_SIGNUP_MODE=pilot`（既定）：少数の提供者から始めていると説明し、セルフ登録ボタンは出さない。`NIHO_HOST_START_URL` に正規の管理入口が設定されていれば、既存提供者向けの管理リンクを出す。認証・登録状況・口座の判定はNIHO側が行う。
- `open`：固定 URL で NIHO のログインへ。戻り先や商品を利用者が書き換えられるパラメータを付けない。Stripe の本人確認が必要な場合があると明記。

## 5. 状態

| 状態 | 一覧 | 詳細 | 予約入力 |
| --- | --- | --- | --- |
| 読込中 | カード形のスケルトン。日付の件数は「·」 | 次の開催日は "Checking dates…" | 送信中のボタン |
| 0件・掲載なし | 掲載なしの案内 / その日・人数で0件の案内 | 404ページ | — |
| 満席 | その日のチップの件数から外す（残席は出さない） | 次の開催日に出さない | 日程は理由付きで無効 |
| 販売停止 | 残席は一覧に載せない | 予約入口・次の開催日を出さない | 予約不可の案内 |
| 日程を読めない | 絞り込みを出さず全件＋短い案内 | 「次のページで日程を確認」 | 再試行 |
| 価格・条件変更 | — | — | 日付・合計・同意の再確認へ |
| 通信失敗 | 再試行ボタン | 再試行ボタン | 入力保持のまま再送 |
| 決済取消 / 確認中 | — | 取消の案内と日付選択への導線 | NIHO の予約確認画面 |

## 6. 仮素材（撮影前）

- サイトが持つ装飾素材（ヒーロー、特集のモザイク、動画の帯、テーマの動画、絵はがき、ホスト募集の動画、編集用の顔）は `apps/web/src/lib/site-media.ts` に集める。`SAMPLE_MEDIA = true` は撮り直し前の目印で、画面にタグは出さない（オーナー判断 2026-10-20。プレビューであることはフッター最下部の1行で伝える）。出典は `apps/web/public/sample/CREDITS.md`。
- オーナー判断（2026-10-20、モック v2 に合わせる）で次を仮に使う。
  - NIHO の自前の写真（`niho-*.jpg`）：ヒーロー、特集のモザイク、コミュニティディナーの写真、NIHO の集合場所の外観（実物の建物）。
  - ホストの顔（`host-*.jpg`）：pilot fixture の hosts[].avatar（Takuya は本人。Yukino・Shiryu は顔の代わりの写真で本人ではない）と、ホストのいない体験の編集用の顔（`lib/themes.ts`。円覚寺のガイド）。写真の無いホストは頭文字。
  - 円覚寺の集合場所の外観は参道の写真（`temple-path.jpg`）。ほかの体験の写真は出典を残した無料素材。
- 合成 fixture（既定）は従来どおり SVG の仮素材。
- 本番公開の前に撮り直した写真・動画へ置き換え、`SAMPLE_MEDIA` を外す（[release-acceptance.md](release-acceptance.md)）。

## 7. アクセシビリティ

- 360px・320px で横スクロールなし、主操作が画面内（E2E で検証）。PC の組み替え（検索の1行・詳細の順・予約の2列・一覧の1行・提供者の4列）はデスクトップ（1280px）の E2E で検証する。横スクロールの列（カード・動画・絵はがき・ギャラリー・日付チップ）は列の中だけで動く。
- キーボード：Skip link、全操作に focus 表示（moss の 3px 枠）。スクロールする列は focus できる。写真の一覧は `<dialog>` で Esc で閉じる。
- 状態は色だけでなくアイコンと文言で伝える。エラーは `role="alert"` と focus 移動。
- 画像はすべて代替文。装飾（手描きアイコン、スタンプ、動画、モザイク、顔）は `aria-hidden` か空の代替文で、意味は隣の文字が持つ。言語の略記（"EN · JA"）は読み上げ用に元の表記を持つ。
- 動きは最小限で、`prefers-reduced-motion` で止める（動画は再生しない）。
- axe（WCAG 2.2 AA）で重大な違反なし（E2E で検証）。

## 8. 文言の約束

- 英語は短く、具体的に、次に何が起こるかを書く。CTA は結果を表す動詞（Check dates and book、Find experiences、Continue to secure payment）。
- 価格は「¥6,800 / adult」（商品で違えば「From」）。子ども料金があれば別に示す。総額には「Japanese yen, tax included」。時刻は「6:00 PM – 8:30 PM JST」、日付は「Sat 24 Oct」。
- 開催曜日は契約上「表示の要約用」。実際の日付はブラウザで読んだ availability だけで示す。
- レビュー、人気、残席わずか、販売実績は実データがあるまで表示しない。プレビュー（合成例・pilot）であることはフッター最下部の1行で示す。
- 現在の英語文言・提供者の人物像は合成例か推奨値。実商品の原稿は担当3（#13）が事実確認したものに差し替える。
