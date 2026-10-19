import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceGridSkeleton } from "@/components/ExperienceCard";
import { EmptyResults } from "@/components/States";
import { SectionHeading } from "@/components/ui";
import { isPreview } from "@/lib/config";

export const metadata: Metadata = { title: "Design states (preview)", robots: { index: false, follow: false } };
export default function StatesPage() {
  if (!isPreview) notFound();
  return <div className="container-page space-y-12 pt-8"><header><p className="eyebrow">Preview tools</p><h1 className="text-4xl">Designed states</h1><p className="text-ink-soft">Synthetic scenarios for reviewing the site.</p></header><section><SectionHeading title="Try a scenario" /><ul className="list-disc space-y-2 pl-5"><li><Link className="font-bold text-moss underline" href="/experiences?mock=slow">Slow catalog</Link></li><li><Link className="font-bold text-moss underline" href="/experiences?mock=empty">Empty catalog</Link></li><li><Link className="font-bold text-moss underline" href="/experiences?mock=error">Catalog unavailable</Link></li></ul></section><section><SectionHeading title="Empty list" /><EmptyResults clearHref={null} /></section><section><SectionHeading title="Loading" /><ExperienceGridSkeleton /></section></div>;
}
