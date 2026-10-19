# 30日検証のローンチキット（文案・リンク・QR）

最終更新：2026-10-19（担当3）。対象：[#14](https://github.com/niho-coliving/niho-experience/issues/14)、[pilot-30day-plan.md](pilot-30day-plan.md)。
**すべて未承認の下書き。** 配布・掲示・投稿・連絡は、本番運用の開始後にオーナーが行う（2026-10-19のオーナー決定）。印刷物に価格と日程を載せない。価格・日程は変わりうるため、QRの先の画面で見せる。

## 使う前のチェック

- [ ] 載せる体験の価格・日程・取消条件がオーナーにより確定し、本番サイトに出ている
- [ ] 写真の権利と、写っている人の同意が記録されている（[photo-requirements.md](../content/photo-requirements.md)）
- [ ] 公開ドメインが決まり、下のリンクの `{SITE}` を置き換えた
- [ ] QRを実機（iPhone・Android）で読み取り、UTMが計測ツールに記録されることを確かめた
- [ ] 文面をオーナーが承認した

## リンクとUTM

`{SITE}` は公開ドメインに置き換える。`utm_campaign` は検証の期間ごとに変える（命名は [funnel-measurement.md](funnel-measurement.md)）。

| コード | 置き場所 | リンク |
| --- | --- | --- |
| A1-1 | NIHO館内のテーブルカード | `{SITE}/experiences/kamakura-community-dinner?utm_source=niho_space&utm_medium=qr&utm_campaign=pilot_2026q4&utm_content=table_card` |
| A1-2 | NIHO入口のポスター | `{SITE}/experiences?utm_source=niho_space&utm_medium=qr&utm_campaign=pilot_2026q4&utm_content=entrance_poster` |
| A2-1 | InstagramのプロフィールのURL | `{SITE}/experiences?utm_source=niho_instagram&utm_medium=social&utm_campaign=pilot_2026q4&utm_content=bio` |
| A2-2 | Instagramのストーリーのリンク | `{SITE}/experiences/{slug}?utm_source=niho_instagram&utm_medium=social&utm_campaign=pilot_2026q4&utm_content=story_{MMDD}` |
| A3-1 | 会員が友人に渡すカード | `{SITE}/experiences/kamakura-community-dinner?utm_source=niho_space&utm_medium=print&utm_campaign=pilot_2026q4&utm_content=member_card` |
| A4-1 | 公式サイト（kamakura.niho.life）のディナーのページ | `{SITE}/experiences/kamakura-community-dinner?utm_source=niho_site&utm_medium=referral&utm_campaign=pilot_2026q4` |
| B1-n | 宿泊施設のフロントのカード（提携先ごと） | `{SITE}/experiences?utm_source=partner_a0n&utm_medium=qr&utm_campaign=pilot_2026q4&utm_content=front_desk` |

- 提携先のコード（`partner_a01` など）と施設名の対応表は非公開台帳に置く。
- 短縮URLサービスは使わない（リンク切れ、第三者による計測を避けるため）。

## QRコードの仕様

| 項目 | 値 |
| --- | --- |
| 中身 | 上のリンクをそのまま（短縮しない） |
| 誤り訂正 | M（15%） |
| 印刷の大きさ | 一辺2.5cm以上。ポスターは4cm以上 |
| 余白 | 周囲にQRの4モジュール分 |
| 色 | 白地に濃い色。ロゴを中に入れない |
| 併記 | QRの下に読める形のURL（例：`{SITE}/experiences`） |

## 英語の文案

### A1-1 テーブルカード（A6）

> **Cook dinner with Kamakura locals**
> Join people who live here in our shared kitchen, cook a seasonal home-style dinner together, then eat at one long table.
> 2 hours · Small group · English and Japanese
> **Scan to see dates and book**

### A1-2 入口のポスター（A3）

> **Meet the people of Kamakura**
> Small experiences hosted by people who live here:
> a community dinner, home coffee roasting, zen meditation at a temple, mending pottery, Japanese calligraphy.
> **Scan to see all experiences**
> Prices in Japanese yen. No account needed to book.

載せる体験は、本番サイトに掲載中のものだけにする。

### A3-1 会員が友人に渡すカード（名刺大）

> **Visiting Kamakura? Have dinner with us.**
> Your friend is a member of NIHO, a shared living room near Kamakura Station. Come and cook a seasonal dinner with the people who live here.
> **Scan to see dates**

紹介した会員への報酬や割引は付けない（販売条件の変更にあたるため）。

### B1 宿泊施設のフロントのカード（A6）

> **Looking for something to do in Kamakura this evening?**
> Cook and share dinner with local residents, two minutes from Kamakura Station. Or try coffee roasting, zen meditation, pottery mending or calligraphy with local hosts.
> **Scan to see dates and book online**
> Questions are answered by NIHO, so you don't need to ask the front desk.

### A2 Instagramの投稿（3本）

1. **ディナー**
   > Tonight's table at NIHO: whatever is in season, cooked together by people who live in Kamakura and travelers passing through. We can't promise who you'll meet, and that's half the fun. Small group, English and Japanese. Dates and booking: link in bio.
2. **焙煎**
   > Green coffee beans smell like grass. Fifteen minutes later they smell like caramel. Roast your own batch in our living room near Kamakura Station and take 100 g home. Link in bio.
3. **坐禅**
   > A quiet morning at Engakuji: walk the temple grounds with an English-speaking guide, ask a Zen priest what meditation is for, then sit in zazen together. Private sessions for 2 to 4. Link in bio.

- 写真は、権利と写っている人の同意を確認したものだけを使う。
- ハッシュタグは内容に合うものだけを数個にする（例：#kamakura #kamakuratrip #japanesecooking）。
- 「残りわずか」「人気」などは、実際のデータがある場合だけ書く。

## 宿泊施設に渡す説明（日本語・1枚）

> **NIHO Experience のご案内**
>
> 鎌倉駅西口徒歩2分のシェアリビング「NIHO kamakura」が運営する、旅行者向けの体験予約サイトです。地元の人と一緒に料理をして食卓を囲むディナーのほか、地域の作り手による体験を英語で紹介しています。
>
> - お客様は英語のページから、会員登録なしで予約・決済できます。
> - 予約・質問・キャンセルの対応は、NIHOと各体験の提供者が行います。フロントで対応していただく必要はありません。
> - お願いしたいのは、フロントにカード（A6）を置いていただくことだけです。カードとQRコードはNIHOが用意します。
> - 試験期間中は、紹介料などのお支払いはありません。
>
> お問い合わせ：（オーナーの連絡先。公開リポには書かない）

提携先を選ぶ基準：鎌倉駅から徒歩15分以内、宿泊のお客様が多い、フロントで英語の案内をしている、の3つ。候補の名前は非公開台帳に置く。
