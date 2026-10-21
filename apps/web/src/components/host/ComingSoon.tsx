import Link from "next/link";
import { nihoIdOrNull } from "@/lib/host/providers";
import { HOST_HOME_PATH, withProvider } from "@/lib/host/routes";
import { HOST_SURFACE } from "./host-ui";
import { HostPageBody, PageHead } from "./ui";

/** Placeholder for console sections that later Issues fill in (H3–H6). Nothing on it pretends to work. */
export function ComingSoon({ title, body, providerId }: { title: string; body: string; providerId?: string | string[] | undefined }) {
  return (
    <HostPageBody>
      <PageHead title={title} />
      <section className={`${HOST_SURFACE} px-5 py-8 md:px-6 md:py-10`}>
        <p className="font-extrabold">この画面は準備中です</p>
        <p className="mt-1 text-ink-soft">{body}</p>
        <p className="mt-4">
          <Link href={withProvider(HOST_HOME_PATH, nihoIdOrNull(providerId))} className="font-bold text-moss underline underline-offset-4">
            ホームへ戻る
          </Link>
        </p>
      </section>
    </HostPageBody>
  );
}
