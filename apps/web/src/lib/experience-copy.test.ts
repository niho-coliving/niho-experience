import { describe, expect, it } from "vitest";
import { hostBio, imageAlt } from "./experience-copy";

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
