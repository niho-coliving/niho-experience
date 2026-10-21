import Link from "next/link";
import { nihoIdOrNull } from "@/lib/host/providers";
import { HOST_HOME_PATH, withProvider } from "@/lib/host/routes";
import { HOST_CARD, HOST_HEADING } from "./host-ui";

/** Placeholder for console sections that later Issues fill in (H3–H6). */
export function ComingSoon({ title, body, providerId }: { title: string; body: string; providerId?: string | string[] | undefined }) {
  return (
    <div className="space-y-6">
      <h1 className={`${HOST_HEADING} text-2xl sm:text-3xl`}>{title}</h1>
      <section className={HOST_CARD}>
        <p className="font-bold">この画面は準備中です</p>
        <p className="mt-1 text-ink-soft">{body}</p>
        <p className="mt-4">
          <Link href={withProvider(HOST_HOME_PATH, nihoIdOrNull(providerId))} className="font-bold text-moss underline underline-offset-4">ホームへ戻る</Link>
        </p>
      </section>
    </div>
  );
}
