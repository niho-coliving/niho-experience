import Link from "next/link";
export default function JapaneseNotFound() { return <div className="container-page max-w-2xl py-20 text-center"><h1 className="text-3xl">ページが見つかりません</h1><p className="mt-4 text-ink-soft">この日本語ページは公開されていないか、現在利用できません。</p><p className="mt-7"><Link href="/ja" className="link-leaf">日本語トップへ</Link></p></div>; }
