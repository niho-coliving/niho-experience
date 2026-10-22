import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { ButtonLink, Notice } from "@/components/ui";
import { isPreview } from "@/lib/config";

export const metadata: Metadata = { title: "Mock payment", robots: { index: false, follow: false } };
/** Preview destination only. No traveler input is sent to this server page. */
export default function MockCheckoutPage() {
  if (!isPreview) notFound();
  return (
    <div className="container-page max-w-xl py-12">
      <p className="eyebrow">Preview only</p>
      <h1 className="mt-2 text-3xl">Mock payment page</h1>
      <div className="mt-6"><Notice tone="warn" title="This is not a real payment">No card details are requested and nothing is charged. Your entered details stayed in the previous browser page.</Notice></div>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/experiences" variant="secondary">Browse experiences</ButtonLink>
      </div>
      {/* NIHO sends the traveler back to /booking/return after payment, adding the kind of booking. The preview shows each version. */}
      <h2 className="mt-10 font-sans text-sm font-extrabold tracking-[0.04em] text-muted uppercase">Preview the page after payment</h2>
      <ul className="mt-3 space-y-2 text-ink-soft">
        <li><Link href="/booking/return?type=instant" className="link-leaf">A booking confirmed by payment</Link></li>
        <li><Link href="/booking/return?type=approval" className="link-leaf">A request the host approves</Link></li>
        <li><Link href="/booking/return" className="link-leaf">Without the kind of booking</Link></li>
      </ul>
    </div>
  );
}
