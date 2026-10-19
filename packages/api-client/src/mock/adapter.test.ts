import { describe, expect, it } from "vitest";
import { withContractValidation } from "../client";
import { ExperienceDetailSchema } from "../contract";
import { fromJst } from "../time";
import { createMockExperienceApi } from "./adapter";
import { FIXTURES } from "./fixtures";

// Monday 2026-10-19 09:00 JST
const NOW = fromJst(2026, 10, 19, 9, 0);
const api = () => withContractValidation(createMockExperienceApi({ now: () => NOW }));

describe("fixtures", () => {
  it("are 3-5 synthetic experiences with placeholder images", () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(FIXTURES.length).toBeLessThanOrEqual(5);
    for (const { detail } of FIXTURES) {
      expect(detail.synthetic).toBe(true);
      expect(detail.seller.displayName).toMatch(/synthetic/i);
      for (const img of [detail.heroImage, ...detail.gallery]) expect(img.placeholder).toBe(true);
    }
  });

  it("do not contain contact details or exact addresses", () => {
    const text = JSON.stringify(FIXTURES);
    expect(text).not.toMatch(/@(?!example\.com)[a-z0-9-]+\.[a-z]/i);
    expect(text).not.toMatch(/\+81|0\d{1,4}-\d{1,4}-\d{3,4}/);
    expect(text).not.toMatch(/\d+-\d+-\d+\s*(chome|丁目)/i);
  });
});

describe("mock catalog", () => {
  it("validates every experience against the contract", async () => {
    const client = api();
    const catalog = await client.getCatalog({});
    expect(catalog.items).toHaveLength(FIXTURES.length);
    for (const item of catalog.items) {
      const detail = await client.getExperience(item.slug);
      expect(ExperienceDetailSchema.safeParse(detail).success).toBe(true);
    }
  });

  it("lists bookable first and paused last", async () => {
    const { items } = await api().getCatalog({});
    const statuses = items.map((i) => i.availability.status);
    expect(statuses[0]).toBe("bookable");
    expect(statuses.at(-1)).toBe("paused");
    expect(statuses).toContain("sold_out");
  });

  it("only returns themes that have experiences", async () => {
    const { themes, items } = await api().getCatalog({});
    for (const t of themes) expect(items.some((i) => i.themes.some((x) => x.slug === t.slug))).toBe(true);
  });

  it("filters by theme and JST date", async () => {
    const client = api();
    const craft = await client.getCatalog({ theme: "craft" });
    expect(craft.items.every((i) => i.themes.some((t) => t.slug === "craft"))).toBe(true);
    // Friday 2026-10-23: the dinner's first slot is open
    const fri = await client.getCatalog({ date: "2026-10-23" });
    expect(fri.items.map((i) => i.slug)).toEqual(["neighborhood-dinner-table"]);
    // Saturday 2026-10-24: the dinner slot and the market are sold out, so nothing is bookable
    const sat = await client.getCatalog({ date: "2026-10-24" });
    expect(sat.items).toEqual([]);
  });

  it("supports empty and error preview scenarios", async () => {
    expect((await createMockExperienceApi({ scenario: "empty", now: () => NOW }).getCatalog({})).items).toEqual([]);
    await expect(createMockExperienceApi({ scenario: "error" }).getCatalog({})).rejects.toThrow(/unavailable/i);
  });
});

describe("mock slots", () => {
  it("are in JST, closed inside the cutoff and capped per slot", async () => {
    const { slots, timezone } = await api().getSlots("exp_sample_dinner");
    expect(timezone).toBe("Asia/Tokyo");
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.startsAt.endsWith("+09:00"))).toBe(true);
    expect(slots[0]!.startsAt).toBe("2026-10-23T18:00:00+09:00");
    expect(slots[1]!.status).toBe("sold_out");
    expect(slots.filter((s) => s.status === "open").every((s) => s.maxGuests >= 1 && s.maxGuests <= 10)).toBe(true);
  });

  it("closes every slot of a paused experience", async () => {
    const { slots } = await api().getSlots("exp_sample_indigo");
    expect(slots.every((s) => s.status === "closed")).toBe(true);
  });
});

describe("mock quote and checkout", () => {
  const contact = { fullName: "Sample Guest", email: "guest@example.com" };

  async function openSlot(experienceId: string) {
    const { slots } = await api().getSlots(experienceId);
    return slots.find((s) => s.status === "open")!;
  }

  it("prices per person on the server side", async () => {
    const slot = await openSlot("exp_sample_dinner");
    const result = await api().createQuote({ experienceId: "exp_sample_dinner", slotId: slot.id, guests: 2 });
    expect(result.ok && result.quote.total.amount).toBe(13600);
  });

  it("prices per group regardless of guests", async () => {
    const slot = await openSlot("exp_sample_walk");
    const result = await api().createQuote({ experienceId: "exp_sample_walk", slotId: slot.id, guests: 3 });
    expect(result.ok && result.quote.total.amount).toBe(14000);
  });

  it("rejects sold-out, paused and out-of-range requests", async () => {
    const client = api();
    const { slots } = await client.getSlots("exp_sample_market");
    const sold = await client.createQuote({ experienceId: "exp_sample_market", slotId: slots.at(-1)!.id, guests: 2 });
    expect(!sold.ok && sold.error.code).toBe("SLOT_SOLD_OUT");
    const paused = await client.createQuote({ experienceId: "exp_sample_indigo", slotId: "x", guests: 1 });
    expect(!paused.ok && paused.error.code).toBe("EXPERIENCE_PAUSED");
    const slot = await openSlot("exp_sample_dinner");
    const tooMany = await client.createQuote({ experienceId: "exp_sample_dinner", slotId: slot.id, guests: 11 });
    expect(!tooMany.ok && tooMany.error.code).toBe("GUESTS_OUT_OF_RANGE");
  });

  it("returns a mock payment link that carries no contact details", async () => {
    const client = api();
    const slot = await openSlot("exp_sample_dinner");
    const quote = await client.createQuote({ experienceId: "exp_sample_dinner", slotId: slot.id, guests: 2 });
    if (!quote.ok) throw new Error("quote failed");
    const result = await client.startGuestCheckout({
      quoteId: quote.quote.id,
      contact,
      acceptedPolicyVersion: quote.quote.cancellation.version,
      idempotencyKey: crypto.randomUUID(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checkout.redirectUrl.startsWith("/preview/checkout?")).toBe(true);
      expect(result.checkout.redirectUrl).not.toContain("guest");
      expect(result.checkout.redirectUrl).not.toContain("example.com");
    }
  });

  it("expires quotes and honours failure triggers", async () => {
    const slot = await openSlot("exp_sample_dinner");
    const quote = await api().createQuote({ experienceId: "exp_sample_dinner", slotId: slot.id, guests: 2 });
    if (!quote.ok) throw new Error("quote failed");
    const later = withContractValidation(createMockExperienceApi({ now: () => new Date(NOW.getTime() + 16 * 60_000) }));
    const base = { quoteId: quote.quote.id, acceptedPolicyVersion: quote.quote.cancellation.version, idempotencyKey: crypto.randomUUID() };
    const expired = await later.startGuestCheckout({ ...base, contact });
    expect(!expired.ok && expired.error.code).toBe("QUOTE_EXPIRED");
    const soldOut = await api().startGuestCheckout({ ...base, contact: { ...contact, email: "sold-out@example.com" } });
    expect(!soldOut.ok && soldOut.error.code).toBe("SLOT_SOLD_OUT");
    const down = await api().startGuestCheckout({ ...base, contact: { ...contact, email: "unavailable@example.com" } });
    expect(!down.ok && down.error.retryable).toBe(true);
  });
});
