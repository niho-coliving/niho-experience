import Link from "next/link";

/** Fail-closed state used before the first approved whole-locale release. */
export function JapaneseUnavailable() {
  return <div className="container-page max-w-2xl py-20 text-center" lang="ja">
    <p className="eyebrow">Japanese version</p>
    <h1 className="mt-2 text-3xl">日本語版はまだ公開されていません</h1>
    <p className="mt-4 text-ink-soft">確認済みの日本語ページが公開されるまで、英語版をご覧ください。</p>
    <p className="mt-7"><Link href="/" hrefLang="en" className="link-leaf">View the English site</Link></p>
  </div>;
}
