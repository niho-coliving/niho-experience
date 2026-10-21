import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockExperienceFetch, type MockScenario } from "../src/mock/index.ts";
import type { FetchLike } from "../src/client.ts";

const privateSlug = "indigo-dyeing-with-an-artisan";
const ORIGIN = "https://niho.life";

async function verify(options: { version?: string; slug?: string | null; scenario?: MockScenario; patch?: Record<string, unknown> } = {}) {
  const previousArgv = process.argv, previousExitCode = process.exitCode;
  process.argv = ["node", "verify-live.ts", "--origin", ORIGIN, "--api-version", options.version ?? "1.1"];
  if (options.slug !== null) process.argv.push("--expect-private-meeting-slug", options.slug ?? privateSlug);
  process.exitCode = 0;
  const mock = createMockExperienceFetch({ scenario: options.scenario ?? "default", now: () => new Date("2026-10-19T01:00:00.000Z") });
  const fetchMock = vi.fn<FetchLike>(async (input, init) => {
    const response = await mock(input, init);
    if (!options.patch || String(input) !== `${ORIGIN}/api/public/experiences/v1.1/${privateSlug}`) return response;
    const body = await response.json() as { experience: Record<string, unknown> };
    Object.assign(body.experience, options.patch);
    return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  const exit = new Error("CLI exited");
  let exitCode: number | undefined;
  vi.spyOn(process, "exit").mockImplementation((code) => { exitCode = Number(code); throw exit; });
  try {
    vi.resetModules();
    await import("../scripts/verify-live.ts");
    return { code: Number(process.exitCode), fetchMock };
  } catch (error) {
    if (error !== exit) throw error;
    return { code: exitCode, fetchMock };
  } finally {
    process.argv = previousArgv;
    process.exitCode = previousExitCode;
  }
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("live verification activation gate", () => {
  it.each(["1.1", "1.2"])("requires an explicit private-meeting fixture for v%s before requesting the API", async (version) => {
    const result = await verify({ version, slug: null });
    expect(result.code).toBe(2);
    expect(result.fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an empty catalog even when the requested endpoints satisfy their schemas", async () => {
    expect((await verify({ scenario: "empty-catalog" })).code).toBe(1);
  });

  it.each([null, "", "   "])("rejects a private fixture without a meaningful overview (%j)", async (meetingOverview) => {
    expect((await verify({ patch: { meetingOverview } })).code).toBe(1);
  });

  it("rejects a public location as the private-meeting fixture", async () => {
    expect((await verify({ slug: "home-cooked-dinner-with-locals" })).code).toBe(1);
  });

  it("rejects unexpected private directions even with a valid public overview", async () => {
    expect((await verify({ patch: { entranceNote: "Synthetic private entrance" } })).code).toBe(1);
  });

  it("accepts a listed private fixture with public overview and no meeting point, using GET only", async () => {
    const result = await verify();
    expect(result.code).toBe(0);
    expect(result.fetchMock.mock.calls.every(([, init]) => (init?.method ?? "GET") === "GET")).toBe(true);
  });

  it("preserves the v1.0 read-only smoke check without new fixture requirements", async () => {
    expect((await verify({ version: "1.0", slug: null, scenario: "empty-catalog" })).code).toBe(0);
  });
});
