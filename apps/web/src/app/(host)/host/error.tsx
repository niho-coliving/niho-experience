"use client";

import { hostButtonClass, HOST_HEADING } from "@/components/host/host-ui";

export default function HostError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className={`${HOST_HEADING} text-2xl`}>問題が発生しました</h1>
      <p role="alert" className="mt-3 text-ink-soft">画面を表示できませんでした。もう一度お試しください。</p>
      <p className="mt-8">
        <button type="button" onClick={reset} className={hostButtonClass("primary")}>もう一度試す</button>
      </p>
    </main>
  );
}
