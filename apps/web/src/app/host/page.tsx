import type { Metadata } from "next";
import { HostViewV1 } from "@niho/experience-presentation/v1";
import { PageDocumentContent, blockText, type BlockProps } from "@/components/PageDocument";
import { TrackView, TrackedLink } from "@/components/Analytics";
import { HandIcon } from "@/components/HandIcon";
import { buttonClass } from "@/components/ui";
import { PRESENTATION_PRIMITIVES_V1 } from "@/components/PresentationV1";
import { config } from "@/lib/config";
import { safeHttpsUrl } from "@/lib/safe-url";
import { getPublishedPageDocument } from "@/lib/page-documents";
import { HOST_BAND_VIDEO } from "@/lib/site-media";

function hostStartUrl(value: string, nihoOrigin: string): string | null {
  try {
    const url = new URL(value); const origin = new URL(nihoOrigin);
    if (url.origin !== origin.origin || url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/experiences/provider") return null;
    return url.href;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedPageDocument("host");
  return { title: document?.title ?? "Host an experience with NIHO", description: "Share a meal, a craft or a favorite walk with travelers in Kamakura. NIHO helps you prepare, list and take bookings.", alternates: { canonical: `${config.siteUrl}/host` } };
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

export default async function HostPage() {
  const document = await getPublishedPageDocument("host");
  const startUrl = config.hostSignupMode === "open" ? hostStartUrl(config.nihoHostStartUrl, config.nihoWebOrigin) : null;
  const contactUrl = safeHttpsUrl(config.hostPilotContactUrl);
  const signup = (props: BlockProps = {}) => <section className="mt-7 max-w-2xl" aria-label="How to start">{startUrl ? <div className="space-y-3"><TrackedLink href={startUrl} event="host_start" props={{ signup_mode: "open" }} className={buttonClass("primary", "text-lg")}>{blockText(props, "label", "Start with your NIHO account")}</TrackedLink><p className="text-sm text-muted">You&apos;ll sign in or create an account on NIHO, register as an individual or small business, and manage your listing, bookings and sales there. NIHO reviews listings before they go live; Stripe may ask you to verify your identity. Already a NIHO seller? You can use the same account.</p></div> : <div className="flex items-start gap-3.5 rounded-[22px] bg-leaf-pale p-5"><HandIcon name="house" className="size-10 text-moss [stroke-width:1.5]" /><div><p className="text-[1.0625rem] font-extrabold">We&apos;re starting with a small group of hosts</p><p className="mt-1 text-[0.9375rem] text-ink-soft">During the first season we work directly with a few hosts we know. Online sign-up opens after that.{contactUrl ? null : " If you'd like to be one of them, ask us at NIHO in Kamakura."}</p>{contactUrl ? <p className="mt-3"><TrackedLink href={contactUrl} event="host_start" props={{ signup_mode: "pilot" }} className="font-bold text-moss underline">{blockText(props, "label", "Tell us you're interested")}</TrackedLink></p> : null}</div></div>}</section>;
  const fallback = <HostViewV1 primitives={PRESENTATION_PRIMITIVES_V1} model={{ video: HOST_BAND_VIDEO, steps: startUrl ? OPEN_STEPS : PILOT_STEPS, you: YOU, niho: NIHO, signup: signup(), signupOpen: Boolean(startUrl) }} />;
  return <><TrackView event="host_view" props={{ signup_mode: startUrl ? "open" : "pilot" }} /><PageDocumentContent document={document} pageId="host" fallback={fallback} slots={{ HostSignupCTA: (props) => <div className="container-page">{signup(props)}</div> }} /></>;
}
