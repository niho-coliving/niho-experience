import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HostIcon } from "@/components/host/HostIcon";
import { HostRegisterPrompt } from "@/components/host/HostRegisterPrompt";
import { consoleButtonClass, HOST_SURFACE } from "@/components/host/host-ui";
import { HostPageBody, PageHead, StatusPill } from "@/components/host/ui";
import { hostPageContext, loadHostConsoleData } from "@/host/data";
import { experienceMeta } from "@/host/format";
import { experiencePath } from "@/host/home";
import { LISTING_STATUS } from "@/host/status";
import { withProvider } from "@/lib/host/routes";

export const metadata: Metadata = { title: "体験" };

type SearchParams = Record<string, string | string[] | undefined>;

const THUMB = "h-12 w-16 shrink-0 rounded-[10px] bg-sand md:h-[72px] md:w-24";

/** 体験 (mock v2): every experience page of the provider with its one listing state. */
export default async function HostExperiencesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const context = await hostPageContext(await searchParams);
  if (!context) return null;
  const { provider, linkProviderId } = context;
  if (!provider) return <HostRegisterPrompt title="体験" />;
  const { experiences } = await loadHostConsoleData(provider);

  return (
    <HostPageBody>
      <PageHead title="体験">
        {/* Creating an experience arrives with the editor (#89); for now the button does nothing. */}
        <button type="button" className={consoleButtonClass("primary")}>
          <HostIcon name="plus" className="size-4" />
          新しい体験
        </button>
      </PageHead>
      <section aria-label="体験の一覧" className={HOST_SURFACE}>
        {experiences.length ? (
          <ul>
            {experiences.map((experience) => (
              <li key={experience.id} className="border-t border-line first:border-t-0">
                <Link href={withProvider(experiencePath(experience.id), linkProviderId)} className="flex min-h-[52px] items-center gap-3 px-3.5 py-3 hover:bg-sand/60 md:px-4">
                  {experience.cover ? (
                    <Image src={experience.cover} alt="" width={96} height={72} sizes="96px" unoptimized className={`${THUMB} object-cover`} />
                  ) : (
                    <span aria-hidden="true" className={`block ${THUMB}`} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.875rem] leading-[1.4] font-extrabold [overflow-wrap:anywhere]">{experience.title}</span>
                    <span className="block text-[0.78125rem] leading-normal text-muted">{experienceMeta(experience)}</span>
                  </span>
                  <StatusPill status={LISTING_STATUS[experience.status]} />
                  <HostIcon name="chevronRight" className="size-4 text-line-strong max-md:hidden" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-muted md:px-5">まだ体験がありません。</p>
        )}
      </section>
    </HostPageBody>
  );
}
