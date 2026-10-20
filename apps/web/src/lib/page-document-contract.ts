import { parsePageDocument, type BlockContracts, type PageDocument, type PageNode } from "@niho/web/core";

export const PAGE_IDS = ["home", "experiences", "experience-detail", "booking", "host", "chrome"] as const;
export type PageId = typeof PAGE_IDS[number];
// NIHO API #19171 の表示契約。実データ・価格・リンク・認証設定は props に持たせない。
export const DOCUMENT_BLOCKS = {
  ExperienceGrid: { props: { heading: { type: "string", maxLength: 120 }, emptyMessage: { type: "string", maxLength: 200 }, columns: { type: "enum", values: ["two", "three"] } } },
  ExperienceDetail: { props: { overviewHeading: { type: "string", maxLength: 120 }, detailsHeading: { type: "string", maxLength: 120 } } },
  BookingCTA: { props: { label: { type: "string", maxLength: 100 } } },
  BookingPanel: { props: {} },
  HostSignupCTA: { props: { label: { type: "string", maxLength: 100 } } },
  SiteHeader: { props: { brandLabel: { type: "string", maxLength: 80 }, exploreLabel: { type: "string", maxLength: 80 }, hostLabel: { type: "string", maxLength: 80 } } },
  SiteFooter: { props: { description: { type: "string", maxLength: 300 }, copyright: { type: "string", maxLength: 160 } } }
} satisfies BlockContracts;
export type DocumentBlock = keyof typeof DOCUMENT_BLOCKS;
const required: Record<PageId, readonly [string, DocumentBlock][]> = {
  home: [["experience-grid", "ExperienceGrid"]],
  experiences: [["experience-grid", "ExperienceGrid"]],
  "experience-detail": [["experience-detail", "ExperienceDetail"], ["booking-cta", "BookingCTA"]],
  booking: [["booking-panel", "BookingPanel"]],
  host: [["host-signup-cta", "HostSignupCTA"]],
  chrome: [["site-header", "SiteHeader"], ["site-footer", "SiteFooter"]]
};
export function documentComponents(nodes: PageNode[]): Extract<PageNode, { type: "component" }>[] {
  return nodes.flatMap((node) => node.type === "component" ? [node] : node.type === "element" ? documentComponents(node.children) : []);
}
export function validatePublishedDocument(input: unknown, pageId: PageId): PageDocument {
  const document = parsePageDocument(input, DOCUMENT_BLOCKS);
  if (document.siteId !== "experience" || document.pageId !== pageId || document.locale !== "en") throw new Error("Document identity mismatch");
  const components = documentComponents(document.body);
  for (const [id, block] of required[pageId]) {
    if (!components.some((node) => node.id === id && node.block === block)) throw new Error("Required document block missing");
  }
  if (pageId === "chrome" && (components.some((node) => node.block !== "SiteHeader" && node.block !== "SiteFooter") || components.findIndex((node) => node.id === "site-header") > components.findIndex((node) => node.id === "site-footer"))) throw new Error("Chrome context invalid");
  return document;
}

/** 本文はhostのmainへ残す。ネストした共通枠もfooterの位置で分割し、祖先の表示指定を両側へ維持する。 */
export function splitChromeDocument(document: PageDocument): { header: PageDocument; footer: PageDocument } {
  function split(nodes: PageNode[]): { before: PageNode[]; after: PageNode[]; found: boolean } {
    const before: PageNode[] = [];
    for (const [index, node] of nodes.entries()) {
      if (node.type === "component" && node.id === "site-footer") return { before, after: nodes.slice(index), found: true };
      if (node.type === "element") {
        const children = split(node.children);
        if (children.found) return {
          before: [...before, ...(children.before.length ? [{ ...node, children: children.before }] : [])],
          after: [{ ...node, children: children.after }, ...nodes.slice(index + 1)], found: true
        };
      }
      before.push(node);
    }
    return { before, after: [], found: false };
  }
  const parts = split(document.body);
  if (!parts.found) throw new Error("Chrome footer missing");
  // 描画用の別scope。部分文書どうしで同一scopeへ異なるCSSを出さない。
  return {
    header: { ...document, pageId: "chrome-header", body: parts.before },
    footer: { ...document, pageId: "chrome-footer", body: parts.after }
  };
}
