import type { Metadata } from "next";
import { buttonClass } from "@/components/ui";
import { config } from "@/lib/config";
import { safeNihoHelpUrl } from "@/lib/safe-url";

export const metadata: Metadata = { title: "Booking help", robots: { index: false, follow: true } };

/** NIHO's existing public support address. No booking or customer data is put in the email link. */
const supportEmail = "info@niho.life";
const emailHref = `mailto:${supportEmail}?subject=NIHO%20Experience`;

export default function HelpPage() {
  const helpUrl = safeNihoHelpUrl(config.nihoBookingHelpUrl, config.nihoWebOrigin);
  return <div className="container-page max-w-2xl py-10 sm:py-16">
    <p className="eyebrow">We&apos;re here to help</p>
    <h1 className="mt-2 text-4xl sm:text-5xl">Booking help</h1>
    <div className="mt-8 divide-y divide-line">
      <section className="py-6">
        <h2 className="text-2xl">Before you book</h2>
        <p className="mt-2 text-ink-soft">Questions about the experience, children or accessibility? Ask NIHO.</p>
      </section>
      <section className="py-6">
        <h2 className="text-2xl">Find your booking</h2>
        <p className="mt-2 text-ink-soft">Open the link in your confirmation email to see your booking status and meeting details. If the email is missing, check spam or contact NIHO.</p>
      </section>
      <section className="py-6">
        <h2 className="text-2xl">Changes and cancellations</h2>
        <p className="mt-2 text-ink-soft">Your confirmation link shows cancellation options for your booking. To request a change or contact your hosts, reply to that email.</p>
      </section>
    </div>
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <a href={helpUrl ?? emailHref} className={buttonClass("primary")}>{helpUrl ? "Get help on NIHO" : "Email NIHO"}</a>
      <a href={emailHref} className="font-bold text-moss underline underline-offset-4">{supportEmail}</a>
    </div>
  </div>;
}
