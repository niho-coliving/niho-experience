import type { Metadata } from "next";
import { PageDocumentContent, blockText, type BlockProps } from "@/components/PageDocument";
import { TrackView, TrackedLink } from "@/components/Analytics";
import { AmbientVideo } from "@/components/AmbientVideo";
import { HandIcon } from "@/components/HandIcon";
import { ButtonLink, buttonClass, SectionHeading } from "@/components/ui";
import { config } from "@/lib/config";
import { safeHttpsUrl } from "@/lib/safe-url";
import { getPublishedPageDocument } from "@/lib/page-documents";
import { HOST_BAND_VIDEO } from "@/lib/site-media";

function hostStartUrl(value: string, nihoOrigin: string): string | null {
  try {
    const url = new URL(value);
    const origin = new URL(nihoOrigin);
    if (url.origin !== origin.origin || url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    // Integration B owns this route, including the login return to the provider page.
    // Keep the configured URL pinned here so a bad deployment value cannot send hosts elsewhere on NIHO.
    if (url.pathname !== "/experiences/provider") return null;
    return url.href;
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const document = await getPublishedPageDocument("host");
  return {
    title: document?.title ?? "Host an experience with NIHO",
    description: "Share a meal, a craft or a favorite walk with travelers in Kamakura. NIHO helps you prepare, list and take bookings.",
    alternates: { canonical: `${config.siteUrl}/host` },
  };
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

const YOU = [
  "Host the experience and look after your guests",
  "Keep your dates and capacity up to date",
  "Check facts in your listing, like what's included and where to meet",
  "Complete identity and payout checks with Stripe if your account needs them",
];

const NIHO = [
  "Help write and edit your page in English",
  "Advise on photos, pricing and terms",
  "Show your experience to travelers and take bookings and payments",
  "Answer guest questions before the day",
];

export default async function HostPage() {
  const document = await getPublishedPageDocument("host");
  const startUrl = config.hostSignupMode === "open" ? hostStartUrl(config.nihoHostStartUrl, config.nihoWebOrigin) : null;
  const steps = startUrl ? OPEN_STEPS : PILOT_STEPS;
  const contactUrl = safeHttpsUrl(config.hostPilotContactUrl);
  const signup = (props: BlockProps = {}) => (
    <section className="mt-7 max-w-2xl" aria-label="How to start">
      {startUrl ? (
        <div className="space-y-3">
          <TrackedLink href={startUrl} event="host_start" props={{ signup_mode: "open" }} className={buttonClass("primary", "text-lg")}>
            {blockText(props, "label", "Start with your NIHO account")}
          </TrackedLink>
          <p className="text-sm text-muted">
            You&apos;ll sign in or create an account on NIHO, register as an individual or small business, and manage your listing, bookings and sales there.
            NIHO reviews listings before they go live; Stripe may ask you to verify your identity. Already a NIHO seller? You can use the same account.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3.5 rounded-[22px] bg-leaf-pale p-5">
          <HandIcon name="house" className="size-10 text-moss [stroke-width:1.5]" />
          <div>
            <p className="text-[1.0625rem] font-extrabold">We&apos;re starting with a small group of hosts</p>
            <p className="mt-1 text-[0.9375rem] text-ink-soft">During the first season we work directly with a few hosts we know. Online sign-up opens after that.
              {contactUrl ? null : " If you'd like to be one of them, ask us at NIHO in Kamakura."}</p>
            {contactUrl ? <p className="mt-3"><TrackedLink href={contactUrl} event="host_start" props={{ signup_mode: "pilot" }} className="font-bold text-moss underline">
              {blockText(props, "label", "Tell us you're interested")}
            </TrackedLink></p> : null}
          </div>
        </div>
      )}
    </section>
  );
  const fallback = (
    <div className="container-page pt-7 sm:pt-12">
      <section className="grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <header className="max-w-2xl">
          <p className="eyebrow">For people in Kamakura</p>
          <h1 className="mt-1.5 text-[2.25rem] sm:text-[3.5rem]">Share what you love with travelers</h1>
          <p className="mt-3 text-ink-soft sm:text-lg">
            You don&apos;t need to be a tour guide. If you cook for friends, make things with your hands, or know a walk worth taking, travelers would love to
            spend time with you.
          </p>
        </header>
        <div className="arch aspect-[3/4] w-[min(100%,280px)] justify-self-center bg-line">
          <AmbientVideo video={HOST_BAND_VIDEO} />
        </div>
      </section>

      {signup()}

      <section className="pt-14 lg:pt-[104px]" aria-labelledby="steps">
        <SectionHeading id="steps" eyebrow="How it works" title="From idea to first guests" />
        <ol className="grid lg:grid-cols-2 lg:gap-x-12">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-4 border-b border-dashed border-line-strong py-4 last:border-b-0 lg:[&:nth-last-child(2)]:border-b-0">
              <span className="w-7 shrink-0 text-center font-hand text-[2.5rem] leading-[0.9] font-bold text-moss" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="font-sans text-[1.0625rem] leading-snug font-extrabold tracking-normal">{s.title}</h3>
                <p className="mt-0.5 text-[0.9375rem] text-ink-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="pt-14 lg:pt-[104px]" aria-labelledby="who-does-what">
        <SectionHeading id="who-does-what" eyebrow="who does what" title="You host. We help." />
        <div className="grid gap-3.5 md:grid-cols-2">
          <Column title="You" items={YOU} />
          <Column title="NIHO" items={NIHO} highlight />
        </div>
      </section>

      <section className="max-w-2xl pt-14" aria-labelledby="money">
        <h2 id="money" className="mb-4 text-[1.75rem] sm:text-[2rem]">
          Fees and payments
        </h2>
        <div className="flex items-start gap-3.5 rounded-[22px] bg-sand p-5">
          <HandIcon name="card" className="size-10 text-moss [stroke-width:1.5]" />
          <p className="text-[0.9375rem] text-ink-soft">
            Guests pay online when they book. Payments are processed by Stripe and paid out to the account you choose in NIHO. We&apos;ll explain the fees and
            terms clearly before you list anything.{startUrl ? null : <>{" "}Nothing is charged to you for talking with us.</>}
          </p>
        </div>
      </section>

      <p className="mt-7 max-w-2xl">
        {/* The sign-up link above stays the one main action when hosting is open. */}
        <ButtonLink href="/experiences" variant={startUrl ? "secondary" : "primary"} className="w-full">
          See the experiences
        </ButtonLink>
      </p>
    </div>
  );
  return <>
    <TrackView event="host_view" props={{ signup_mode: startUrl ? "open" : "pilot" }} />
    <PageDocumentContent document={document} pageId="host" fallback={fallback} slots={{ HostSignupCTA: (props) => <div className="container-page">{signup(props)}</div> }} />
  </>;
}

function Column({ title, items, highlight = false }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-[22px] p-5 ${highlight ? "bg-leaf-pale" : "bg-sand"}`}>
      <h3 className="mb-2.5 font-sans text-sm font-extrabold tracking-[0.03em] text-muted uppercase">{title}</h3>
      <ul className="space-y-2.5 text-[0.9375rem]">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <HandIcon name="check" className="-mt-px size-6 text-moss" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
