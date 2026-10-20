import { describe, expect, it, vi } from "vitest";
import { fetchPageDocument } from "./fetch-page-document";
import { PAGE_IDS, validatePublishedDocument } from "./page-document-contract";
import { publishedDocument } from "./testing/page-document-fixtures";

const origin = "https://niho.example";
describe("published page document boundary", () => {
  it("全6ページを公開routeから認証なし・no-storeで取得する", async () => {
    for (const pageId of PAGE_IDS) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(publishedDocument(pageId)));
      expect(await fetchPageDocument(pageId, { origin, fetch: fetcher })).toMatchObject({ pageId, locale: "en", revision: 2 });
      const [url, init] = fetcher.mock.calls[0]!;
      expect(String(url)).toBe(`${origin}/api/public/experiences/pages/${pageId}/en`);
      expect(init).toMatchObject({ method: "GET", cache: "no-store", credentials: "omit", redirect: "error", headers: { Accept: "application/json" } });
      expect(Object.keys(init!.headers!)).toEqual(["Accept"]);
    }
  });
  it("公開文書なしの404を静かにfallbackし、503は本文を記録せず観測する", async () => {
    const onFailure = vi.fn();
    for (const status of [404, 503]) expect(await fetchPageDocument("home", { origin, onFailure, fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response("private diagnostic", { status })) })).toBeNull();
    expect(onFailure.mock.calls).toEqual([[{ pageId: "home", reason: "http", status: 503 }]]);
  });
  it("identity・未知版・必須枠・危険HTML/URL/CSS・業務propsをfail closedにする", async () => {
    const valid = publishedDocument("home");
    const inputs: unknown[] = [
      { ...valid, siteId: "other" }, { ...valid, pageId: "host" }, { ...valid, locale: "ja" }, { ...valid, schemaVersion: 2 }, { ...valid, body: [] },
      { ...valid, body: [...valid.body, { type: "element", id: "script", tag: "script", children: [] }] },
      { ...valid, body: [...valid.body, { type: "element", id: "unsafe-link", tag: "a", attrs: { href: "javascript:alert(1)" }, children: [] }] },
      { ...valid, body: [...valid.body, { type: "element", id: "unsafe-style", tag: "p", style: { base: { color: "red;display:none" } }, children: [] }] },
      ...["Unknown", "BookingCTA", "ExperienceGrid"].map((block) => ({ ...valid, body: [...valid.body, { type: "component", id: "bad-props", block, props: { price: 1, inventory: 9, checkoutUrl: "https://evil.example" } }] }))
    ];
    for (const input of inputs) {
      const onFailure = vi.fn();
      expect(await fetchPageDocument("home", { origin, onFailure, fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json(input)) })).toBeNull();
      expect(onFailure).toHaveBeenCalledWith({ pageId: "home", reason: "invalid" });
    }
  });
  it("HTTP origin誤設定・通信断・期限切れを原稿や例外の内容なしで記録する", async () => {
    const onFailure = vi.fn(), fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("secret-cookie-and-draft"));
    expect(await fetchPageDocument("host", { origin, fetch: fetcher, onFailure })).toBeNull();
    expect(await fetchPageDocument("host", { origin: "https://user:password@niho.example/path", fetch: fetcher, onFailure })).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    const timeoutFetch = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener("abort", () => reject(new Error("timeout")), { once: true })));
    expect(await fetchPageDocument("host", { origin, timeoutMs: 5, fetch: timeoutFetch, onFailure })).toBeNull();
    expect(onFailure.mock.calls).toEqual(Array.from({ length: 3 }, () => [{ pageId: "host", reason: "network" }]));
  });
  it("不正JSON・media typeと、宣言/stream双方のサイズ超過を拒否する", async () => {
    const responses = [new Response("{", { headers: { "content-type": "application/json" } }), new Response("<html>", { headers: { "content-type": "text/html" } }),
      new Response("{}", { headers: { "content-type": "application/json", "content-length": "600000" } }), Response.json({ body: "x".repeat(600000) })];
    const onFailure = vi.fn();
    for (const response of responses) expect(await fetchPageDocument("home", { origin, onFailure, fetch: vi.fn<typeof fetch>().mockResolvedValue(response) })).toBeNull();
    expect(onFailure.mock.calls.map(([failure]) => failure.reason)).toEqual(["invalid", "invalid", "oversized", "oversized"]);
  });
  it("chromeの欠落・逆順・ページ文脈のないブロックを拒否する", () => {
    const chrome = publishedDocument("chrome");
    expect(() => validatePublishedDocument({ ...chrome, body: [...chrome.body].reverse() }, "chrome")).toThrow();
    expect(() => validatePublishedDocument({ ...chrome, body: chrome.body.slice(0, 2) }, "chrome")).toThrow();
    expect(() => validatePublishedDocument({ ...chrome, body: [...chrome.body, { type: "component", id: "grid", block: "ExperienceGrid", props: {} }] }, "chrome")).toThrow();
  });
  it("予約ページから必須の業務ブロックを消す・送信先を注入する文書を拒否する", () => {
    const booking = publishedDocument("booking");
    expect(() => validatePublishedDocument({ ...booking, body: booking.body.filter((node) => node.type !== "component") }, "booking")).toThrow();
    expect(() => validatePublishedDocument({ ...booking, body: booking.body.map((node) => node.type === "component" ? { ...node, props: { checkoutUrl: "https://evil.example" } } : node) }, "booking")).toThrow();
  });
});
