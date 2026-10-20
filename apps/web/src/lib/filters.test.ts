import { describe, expect, it } from "vitest";
import { buildFixtureExperiences, toExperienceSummary } from "@niho-experience/api-client/mock";
import { filterExperienceSummaries, normalizeExperienceQuery } from "./filters";

const summaries = buildFixtureExperiences({ imageBaseUrl: "https://images.example.com" }).map(toExperienceSummary);

describe("public experience search", () => {
  it("normalizes a single query and ignores repeated query parameters", () => {
    expect(normalizeExperienceQuery("  Evening   pottery  ")).toBe("Evening pottery");
    expect(normalizeExperienceQuery(["pottery", "dinner"])).toBe("");
    expect(normalizeExperienceQuery(undefined)).toBe("");
  });

  it("matches all words across public title, lead, provider, and region fields without case sensitivity", () => {
    expect(filterExperienceSummaries(summaries, "EVENING pottery").map((item) => item.slug)).toEqual(["evening-pottery-session"]);
    expect(filterExperienceSummaries(summaries, "komorebi dinner").map((item) => item.slug)).toEqual(["home-cooked-dinner-with-locals"]);
  });

  it("returns the full catalog for an empty query and no results for an unmatched query", () => {
    expect(filterExperienceSummaries(summaries, "")).toBe(summaries);
    expect(filterExperienceSummaries(summaries, "no-such-experience")).toEqual([]);
  });
});
