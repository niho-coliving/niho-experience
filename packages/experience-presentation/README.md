# NIHO Experience presentation

`@niho/experience-presentation/v1` は公開英語サイトと NIHO staff preview が共有する固定 React presentation です。Next.js、router、API、auth、inventory、price authority、checkout 実装は含みません。

consumer はこの repository を review 済み Git SHA に固定し、`/v1` と `/v1/styles.css` を import します。`PRESENTATION_MANIFEST_V1` を `assertPresentationIdentityV1` で検証し、明示的な static copy、decorative asset binding、safe display model、behavior callback／primitive を渡します。React と ReactDOM は `^18.2.0 || ^19.0.0` の peer です。

React 非依存の copy 定義は `/v1/metadata`、同一内容の JSON は `/v1/metadata.json` から取得できます。redesign は `/v2` として追加し、保存済み localization snapshot 用の `/v1` を残します。

固定 SHA install の例:

```json
{
  "dependencies": {
    "@niho/experience-presentation": "https://raw.githubusercontent.com/niho-life/niho-experience/<reviewed-sha>/packages/experience-presentation/dist/experience-presentation-v1.tgz"
  }
}
```

配布するtgzには生成済みdist/v1、README、scripts/workspaces/devDependenciesを持たないpackage.jsonだけを含めます。通常のnpm installでもNextやサイト本体の依存を準備・ビルドしません。build.mjs --checkで全配布ファイルとtgzの再生成結果を比較します。
