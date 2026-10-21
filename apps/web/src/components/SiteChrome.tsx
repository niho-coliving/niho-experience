import { EXPERIENCE_API_CONTRACT } from "@niho-experience/api-client";
import { SiteFooterV1, SiteHeaderV1 } from "@niho/experience-presentation/v1";
import { PRESENTATION_PRIMITIVES_V1 } from "./PresentationV1";
import { NavLink } from "./NavLink";

export type PreviewCatalog = "synthetic" | "pilot";

/**
 * Previews only: one small line at the very bottom of the footer (owner decision 2026-10-20).
 * Synthetic data is invented, pilot data is real but provisional. Nothing here is bookable for real.
 */
export function PreviewNote({ catalog }: { catalog: PreviewCatalog }) {
  return (
    <p role="note" className="border-t border-line py-3 text-xs leading-snug text-muted">
      {catalog === "pilot" ? (
        <>
          <strong className="font-extrabold text-ink-soft">Preview</strong> · real hosts; dates, prices and photos are provisional · nothing can be booked
        </>
      ) : (
        <>
          <strong className="font-extrabold text-ink-soft">Preview with sample data</strong> · hosts, dates and prices are invented · nothing can be booked
        </>
      )}{" "}
      <span className="whitespace-nowrap">
        · API contract {EXPERIENCE_API_CONTRACT.version} ({EXPERIENCE_API_CONTRACT.status})
      </span>
    </p>
  );
}

export function SiteHeader({ brandLabel, exploreLabel = "Experiences", hostLabel }: { brandLabel?: string; exploreLabel?: string; hostLabel?: string } = {}) {
  return <SiteHeaderV1 primitives={PRESENTATION_PRIMITIVES_V1} labels={{ brand: brandLabel, experiences: exploreLabel, host: hostLabel }} experiencesLink={<NavLink href="/experiences" className="rounded-full px-2.5 py-2 hover:bg-sand sm:px-3">{exploreLabel}</NavLink>} />;
}

export function SiteFooter({
  description = "Small experiences hosted by people who live in Kamakura. Made by NIHO, a shared living room two minutes from Kamakura Station.",
  copyright,
  preview = null,
}: { description?: string; copyright?: string; preview?: PreviewCatalog | null } = {}) {
  return <SiteFooterV1 primitives={PRESENTATION_PRIMITIVES_V1} description={description} copyright={copyright} previewNote={preview ? <PreviewNote catalog={preview} /> : undefined} />;
}
