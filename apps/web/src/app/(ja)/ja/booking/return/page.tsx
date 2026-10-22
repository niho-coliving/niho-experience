import type { Metadata } from "next";
import { ButtonLink, Notice } from "@/components/ui";
import { JapaneseUnavailable } from "@/components/JapaneseUnavailable";
import { getJapaneseCopy } from "@/lib/localized-content";

export const metadata: Metadata = { title: "予約状況", robots: { index: false, follow: false } };

export default async function JapaneseBookingReturnPage() {
  let copy;
  try {
    copy = (await getJapaneseCopy()).copy;
  } catch { return <JapaneseUnavailable />; }
  return <div className="container-page max-w-2xl py-12"><h1 className="text-3xl">{copy.text("return.title")}</h1><div className="mt-5"><Notice tone="info" title={copy.text("return.heading")}>{copy.text("return.body")}</Notice></div><div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/help">{copy.text("return.help")}</ButtonLink><ButtonLink href="/experiences" variant="secondary">{copy.text("return.browse")}</ButtonLink></div></div>;
}
