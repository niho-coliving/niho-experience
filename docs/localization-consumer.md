# 日英の公開表示（#59 / #66）

2026-10-22のオーナー決定により、サイト全体のビジュアル編集は凍結する。ヘッダー・余白・レイアウト・スタイルはこのリポジトリのコードを正本とし、公開画面の変更にエディタの追従・プレビュー一致・描画部品や画像の版同期を要求しない。

## 公開画面と翻訳の境界

英語を原文・既定URLとし、承認済み日本語releaseを `/ja` でSSR表示する。英日ともコードの描画部品を使い、公開PageDocument・chrome・presentation provenanceをレイアウトへ採用しない。装飾文書、renderer identity、画像digestの欠損や変更は、コード描画を停止する理由にしない。

公開画面は、342-key UI copy、体験紹介を含む公開業務DTO、静的ページのroute・SEOを取得する。翻訳生成、AUTO/manual値の更新、再翻訳候補、公開承認、権限はNIHO側が正本である。提供者の `/host` 原稿編集・予約管理は維持する。Kamakura-siteのCMSもこの凍結の対象ではない。

`EXPERIENCE_PRESENTATION_SOURCE_DISPLAY_ENABLED` は廃止し、既存環境に値が残っていても表示を変更しない。`EXPERIENCE_JAPANESE_SITE_ENABLED` は承認済みreleaseの実配備受入後に有効化する。今回の分離だけでは、日本語の運用開始や全サイト日英化の完了を意味しない。

## 引き続き検査すること

- copy・route/SEO・catalog/detail・availability/checkoutは選択したlocaleから取得し、画面内のreleaseを一致させる。公開版の欠損、撤回、不正DTO、不完全なcopy、placeholder不整合は日本語未提供として扱う。
- 静的4ページのrouteは `sourcePath` と日本語pathを照合する。全体のroute・copyが整うまで言語切替を公開せず、未翻訳の本文を日本語の完成版として表示しない。
- 日本語予約は `localization.bookingReady` と `unavailableCopyKey` で入口を判定する。価格・残席・terms fingerprint・consentはNIHOが再確認し、`LOCALIZATION_OUTDATED` は再読込を案内する。
- 日本語予約・戻りは `private, no-store`、`noindex, nofollow`。日本語rootへanalytics/attribution captureを置かず、guest入力をURL・計測へ渡さない。
- 上流応答はbounded JSONで読み、公開業務DTOのschemaを検証する。装飾文書を無視することを理由に、業務データや翻訳の検証を緩めない。

## 残る統合受入

- 動的ページの日英URLを結ぶ不変なlisting/canonical page mapping。slug一致で推測せず、未接続のdetail/booking言語切替・相互hreflang・動的sitemapを有効化しない。
- canonical business sourceの変更hook、翻訳outbox、site CAS、写真と公開許可の撤回整合。
- 自動翻訳初稿、手動修正の保護、原文更新時の候補、承認release公開、サイト内巡回、体験詳細から予約までの実受入。
- 検索解除やcheckoutエラーごとの回復文言を含む、日本語全画面の確認。

日本語presentation asset document、装飾画像のcontent digest、旧エディタのTGZ identity一致は、公開サイトの開発・配備条件から外す。旧接続の仕様・検証記録はGitの凍結前revision（`d5627de`）と `docs/frozen/` の資料に保持し、将来の再接続時に新しく受入する。上記の翻訳・業務受入を満たすまで #59 / #66 は完了扱いにしない。

## 分離時の検証

- 全Web unit 47ファイル325テスト、ESLint、Next route typegenとweb/e2e TypeScriptが成功。
- 旧source-display環境値で再開しないこと、visual metadataを描画・公開可否に使わないこと、公開ルートがエディタのimport graphから外れていることを検証。
- 日本語の実承認releaseは未配備。全E2Eとproduction buildは公開CIの `web` へ委譲する。本番のフラグやデータは変更していない。
