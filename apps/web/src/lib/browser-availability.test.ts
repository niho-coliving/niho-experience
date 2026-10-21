import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it("shares concurrent reads and immediately retries a failed read", async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("offline")).mockResolvedValue(new Response(JSON.stringify({
    generatedAt: new Date().toISOString(), timeZone: "Asia/Tokyo", windowDays: 90, occurrences: [],
  }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const { readAvailability } = await import("./browser-availability");
  const first = readAvailability("test-experience", false, "https://niho.life");
  expect(readAvailability("test-experience", false, "https://niho.life")).toBe(first);
  expect(await first).toEqual({ ok: false });
  expect(await readAvailability("test-experience", false, "https://niho.life")).toEqual({ ok: true, occurrences: [] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
