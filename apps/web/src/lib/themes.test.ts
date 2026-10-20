import { describe, expect, it } from "vitest";
import { buildFixtureExperiences, buildPilotExperiences } from "@niho-experience/api-client/mock";
import { CALLIGRAPHY_VIDEO, GUIDE_FACE } from "./site-media";
import { editorialOf, FEATURED_HOST, FEATURED_STORY, iconForText, shortName, shortTitle, themeEntries, themeOf, topicsLine } from "./themes";

describe("home themes", () => {
  it("maps each pilot experience to its theme, icon and short label", () => {
    expect(themeEntries(buildPilotExperiences())).toEqual([
      { key: "cook", icon: "bowl", label: "Cook & eat", slug: "kamakura-community-dinner" },
      { key: "roast", icon: "bean", label: "Roast coffee", slug: "kamakura-coffee-roasting" },
      { key: "sit", icon: "enso", label: "Sit zazen", slug: "engakuji-zen-meditation" },
      { key: "mend", icon: "mend", label: "Mend a bowl", slug: "kamakura-ceramic-mending" },
      { key: "write", icon: "brush", label: "Write kanji", slug: "kamakura-calligraphy" },
    ]);
  });

  it("only lists slugs in the editorial table and skips the rest", () => {
    const entries = themeEntries(buildFixtureExperiences());
    expect(entries).toEqual([
      { key: "cook", icon: "bowl", label: "Cook & eat", slug: "home-cooked-dinner-with-locals" },
      { key: "mend", icon: "mend", label: "Make pottery", slug: "evening-pottery-session" },
    ]);
  });

  it("never infers a theme from the title (#36)", () => {
    expect(themeOf({ slug: "kanji-practice" })).toBeNull();
    expect(themeEntries([{ slug: "pasta-dinner", title: "Cook a pasta dinner" }])).toEqual([]);
  });

  it("links a theme once, to the first listed experience that has it", () => {
    const entries = themeEntries([
      { slug: "kamakura-community-dinner", title: "Dinner" },
      { slug: "home-cooked-dinner-with-locals", title: "Another dinner" },
    ]);
    expect(entries).toEqual([{ key: "cook", icon: "bowl", label: "Cook & eat", slug: "kamakura-community-dinner" }]);
  });

  it("keeps editorial words for the pilot slugs only (names, the card's with-line, a face, a video)", () => {
    const pilot = buildPilotExperiences();
    expect(pilot.map(shortName)).toEqual(["Community dinner", "Coffee roasting", "Zazen at Engakuji", "Ceramic mending", "Calligraphy"]);
    expect(editorialOf({ slug: "kamakura-community-dinner" })?.withLabel).toBe("Takuya & neighbors");
    expect(editorialOf({ slug: "engakuji-zen-meditation" })).toMatchObject({ withLabel: "a Zen priest & guide", face: GUIDE_FACE });
    expect(editorialOf({ slug: "kamakura-calligraphy" })?.video).toBe(CALLIGRAPHY_VIDEO);
    expect([FEATURED_STORY.slug, FEATURED_HOST.slug].every((slug) => pilot.some((experience) => experience.slug === slug))).toBe(true);
    // Synthetic slugs keep their theme and nothing else; their names come from the title.
    for (const experience of buildFixtureExperiences()) {
      const entry = editorialOf(experience);
      if (entry) expect(Object.keys(entry)).toEqual(["theme"]);
      expect(shortName(experience)).toBe(shortTitle(experience.title));
    }
  });

  it("lists the topics only when every listed experience has a theme", () => {
    expect(topicsLine(buildPilotExperiences())).toBe("Food, coffee, Zen, mending and calligraphy.");
    expect(topicsLine([{ slug: "kamakura-calligraphy" }])).toBe("Calligraphy.");
    expect(topicsLine(buildFixtureExperiences())).toBeNull();
    expect(topicsLine([])).toBeNull();
  });

  it("shortens titles at the first connecting word", () => {
    expect(shortTitle("Kamakura Community Dinner with Locals")).toBe("Kamakura Community Dinner");
    expect(shortTitle("Roast Your Own Coffee in a Kamakura Living Room")).toBe("Roast Your Own Coffee");
    expect(shortTitle("Zen Meditation and a Temple Walk at Engakuji")).toBe("Zen Meditation");
    expect(shortTitle("Evening pottery session")).toBe("Evening pottery session");
    expect(shortTitle("An extraordinarily long experience title without any break", 24)).toBe("An extraordinarily long…");
  });

  it("picks hand-drawn icons from highlight words, with a generic fallback", () => {
    expect(iconForText("Eat together at one long table and hear about everyday life in Kamakura")).toBe("table");
    expect(iconForText("Cook four or five seasonal home-style dishes side by side with residents")).toBe("bowl");
    expect(iconForText("Start with a welcome drink and easy introductions")).toBe("chat");
    expect(iconForText("A small group of up to 8 guests")).toBe("people");
    expect(iconForText("Something else entirely")).toBe("check");
    expect(iconForText("Something else entirely", "clock")).toBe("clock");
  });
});
