import type { PageDocument } from "@niho/web/core";
import type { PageId } from "../page-document-contract";

/** 合成文書のみ。NIHOや実際の公開原稿から取得しない。 */
export function publishedDocument(pageId: PageId): PageDocument {
  const blocks = {
    home: [["experience-grid", "ExperienceGrid"]], experiences: [["experience-grid", "ExperienceGrid"]],
    "experience-detail": [["experience-detail", "ExperienceDetail"], ["booking-cta", "BookingCTA"]],
    host: [["host-signup-cta", "HostSignupCTA"]], chrome: [["site-header", "SiteHeader"], ["site-footer", "SiteFooter"]]
  };
  return {
    schemaVersion: 1, siteId: "experience", pageId, locale: "en", revision: 2, title: `Edited ${pageId}`, tokens: { ink: { type: "color", value: "#123456" } },
    body: [
      { type: "element", id: "edited-copy", tag: "h1", style: { base: { color: { token: "ink" }, fontSize: "40px", position: "relative", top: "2px" }, responsive: [{ minWidth: 800, declarations: { fontSize: "48px", marginTop: "16px" } }] }, children: [{ type: "text", text: `Published ${pageId} text` }] },
      ...blocks[pageId].map(([id, block]) => ({ type: "component" as const, id: id!, block: block!, props: {} }))
    ]
  };
}
