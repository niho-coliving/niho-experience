import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HostIcon } from "@/components/host/HostIcon";
import { HostRegisterPrompt } from "@/components/host/HostRegisterPrompt";
import { HostSubHeader } from "@/components/host/HostSubHeader";
import { HostPageBody, StatusPill } from "@/components/host/ui";
import { hostPageContext, loadHostConsoleData } from "@/host/data";
import { LISTING_STATUS } from "@/host/status";
import { HOST_EXPERIENCES_PATH, withProvider } from "@/lib/host/routes";

export const metadata: Metadata = { title: "体験" };

type SearchParams = Record<string, string | string[] | undefined>;

/** Stand-in for the experience editor (#89): the title, its listing state and the way back. */
export default async function HostExperiencePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const context = await hostPageContext(query);
  if (!context) return null;
  const { provider, linkProviderId } = context;
  if (!provider) return <HostRegisterPrompt title="体験" />;
  const { experiences } = await loadHostConsoleData(provider);
  const experience = experiences.find((candidate) => candidate.id === id);
  if (!experience) notFound();
  const back = withProvider(HOST_EXPERIENCES_PATH, linkProviderId);

  return (
    <>
      <HostSubHeader backHref={back} backLabel="体験" title={experience.title} />
      <HostPageBody>
        <div className="flex items-center gap-3">
          <Link href={back} aria-label="体験へ戻る" className="grid size-10 shrink-0 place-items-center rounded-full bg-sand hover:bg-line max-md:hidden">
            <HostIcon name="chevronLeft" className="size-[18px]" />
          </Link>
          <h1 className="min-w-0 flex-1 font-sans text-[1.0625rem] leading-[1.3] font-extrabold tracking-normal [overflow-wrap:anywhere] md:text-[1.375rem]">{experience.title}</h1>
          <StatusPill status={LISTING_STATUS[experience.status]} />
        </div>
        <p className="mt-4 text-ink-soft">体験ページの編集は準備中です。</p>
      </HostPageBody>
    </>
  );
}
