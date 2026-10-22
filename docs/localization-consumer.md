# 英日公開consumer（#59 / #66）

## 境界

英語を原文・既定URLのまま維持し、承認済みの日本語releaseだけを `/ja` でSSR表示する。翻訳、AUTO/manual値の更新、再翻訳候補の作成、公開判定はNIHO側が正本であり、このリポは変更しない。体験説明を含む公開投影、342-key UI copy、PageDocument/sidecarを選択済みreleaseから読む。

`EXPERIENCE_PRESENTATION_SOURCE_DISPLAY_ENABLED` と `EXPERIENCE_JAPANESE_SITE_ENABLED` は既定で `false`。前者は固定identity（renderer/source commit/tgz/copy/style/assets digestが完全一致）の英語source-display、後者は承認済み日本語releaseの配備受入後にだけ個別に有効化する。この実装だけではproduction capability readyを意味しない。

## fail closed

- 日本語のcopy、page/chrome、catalog/detail/availability/checkoutはlocale pathで取得し、release IDを画面単位で一致させる。404、撤回、release不一致、未知renderer、欠けた342-key copyは日本語未提供として扱う。
- 日本語bookingは公開detailの `localization.bookingReady` と `unavailableCopyKey` がreadyを示す場合だけ入口を出す。checkoutではNIHOがterms fingerprint・consent・価格・残席を再照合し、`LOCALIZATION_OUTDATED` は再読込を案内する。
- `/ja/experiences/:slug/book` と `/ja/booking/*` は `private, no-store`、`noindex, nofollow`。日本語rootにはanalytics/attribution captureを置かず、guest入力をURL・計測へ渡さない。
- hreflang、言語切替、sitemapは同一releaseで検証できた静的counterpartだけを出す。日本語がない場合に英語本文を日本語完了版として表示しない。

## 現契約で閉じている範囲

localized page/sidecar応答には日本語の公開presentation asset documentがない。このため authored PageDocumentだけを表示し、`code-default` 日本語は英語assetsを借りずに非提供とする。

英語source-displayのdecorative assetは、固定registryの動画と、content hashで不変参照を検証できる企業画像だけをconsumerへbindする。`business-public` のasset versionは16桁のCURRENT identityで、凍結rendererの `sha256` asset契約へ正しく写せるcontent digestが公開応答にないため、該当する装飾画像を採用したsource envelopeはfail closedとする（体験DTO自身の公開写真とは別の制約）。

また、公開catalog/detailには英語URLと日本語URLを結ぶ不変なcanonical page mapping（listing identityを含む）がない。slug一致を推測しないため、動的な体験詳細の言語切替、相互hreflang、sitemap掲載は閉じている。静的4ページ（home、experiences、host、help）はlocalized route契約の `sourcePath` / `path` が完全一致した場合だけ公開する。backend source hooksと実配備受入は次段階で行う。

## 固定配布物の受入

2026-10-22時点で、producer commit `0b6f1d77c1496282eae8cab1eabf516f5b8a0da7` に固定されたidentityと、このリポの追跡済み配布物を照合した結果は次のとおり。

| 配布物 | 固定identityのSHA256 | 追跡済みファイルのSHA256 |
| --- | --- | --- |
| `packages/experience-presentation/dist/experience-presentation-v1.tgz` | `c4d4d066f767c525d2d1b8455f8b9b9793d1ce6610997f9c41a7a01fc3c65bd6` | `a83a67755d81a27773763387bb5150e0091e0a77456ab25de88e5d34173e03e0` |
| `dist/v1/styles.css` | `500fd3c948b3cdc5f7e3423e621ab01927e13ba7740f42e5c4ad22e612917003` | 一致 |
| `dist/v1/static-copy-registry.json` | `242e2111e705a14755d10f13d8d16820792ea1aeac3f337b9b01babbfdb106a9` | 一致 |

CSS・copy registryが一致しても、archive全体の同一性は成立していない。固定producer artifactの由来と内容を検証して再受入するまで、公開フラグとbackend consumer capabilityのreadyを有効にしない。期待digestだけを現在値に差し替えない。

## 統合受入で残ること

- NIHO側の日本語presentation asset document、不変な動的URL対応、business-public装飾画像のcontent digestを契約へ追加し、選別された公開API配布物へ型を取り込む。現状の日本語DTOは基盤Draft SHA `a532a456fe9e4580d555ec34a61b8164e4ebabab` に合わせた仮の選別型。
- canonical business sourceの変更hook、翻訳outbox、site CAS、写真・公開許可撤回のtransaction整合を基盤側で接続する。
- 凍結copy registryで表せないcheckoutエラー別の回復操作、検索解除・日程再試行などの固有文言を、英語の既存UXを保ったまま公開copy契約へ追加する。現段階の日本語では一部が汎用の案内になるため、全画面接続の受入対象に含める。
- 英語原文からAUTO初稿を作り、手修正値の保護、原文更新時の再翻訳候補、承認release公開、日英切替、体験詳細から予約までを実際の承認済みreleaseで確認する。

これらを満たすまでは #59 / #66 を完了扱いにしない。

## 検証記録（2026-10-22）

- Web変更79ファイルのESLintと `git diff --check` が成功。最後のRSC境界修正後にWeb型検査（Next route typegen、web/e2eのTypeScript）と対象15ファイル79テストが成功。API clientの型検査と対象20テストも成功。
- Chromeのローカル合成mockで、英語のhome・一覧・詳細から日付選択、予約の連絡先・同意フォーム表示まで確認。存在しない英語slugの404、320pxでの主要画面の横overflowなし、日本語未公開時の案内と `lang=ja` / noindex、英語予約のnoindexを確認。個人情報入力や決済送信は行っていない。
- 日本語成功応答はHTTP fixtureのloaderテストで確認。実際の承認済み日本語releaseのブラウザ受入は未実施。
- production build・全E2Eは公開CIの `web`、API client全契約検証は `api-client` に委譲する。ローカルでは変更範囲の検証を実施し、CIと重複する全件検証は起動していない。
