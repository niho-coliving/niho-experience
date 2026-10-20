import { describe, expect, it } from "vitest";
import { buildFixtureExperiences, buildPilotExperiences } from "@niho-experience/api-client/mock";
import { iconForText, shortTitle, themeEntries, themeOf } from "./themes";

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
