import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink, Notice } from "@/components/ui";
import { isPreview } from "@/lib/config";

export const metadata: Metadata = { title: "Mock payment", robots: { index: false, follow: false } };
/** Preview destination only. No traveler input is sent to this server page. */
export default function MockCheckoutPage() {
  if (!isPreview) notFound();
  return <div className="container-page max-w-xl py-12"><p className="eyebrow">Preview only</p><h1 className="mt-2 text-3xl">Mock payment page</h1><div className="mt-6"><Notice tone="warn" title="This is not a real payment">No card details are requested and nothing is charged. Your entered details stayed in the previous browser page.</Notice></div><div className="mt-6"><ButtonLink href="/experiences">Browse experiences</ButtonLink></div></div>;
}
