import type { Metadata } from "next";
import { PageDocumentContent, blockText, type BlockProps } from "@/components/PageDocument";
import { TrackView, TrackedLink } from "@/components/Analytics";
import { HandIcon } from "@/components/HandIcon";
import { buttonClass, Notice, SectionHeading } from "@/components/ui";
import { config } from "@/lib/config";
import { safeHttpsUrl } from "@/lib/safe-url";
import { getPublishedPageDocument } from "@/lib/page-documents";

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
    <section className="mt-8 max-w-2xl" aria-label="How to start">
      {startUrl ? (
        <div className="space-y-3">
          <TrackedLink href={startUrl} event="host_start" props={{ signup_mode: "open" }} className={buttonClass("primary", "text-lg")}>
            {blockText(props, "label", "Start with your NIHO account")}
          </TrackedLink>
          <p className="text-sm text-muted">You&apos;ll sign in or create an account on NIHO. Already a NIHO seller? You can use the same account.</p>
        </div>
      ) : (
        <Notice tone="info" title="We're starting with a small group of hosts">
          <p>During the first season we work directly with a few hosts we know. Online sign-up opens after that.
            {contactUrl ? null : " If you'd like to be one of them, ask us at NIHO in Kamakura."}</p>
          {contactUrl ? <p className="mt-3"><TrackedLink href={contactUrl} event="host_start" props={{ signup_mode: "pilot" }} className="font-bold text-moss underline">
            {blockText(props, "label", "Tell us you're interested")}
          </TrackedLink></p> : null}
        </Notice>
      )}
    </section>
  );
  const fallback = (
    <div className="container-page pt-8 sm:pt-12">
      <header className="max-w-2xl space-y-4">
        <p className="eyebrow">For people in Kamakura</p>
        <h1 className="text-[2.5rem] sm:text-[3.5rem]">Share what you love with travelers</h1>
        <p className="text-lg text-ink-soft">
          You don&apos;t need to be a tour guide. If you cook for friends, make things with your hands, or know a walk worth taking, travelers would love to
          spend time with you.
        </p>
      </header>

      {signup()}

      <section className="mt-16" aria-labelledby="steps">
        <SectionHeading id="steps" eyebrow="How it works" title="From idea to first guests" />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <span className="hand text-4xl" aria-hidden>
                {i + 1}
              </span>
              <h3 className="mt-2 text-lg">{s.title}</h3>
              <p className="mt-1 text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2" aria-label="Who does what">
        <Column title="What you do" items={YOU} />
        <Column title="What NIHO does" items={NIHO} highlight />
      </section>

      <section className="mt-16 max-w-2xl space-y-3" aria-labelledby="money">
        <h2 id="money" className="text-2xl sm:text-3xl">
          Fees and payments
        </h2>
        <p className="text-ink-soft">
          Guests pay online when they book. Payments are processed by Stripe and paid out to the account you choose in NIHO. We&apos;ll explain the fees and
          terms clearly before you list anything.{startUrl ? null : <>{" "}Nothing is charged to you for talking with us.</>}
        </p>
      </section>
    </div>
  );
  return <>
    <TrackView event="host_view" props={{ signup_mode: startUrl ? "open" : "pilot" }} />
    <PageDocumentContent document={document} pageId="host" fallback={fallback} slots={{ HostSignupCTA: (props) => <div className="container-page">{signup(props)}</div> }} />
  </>;
}

function Column({ title, items, highlight = false }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] p-6 ${highlight ? "bg-leaf-pale" : "bg-sand"}`}>
      <h2 className="mb-4 text-2xl">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <HandIcon name="check" className="mt-0.5 size-6 text-moss" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
