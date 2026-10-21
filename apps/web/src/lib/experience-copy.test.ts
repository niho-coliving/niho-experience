import { describe, expect, it } from "vitest";
import { buildFixtureExperiences } from "@niho-experience/api-client/mock";
import { childParticipationCopy, hostBio, imageAlt } from "./experience-copy";

describe("v1.1 public copy", () => {
  it("uses photo alt from the API and falls back when it is empty or absent", () => {
    expect(imageAlt({ alt: "  Indigo cloth drying in the sun  " }, "Experience title")).toBe("Indigo cloth drying in the sun");
    expect(imageAlt({ alt: null }, "Experience title")).toBe("Experience title");
    expect(imageAlt({ url: "https://images.example/photo.webp" }, "Experience title")).toBe("Experience title");
  });

  it("shows only a non-empty provider bio", () => {
    expect(hostBio({ bio: "  A local ceramic restorer.  " })).toBe("A local ceramic restorer.");
    expect(hostBio({ bio: "  " })).toBeNull();
    expect(hostBio({})).toBeNull();
  });
});

describe("child participation summary", () => {
  const offers = buildFixtureExperiences()[0]!.offers;
  it("keeps the upper age limit and adult requirement", () => {
    expect(childParticipationCopy(offers)).toEqual({ fact: "ages 6–12 with an adult", price: "Children 6–12 ¥3,000" });
  });
  it("does not advertise children on an adults-only option", () => {
    expect(childParticipationCopy([...offers, { ...offers[0]!, pricing: { ...offers[0]!.pricing, child: null } }])).toEqual({ fact: "Children: see options", price: "Child terms vary by option" });
  });
  it.each([{ minAge: 7 }, { maxAge: 15 }, { adultRequired: false }])("does not combine different rules: %j", (rule) => {
    const changed = { ...offers[0]!, pricing: { ...offers[0]!.pricing, child: { ...offers[0]!.pricing.child!, ...rule } } };
    expect(childParticipationCopy([...offers, changed]).fact).toBe("Children: see options");
  });
  it("shows a from price only for otherwise identical rules", () => {
    const changed = { ...offers[0]!, pricing: { ...offers[0]!.pricing, child: { ...offers[0]!.pricing.child!, priceYen: 4500 } } };
    expect(childParticipationCopy([...offers, changed]).price).toBe("Children 6–12 from ¥3,000");
    expect(childParticipationCopy([])).toEqual({ fact: null, price: null });
  });
});
