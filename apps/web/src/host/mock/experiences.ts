import type { HostExperience } from "../types";

// Titles follow the pilot listings already in this public repo; status, prices and
// schedules here are invented for the console preview.

export const MOCK_KITCHEN_EXPERIENCES: readonly HostExperience[] = [
  {
    id: "community-dinner",
    title: "Kamakura Community Dinner with Locals",
    status: "live",
    cover: "/sample/photos/niho-cd-table-01.jpg",
    schedule: { weekdays: ["火", "木", "土"], start: "18:00", durationMinutes: 120, capacity: 8, priceFromYen: 30000 },
    missing: [],
  },
  {
    id: "kintsugi",
    title: "Mend a Broken Bowl with a Kamakura Restorer",
    status: "review",
    cover: null,
    schedule: { weekdays: ["土", "日"], start: "10:00", durationMinutes: 120, capacity: 4, priceFromYen: 8800 },
    missing: [],
    requestedOn: "2026-10-19",
  },
  {
    id: "coffee",
    title: "Roast Your Own Coffee in a Kamakura Living Room",
    status: "draft",
    cover: null,
    schedule: null,
    missing: ["表紙写真", "料金"],
  },
];

export const MOCK_STUDIO_EXPERIENCES: readonly HostExperience[] = [
  {
    id: "calligraphy",
    title: "Write Your Own Kanji with a Kamakura Calligrapher",
    status: "draft",
    cover: null,
    schedule: null,
    missing: ["日程", "料金"],
  },
];
