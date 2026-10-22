import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HostRegisterPrompt } from "@/components/host/HostRegisterPrompt";
import { HostSession } from "@/components/host/HostSession";
import { HostSubHeader } from "@/components/host/HostSubHeader";
import { HOST_SURFACE } from "@/components/host/host-ui";
import { HostPageBody, SubPageHead } from "@/components/host/ui";
import { bookingsHref } from "@/host/bookings";
import { hostPageContext, loadHostSession } from "@/host/data";
import { sessionQueryOf } from "@/host/session";

export const metadata: Metadata = { title: "参加者と出欠" };

type SearchParams = Record<string, string | string[] | undefined>;

/** http mode until NIHO's API has the session's guests and attendance (#87; niho-app#19321): the way back and nothing that pretends to work. */
function SessionUnavailable({ backHref }: { backHref: string }) {
  return (
    <>
      <HostSubHeader backHref={backHref} backLabel="予約" title="参加者と出欠" />
      <HostPageBody>
        <SubPageHead backHref={backHref} backLabel="予約" title="参加者と出欠" />
        <section className={`${HOST_SURFACE} px-5 py-8 md:px-6 md:py-10`}>
          <p className="font-extrabold">この画面は準備中です</p>
          <p className="mt-1 text-ink-soft">当日の参加者の確認・出欠・この回の中止は、NIHO との接続ができしだいここから行えるようになります。</p>
        </section>
      </HostPageBody>
    </>
  );
}

/**
 * この回 (#107): one session's guests and attendance on the day, under 予約: the menu keeps 予約
 * selected and phones go back with "‹ 予約" (no bottom tabs). `?date=&start=&experience=&offer=`
 * name the session; one without a booking of the provider's does not exist here.
 */
export default async function HostSessionPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const context = await hostPageContext(query);
  // The console layout shows sign-in, refresh and error states.
  if (!context) return null;
  const { provider, linkProviderId } = context;
  if (!provider) return <HostRegisterPrompt title="予約" />;
  const session = sessionQueryOf(query);
  if (!session) notFound();
  const { lookup, now, conversations } = await loadHostSession(provider, session);
  if (lookup.status === "unavailable") return <SessionUnavailable backHref={bookingsHref({ providerId: linkProviderId })} />;
  // Another provider's session, or none at all.
  if (lookup.status === "missing") notFound();
  // Keyed by provider and session: another one starts from its own bookings.
  return <HostSession key={`${provider.id}/${session.date}/${session.start}/${session.experience}/${session.offer}`} session={lookup.session} now={now} conversations={conversations} providerId={linkProviderId} />;
}
