import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PageDocument } from "@niho/web/core";
import { createExperienceApiClient } from "@niho-experience/api-client";
import { buildFixtureExperiences, createMockExperienceFetch } from "@niho-experience/api-client/mock";
import type { PageId } from "./page-document-contract";
import { splitChromeDocument, validatePublishedDocument } from "./page-document-contract";
import { publishedDocument } from "./testing/page-document-fixtures";
import { PageDocumentContent } from "@/components/PageDocument";
import { DocumentChrome } from "@/components/DocumentChrome";

const state = vi.hoisted(() => ({ documents: {} as Partial<Record<PageId, PageDocument>>, config: {
  publicApiVersion: "1.2", siteUrl: "https://experience.example.com", bookingsEnabled: true,
  hostSignupMode: "open", nihoWebOrigin: "https://niho.example", nihoHostStartUrl: "https://niho.example/experiences/provider", hostPilotContactUrl: ""
} }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./config", () => ({ config: state.config, isPreview: false, isPilotPreview: false }));
vi.mock("./page-documents", () => ({ getPublishedPageDocument: async (pageId: PageId) => state.documents[pageId] ?? null }));
vi.mock("./api", () => ({
  getApi: async () => createExperienceApiClient({ nihoWebOrigin: "https://niho.example", fetch: createMockExperienceFetch() }),
  listExperiencesForSite: async () => createExperienceApiClient({ nihoWebOrigin: "https://niho.example", fetch: createMockExperienceFetch() }).listExperiences(),
  getExperienceForSite: async () => ({ ok: true, data: { experience: buildFixtureExperiences({ imageBaseUrl: "https://images.example.com" })[0] } })
}));
vi.mock("@/components/Analytics", () => ({ TrackView: () => null, TrackedLink: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children) }));
// Router hooks are exercised by the existing browser search suite.
vi.mock("@/components/ExperienceFiltersForm", () => ({ ExperienceFiltersForm: () => createElement("form", { action: "/experiences", role: "search" }) }));

import Home, { generateMetadata as homeMetadata } from "@/app/page";
import ExperiencesPage from "@/app/experiences/(list)/page";
import ExperiencePage, { generateMetadata as detailMetadata } from "@/app/experiences/[slug]/page";
import HostPage from "@/app/host/page";
import BookPage, { metadata as bookingMetadata } from "@/app/experiences/[slug]/book/page";

beforeEach(() => { state.documents = {}; state.config.bookingsEnabled = true; state.config.hostSignupMode = "open"; state.config.nihoHostStartUrl = "https://niho.example/experiences/provider"; });
describe("published documents use the existing server-rendered business components", () => {
  it("home/listの編集本文・responsive CSS・実カタログの価格とリンクが初期HTMLに入る", async () => {
    for (const pageId of ["home", "experiences"] as const) {
      state.documents[pageId] = publishedDocument(pageId);
      const html = renderToStaticMarkup(await (pageId === "home" ? Home : ExperiencesPage)({ searchParams: Promise.resolve({}) }));
      expect(html).toContain(`Published ${pageId} text`); expect(html).toContain("font-size:40px"); expect(html).toContain("@media (min-width:800px)"); expect(html).toContain("position:relative");
      expect(html).toContain("¥6,500"); expect(html).toContain('href="/experiences/home-cooked-dinner-with-locals"');
      expect(html).not.toContain("Meet the people who make Kamakura home");
      if (pageId === "experiences") expect(html).toContain('role="search"');
    }
    state.documents.home = publishedDocument("home"); expect(await homeMetadata()).toEqual({ title: "Edited home" });
  });
  it("詳細の公開テンプレートでも価格・seller・JSON-LD・予約先はカタログに固定する", async () => {
    const document = publishedDocument("experience-detail");
    document.body = document.body.map((node) => node.type === "component" && node.block === "BookingCTA" ? { ...node, props: { label: "Choose your date" } } : node);
    state.documents["experience-detail"] = document;
    const props = { params: Promise.resolve({ slug: "home-cooked-dinner-with-locals" }), searchParams: Promise.resolve({}) };
    const html = renderToStaticMarkup(await ExperiencePage(props));
    for (const text of ["Published experience-detail text", "¥6,500", "Sold by", "Choose your date", "BreadcrumbList", "TouristTrip", 'href="/experiences/home-cooked-dinner-with-locals/book"']) expect(html).toContain(text);
    expect((await detailMetadata(props)).title).toBe("Home-cooked dinner with locals in a shared living room");
    state.config.bookingsEnabled = false;
    const paused = renderToStaticMarkup(await ExperiencePage(props));
    expect(paused).toContain("Bookings are paused"); expect(paused).not.toContain("Choose your date"); expect(paused).not.toContain('href="/experiences/home-cooked-dinner-with-locals/book"');
  });
  it("hostのラベルを編集しても登録先・開放条件はhost設定に固定する", async () => {
    const document = publishedDocument("host"); document.body = document.body.map((node) => node.type === "component" ? { ...node, props: { label: "Join NIHO" } } : node); state.documents.host = document;
    const html = renderToStaticMarkup(await HostPage()); expect(html).toContain("Published host text"); expect(html).toContain("Join NIHO"); expect(html).toContain('href="https://niho.example/experiences/provider"');
    for (const unsafeUrl of [
      "https://evil.example/experiences/provider",
      "http://niho.example/experiences/provider",
      "https://niho.example@evil.example/experiences/provider",
      "https://niho.example.evil.example/experiences/provider",
      "https://niho.example/experiences/provider?returnTo=https://evil.example",
      "https://niho.example/experiences/provider#returnTo=https://evil.example",
      "https://niho.example/experiences/provider/",
      "https://niho.example/experiences/host/start",
      "javascript:alert(1)",
      "not a URL",
    ]) {
      state.config.nihoHostStartUrl = unsafeUrl;
      const paused = renderToStaticMarkup(await HostPage());
      expect(paused).toContain("small group of hosts");
      expect(paused).not.toContain(unsafeUrl);
      expect(paused).not.toContain("Start with your NIHO account");
      expect(paused).not.toContain("Join NIHO");
    }
  });
  it("予約ページの編集本文をSSRしつつ、予約可否と送信処理は既存の業務コンポーネントに固定する", async () => {
    const props = { params: Promise.resolve({ slug: "home-cooked-dinner-with-locals" }), searchParams: Promise.resolve({}) };
    state.documents.booking = publishedDocument("booking");
    const published = renderToStaticMarkup(await BookPage(props));
    expect(published).toContain("Published booking text");
    expect(published).toContain("Choose a date");
    expect(published).toContain("font-size:40px");
    expect(bookingMetadata.robots).toEqual({ index: false, follow: false });
    state.config.bookingsEnabled = false;
    const paused = renderToStaticMarkup(await BookPage(props));
    expect(paused).toContain("Published booking text");
    expect(paused).toContain("Online booking is paused for now");
    expect(paused).not.toContain("Continue to checkout");
    state.documents.booking = undefined;
    // Without a document the experience title is the page's only h1 (the published heading replaces it otherwise).
    for (const html of [published, paused]) expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(renderToStaticMarkup(await BookPage(props))).toMatch(/<h1[^>]*>Home-cooked dinner with locals in a shared living room<\/h1>/);
  });
  it("文書なしの全ページは現行の本文と導線を維持する", async () => {
    expect(renderToStaticMarkup(await Home({ searchParams: Promise.resolve({}) }))).toContain("Meet the people who make Kamakura");
    expect(renderToStaticMarkup(await ExperiencesPage({ searchParams: Promise.resolve({}) }))).toContain("Experiences in Kamakura");
    expect(renderToStaticMarkup(await ExperiencePage({ params: Promise.resolve({ slug: "example" }), searchParams: Promise.resolve({}) }))).toContain("Check dates and book");
    expect(renderToStaticMarkup(await HostPage())).toContain("Share what you love with travelers");
  });
  it("chromeをネストしてもmainを一度だけ挟み、枠のラベルをSSRする", () => {
    const source = publishedDocument("chrome"); source.body = [{ type: "element", id: "chrome-wrap", tag: "div", style: { base: { padding: "4px" } }, children: source.body.map((node) => node.type === "component" && node.block === "SiteHeader" ? { ...node, props: { brandLabel: "Edited brand", hostLabel: "Become a host" } } : node) }];
    const document = validatePublishedDocument(source, "chrome"), parts = splitChromeDocument(document);
    expect(parts.header.pageId).not.toBe(parts.footer.pageId);
    const html = renderToStaticMarkup(createElement(DocumentChrome, { document }, createElement("p", null, "Protected booking page")));
    expect(html).toContain("Edited brand"); expect(html).toContain("Become a host"); expect(html.match(/<main /g)).toHaveLength(1);
    expect(html.indexOf("</header>")).toBeLessThan(html.indexOf("Protected booking page")); expect(html.indexOf("Protected booking page")).toBeLessThan(html.indexOf("<footer"));
    expect(html).toContain('href="/experiences"');
  });
  it("文脈に接続できないブロックは部分描画せず既存表示と定型ログへ戻す", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const html = renderToStaticMarkup(createElement(PageDocumentContent, { document: publishedDocument("home"), pageId: "home", slots: {}, fallback: createElement("p", null, "Safe fallback") }));
      expect(html).toBe("<p>Safe fallback</p>"); expect(warn).toHaveBeenCalledWith("[niho-web] published document fallback", { pageId: "home", reason: "context" });
    } finally { warn.mockRestore(); }
  });
});
