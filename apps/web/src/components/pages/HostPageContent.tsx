import type { Metadata } from "next";
import type { PageDocument } from "@niho/web/core";
import { redirect } from "next/navigation";
import { EN_STATIC_COPY_V1, HostViewV1 } from "@niho/experience-presentation/v1";
import { PageDocumentContent, blockText, type BlockProps } from "@/components/PageDocument";
import { TrackView, TrackedLink } from "@/components/Analytics";
import { HandIcon } from "@/components/HandIcon";
import { buttonClass } from "@/components/ui";
import { PRESENTATION_PRIMITIVES_V1 } from "@/components/PresentationV1";
import { config } from "@/lib/config";
import { safeHttpsUrl } from "@/lib/safe-url";
import { getPublishedPageDocument, getPublishedPageMetadata } from "@/lib/page-documents";
import { HOST_BAND_VIDEO } from "@/lib/site-media";
import { publicMetadata } from "@/lib/public-metadata";
import { nihoIdOrNull } from "@/lib/host/providers";
import { HOST_LOGIN_PATH, hostLandingPath } from "@/lib/host/routes";
import { isHostMock, readHostSession } from "@/lib/host/server";
import { assertSameJapaneseRelease, getJapaneseCopy, getJapanesePage, japaneseRenderableDocument, type SiteLocale } from "@/lib/localized-content";
import { JapaneseUnavailable } from "@/components/JapaneseUnavailable";
import { englishAlternates } from "@/lib/locale-metadata";
import { japaneseStaticMetadata } from "@/lib/locale-metadata";
import { getEnglishStaticCopy, getPresentationSource } from "@/lib/presentation-source";

function hostStartUrl(value: string, nihoOrigin: string): string | null {
  try {
    const url = new URL(value); const origin = new URL(nihoOrigin);
    if (url.origin !== origin.origin || url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/experiences/provider") return null;
    return url.href;
  } catch { return null; }
}

export async function englishHostMetadata(): Promise<Metadata> {
  const page = await getPublishedPageMetadata("host");
  return { ...publicMetadata(page.title ?? "Host an experience with NIHO", page.description ?? "Share a meal, a craft or a favorite walk with travelers in Kamakura. NIHO helps you prepare, list and take bookings.", `${config.siteUrl}/host`), alternates: await englishAlternates("/host") };
}
export async function japaneseHostMetadata(): Promise<Metadata> {
  try { return await japaneseStaticMetadata("host"); }
  catch { return { title: "Japanese host page unavailable", robots: { index: false, follow: false } }; }
}

const PILOT_STEPS = [
  { title: "Tell us your idea", body: "A short chat about what you'd like to share, how often, and for how many guests." },
  { title: "Prepare it together", body: "NIHO helps write the English page, plan photos, set a price and agree the cancellation terms with you." },
  { title: "Set up with your NIHO account", body: "Sign in to NIHO, choose or connect the account you'll be paid to, and add your dates." },
  { title: "Welcome your guests", body: "Bookings and guest details arrive in NIHO. You host; we help with questions along the way." },
];
const OPEN_STEPS = [
  { title: "Set up your host profile", body: "Use your NIHO account to register yourself or your small business and start an experience draft." },
  { title: "Prepare your listing", body: "Add the details and photos with NIHO's editing support. NIHO reviews the listing before it goes live." },
  { title: "Set up payments and dates", body: "Choose an account you're authorized to use or connect Stripe. Stripe may ask you to verify your identity." },
  { title: "Welcome your guests", body: "Once your listing and payout account are ready, bookings and guest details arrive in NIHO." },
];
const YOU = ["Host the experience and look after your guests", "Keep your dates and capacity up to date", "Check facts in your listing, like what's included and where to meet", "Complete identity and payout checks with Stripe if your account needs them"];
const NIHO = ["Help write and edit your page in English", "Advise on photos, pricing and terms", "Show your experience to travelers and take bookings and payments", "Answer guest questions before the day"];

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * With HOST_CONSOLE_ENABLED, signed-in hosts go straight to the console (設定, when Stripe
 * sends them back here with `?connect=`) and others get "NIHO でログイン". Only a well-formed
 * `providerId` is carried over.
 */
async function hostConsoleEntry(query: SearchParams): Promise<{ loginHref: string } | null> {
  if (!config.hostConsoleEnabled) return null;
  const providerId = nihoIdOrNull(query.providerId);
  if (await readHostSession()) redirect(hostLandingPath(providerId, query.connect));
  const params = new URLSearchParams();
  if (providerId) params.set("providerId", providerId);
  // Preview only: `?mock=empty` signs in as a synthetic host with no providers.
  if (isHostMock() && query.mock === "empty") params.set("mock", "empty");
  return { loginHref: params.size ? `${HOST_LOGIN_PATH}?${params}` : HOST_LOGIN_PATH };
}

export async function HostPageContent({ searchParams, locale }: { searchParams: Promise<SearchParams>; locale: SiteLocale }) {
  const consoleEntry = await hostConsoleEntry(await searchParams);
  let document: PageDocument | null, copy = EN_STATIC_COPY_V1;
  let hostVideo = HOST_BAND_VIDEO;
  if (locale === "ja") {
    try {
      const [siteCopy, page] = await Promise.all([getJapaneseCopy(), getJapanesePage("host")]);
      assertSameJapaneseRelease(siteCopy.releaseId, page); document = japaneseRenderableDocument(page); copy = siteCopy.copy;
    } catch { return <JapaneseUnavailable />; }
  } else {
    const [published, staticCopy, source] = await Promise.all([getPublishedPageDocument("host"), getEnglishStaticCopy(), config.presentationSourceDisplayEnabled ? getPresentationSource() : Promise.resolve(null)]);
    document = published; copy = staticCopy;
    const asset = source?.assets["home.hostBand"];
    if (asset?.kind === "video") hostVideo = { src: asset.src, poster: asset.poster };
  }
  const nihoProviderUrl = hostStartUrl(config.nihoHostStartUrl, config.nihoWebOrigin);
  // The console login replaces the links to NIHO's provider screen.
  const managementUrl = consoleEntry ? null : nihoProviderUrl;
  const startUrl = config.hostSignupMode === "open" ? managementUrl : null;
  const openSignup = config.hostSignupMode === "open" && Boolean(consoleEntry || nihoProviderUrl);
  const contactUrl = safeHttpsUrl(config.hostPilotContactUrl);
  const releasedCopy = locale === "ja" || config.presentationSourceDisplayEnabled;
  const signup = (props: BlockProps = {}) => (
    // Full width under the hero on desktop. Phone-only values are max-lg: so package-scoped base classes cannot override the lg: ones.
    <section className="max-lg:mt-7 max-lg:max-w-2xl lg:mt-10" aria-label={releasedCopy ? copy.text("host.start") : "How to start"}>
      {consoleEntry && openSignup ? null : startUrl ? (
        <div className="space-y-3">
          <TrackedLink href={startUrl} event="host_start" props={{ signup_mode: "open" }} className={buttonClass("primary", "text-lg")}>
            {blockText(props, "label", releasedCopy ? copy.text("host.start") : "Start with your NIHO account")}
          </TrackedLink>
          <p className="text-sm text-muted">
            {releasedCopy ? copy.text("host.feesBody") : "Use your NIHO account for experiences, bookings and sales. Listings need NIHO review; Stripe may request identity checks."}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3.5 rounded-[22px] bg-leaf-pale max-lg:p-5 lg:px-7 lg:py-6">
          <HandIcon name="house" className="size-10 text-moss [stroke-width:1.5]" />
          <div>
            <p className="text-[1.0625rem] font-extrabold">{releasedCopy ? copy.text("host.peopleTitle") : "We're starting with a small group of hosts"}</p>
            <p className="mt-1 text-[0.9375rem] text-ink-soft">{releasedCopy ? copy.text("host.peopleBody") : <>During the first season we work directly with a few hosts we know. Online sign-up opens after that.{contactUrl ? null : " If you'd like to be one of them, ask us at NIHO in Kamakura."}</>}</p>
            {contactUrl ? <p className="mt-3"><TrackedLink href={contactUrl} event="host_start" props={{ signup_mode: "pilot" }} className="font-bold text-moss underline">
              {blockText(props, "label", releasedCopy ? copy.text("host.start") : "Tell us you're interested")}
            </TrackedLink></p> : null}
          </div>
        </div>
      )}
      {!startUrl && managementUrl ? <p className="mt-4">
        <a href={managementUrl} className="link-leaf">{locale === "ja" ? "NIHOで体験を管理" : "Manage your experiences on NIHO"}</a>
      </p> : null}
      {consoleEntry ? (
        <div className={openSignup ? "space-y-3" : "mt-5 space-y-3"}>
          {/* A plain link: the console has its own root layout and login is a route handler. */}
          <a href={consoleEntry.loginHref} lang="ja" className={buttonClass("primary", "text-lg")}>NIHO でログイン</a>
          <p className="text-sm text-muted">
            {locale === "ja" ? (openSignup ? "NIHOアカウントでログインして、ホスト登録、体験の編集、予約・売上の確認ができます。" : "NIHOでホストをしている方は、ログインして体験、予約、売上を確認できます。") : openSignup
              ? "Sign in with your NIHO account to register as a host, edit your experiences and see bookings and sales. Stripe may request identity checks."
              : "Already hosting with NIHO? Sign in to edit your experiences and see bookings and sales."}
          </p>
        </div>
      ) : null}
    </section>
  );
  const fallback = locale === "ja" ? <JapaneseUnavailable /> : <HostViewV1 primitives={PRESENTATION_PRIMITIVES_V1} copy={copy} model={{ video: hostVideo, steps: openSignup ? OPEN_STEPS : PILOT_STEPS, you: YOU, niho: NIHO, signup: signup(), signupOpen: Boolean(startUrl || consoleEntry) }} />;
  return <>{locale === "en" ? <TrackView event="host_view" props={{ signup_mode: openSignup ? "open" : "pilot" }} /> : null}<PageDocumentContent document={document} pageId="host" fallback={fallback} slots={{ HostSignupCTA: (props) => <div className="container-page">{signup(props)}</div> }} /></>;
}
