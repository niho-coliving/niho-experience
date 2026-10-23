import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ enabled: vi.fn(), load: vi.fn(), failure: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/fee-summary-server", () => ({ isAdminFeeSummaryEnabled: mocks.enabled, loadAdminFeeSummaryClient: mocks.load, adminFeeSummaryFailureJson: mocks.failure }));
vi.mock("@/lib/admin/server", () => ({ adminJson: (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "private, no-store" } }) }));

import { GET } from "./route";

describe("Admin fee summary fixed GET BFF", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.enabled.mockReturnValue(true); mocks.load.mockResolvedValue({ ok: true, client: { read: vi.fn(async () => ({ ok: true, data: { feeSummary: { fixed: true } } })) } }); });
  it("returns private no-store after the server-only loader", async () => {
    const response = await GET(new Request("https://experience.example/admin/api/bookings/b1/fee-summary"), { params: Promise.resolve({ bookingId: "b1" }) });
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(mocks.load).toHaveBeenCalledOnce();
  });
  it("fails closed and rejects every query before session loading", async () => {
    mocks.enabled.mockReturnValue(false); let response = await GET(new Request("https://experience.example/admin/api/bookings/b1/fee-summary"), { params: Promise.resolve({ bookingId: "b1" }) }); expect(response.status).toBe(404); expect(mocks.load).not.toHaveBeenCalled();
    mocks.enabled.mockReturnValue(true); response = await GET(new Request("https://experience.example/admin/api/bookings/b1/fee-summary?expand=all"), { params: Promise.resolve({ bookingId: "b1" }) }); expect(response.status).toBe(400); expect(mocks.load).not.toHaveBeenCalled();
  });
});

