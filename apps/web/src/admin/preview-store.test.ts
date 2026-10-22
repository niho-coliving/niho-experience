import { describe, expect, it } from "vitest";
import { AdminPreviewStateStore } from "./preview-state";

const actor = { id: "admin-preview", name: "NIHO サポート 山本" };

describe("admin preview session store", () => {
  it("keeps mutations coherent across page reads", () => {
    const store = new AdminPreviewStateStore();
    const session = "preview-store-session-a";
    const expiresAt = Date.now() + 60_000;
    const result = store.run(session, expiresAt, "bk-garden-301", "operation-key-a", { action: "contact", reason: "候補者を共有" }, actor);
    expect(result.ok).toBe(true);
    const reread = store.bookings(session, expiresAt).find((booking) => booking.id === "bk-garden-301");
    expect(reread?.adminHistory.at(-1)).toMatchObject({ actorId: actor.id, detail: "連絡プレビュー · 候補者を共有" });
  });

  it("converges an exact retry and rejects key reuse for another payload", () => {
    const store = new AdminPreviewStateStore();
    const session = "preview-store-session-b";
    const expiresAt = Date.now() + 60_000;
    const operation = { action: "contact" as const, reason: "ホストへ連絡" };
    const first = store.run(session, expiresAt, "bk-garden-301", "operation-key-b", operation, actor);
    const repeat = store.run(session, expiresAt, "bk-garden-301", "operation-key-b", { ...operation, reason: "  ホストへ連絡  " }, actor);
    const mismatch = store.run(session, expiresAt, "bk-garden-301", "operation-key-b", { ...operation, reason: "別の連絡" }, actor);
    const otherBooking = store.run(session, expiresAt, "bk-2041", "operation-key-b", operation, actor);
    expect(first.ok).toBe(true);
    expect(repeat).toMatchObject({ ok: true, repeated: true });
    expect(mismatch).toMatchObject({ ok: false, status: 409 });
    expect(otherBooking).toMatchObject({ ok: false, status: 409 });
  });
});
