# SEOの情報設計案（URL・title・canonical・構造化データ）

最終更新：2026-10-19（担当3）。対象：[#12](https://github.com/niho-coliving/niho-experience/issues/12)の検索・原稿・情報設計の部分。
実装（SSR、sitemap、robots、メタタグ、構造化データ）は担当1。正式ドメインと正規URLの統一はオーナーが決める。ここに書く値はすべて案。

## 現状（2026-10-19に各ページのHTMLで確認）

| ページ | 検索公開 | canonical | 本文の初期HTML | 構造化データ |
| --- | --- | --- | --- | --- |
| [NIHOapp企画ページ](https://niho.life/living/nihokamakura/pages/community-dinner-with-locals) | `noindex, follow` | 自己参照 | あり | Product＋Offer、開催日ごとのEvent |
| [公式サイトのディナーのページ](https://kamakura.niho.life/kamakura-community-dinner) | `robots: all`、sitemapに掲載 | 指定なし | なし（JavaScriptで描画） | なし |
| niho-experience | 未公開 | — | — | — |

同じ体験の英語の紹介が2か所にあり、検索公開されているのは本文が後から描画されるページだけ、という状態。

## 正規URLの方針

**推奨：niho-experienceの体験ページを、体験ごとに唯一の検索公開ページにする。**

| ページ | 推奨の扱い |
| --- | --- |
| niho-experienceの体験ページ | index、自己参照canonical、sitemapに掲載 |
| NIHOapp企画ページ | 現状どおりnoindex。もしくはcanonicalをniho-experienceへ向ける。どちらにするかは担当2・オーナーと決める |
| 公式サイトのページ | 原稿の全文を重複して載せず、短い紹介と予約ページへのリンクにする。変更はオーナーの判断 |

本番公開の前に、公開ドメインと既存NIHOの商品ページの正規URLを統一する（[architecture.md](../architecture.md)）。

## URL

| 種類 | URL案 | 検索公開 |
| --- | --- | --- |
| トップ | `/` | する |
| 体験一覧 | `/experiences` | する |
| 体験詳細 | `/experiences/{slug}` 例：`/experiences/kamakura-community-dinner` | する |
| 絞り込み・検索 | `/experiences?theme=...&date=...` | しない（`noindex, follow`、canonicalは `/experiences`、sitemapに載せない） |
| 予約入力・Checkoutからの戻り・予約確認 | 担当1・2が決める | しない。`no-store`、robots.txtで巡回させない、sitemapやページからリンクしない。tokenをURLに入れない（[#10](https://github.com/niho-coliving/niho-experience/issues/10)） |
| プレビュー | 本番と別のホスト | しない。認証で閉じ、`X-Robots-Tag: noindex` も付ける |
| 提供者 | v1では体験詳細の中に置き、単独ページを作らない | — |

- slugは英小文字とハイフン。地域と体験の名詞を入れ、日付や価格を入れない。一度公開したslugは変えない。変える場合は301で転送する。
- 日付を選ぶカレンダーはボタンで実装し、日付ごとのURLへのリンクを作らない（巡回できる組み合わせを無限に増やさない）。
- 体験が一時的に満席・販売停止のときは200で表示し、「No dates available」と次の行動を示す。販売を終了した体験は、近い内容の体験がある場合だけ301、ない場合は410を返す。

## title・description・OG

| 項目 | 案 |
| --- | --- |
| title | `{体験の表示名} \| {サイト名}`。60字以内。例：Kamakura Community Dinner with Locals \| （サイト名は未定） |
| meta description | 原稿のleadを短くし、所要時間・人数・言語を足す。155字以内。価格はAPIの値と同期できる場合だけ入れる |
| og:image | メイン写真から1200×630で切り抜く。権利の確認済みのもの |
| og:url | canonicalと同じ |
| `html lang` | `en` |

## 構造化データ

表示している内容と一致するデータだけを出す。v1の段階的な案：

1. **最初**：`Organization`、`BreadcrumbList`
2. **API契約と表示の実装後**：体験詳細に `Product` と `Offer` を出すか、開催日ごとの `Event` を出すかを、Googleのガイドラインを確認したうえで担当1と決める。価格・在庫・日時は画面と同じAPIの値を使う。実際に開催が決まっていない日を「毎日開催」として大量に出さない
3. **出さないもの**：`AggregateRating`・`Review`（このサイトで実際のレビューを集める仕組みと規約ができるまで）。OTAや拠点への評価を転用しない

## 言語版とhreflang

v1は英語版だけなので、hreflangを出さない。日本語版を公開するときに、各言語版に自己参照canonicalと相互のhreflang、`x-default` を付ける。実在しない言語版をhreflangに書かない。

## 内部リンク

- トップ→体験一覧→体験詳細の順にたどれる。どの体験詳細もトップから2クリック以内。
- 体験詳細から、実在する他の体験へのリンクを2〜3件置く。架空の関連記事・空のカテゴリへのリンクを置かない。
- NIHOapp・公式サイトから、niho-experienceの体験ページへリンクする（オーナー判断）。

## 公開後の確認手順（ドメイン決定後）

| 手順 | 担当 |
| --- | --- |
| Search Consoleでドメインプロパティを作り、DNSで所有確認する。担当者に必要最小限の権限を付ける | オーナー |
| sitemapの送信、robots.txtの確認、トップ・一覧・体験詳細1件のURL検査 | 担当1 |
| 予約・プレビューのURLがインデックスされていないことの確認 | 担当1 |
| 公開から4週間は毎週、インデックス状況と検索語を確認し、判断だけをIssueに記録する（数値は非公開台帳） | 担当3 |

検索での上位表示やAIの回答への掲載は保証しない。
