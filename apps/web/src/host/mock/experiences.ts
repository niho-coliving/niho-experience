import { listingSummary } from "../editor";
import type { HostExperience, HostExperiencePhoto } from "../types";

// Titles and slugs follow the pilot listings already in this public repo; the page text
// follows the provider workspace mock v2, and the photos are the site's sample photos
// (public/sample/CREDITS.md). Status, prices, schedules and dates are invented for the
// console preview, and the people in the text are left unnamed.

type MockPage = Omit<HostExperience, "cover" | "schedule" | "missing">;

/** The list fields come from the page itself, so the list and the editor never disagree. */
function experience(page: MockPage): HostExperience {
  return { ...page, ...listingSummary(page) };
}

function photo(id: string, file: string, alt: string): HostExperiencePhoto {
  return { id, url: `/sample/photos/${file}`, alt };
}

const NO_MEETING = { area: "", entrance: "", exteriorPhotoUrl: null };

export const MOCK_KITCHEN_EXPERIENCES: readonly HostExperience[] = [
  experience({
    id: "community-dinner",
    slug: "kamakura-community-dinner",
    title: "Kamakura Community Dinner with Locals",
    status: "live",
    liveSince: "2026-10-12",
    language: "en",
    lead: "Spend an evening the way locals do. Cook a seasonal, home-style Japanese dinner together in a shared kitchen two minutes from Kamakura Station, then sit down at one long table to eat, talk and laugh with the people who live here.",
    dayLanguage: "English and Japanese",
    highlights: [
      "Cook four or five seasonal Japanese dishes with Kamakura locals.",
      "Share a welcome drink, cooking tips, and stories of everyday life.",
      "Enjoy the meal together at a relaxed community table.",
      "Join a small group of up to eight people near Kamakura Station.",
    ],
    description:
      "Our shared living room is run by people who live in Kamakura. Three evenings a week we open the kitchen to travelers: you cook with us, eat with us and leave knowing a few people in town. The menu follows the season and the market that morning; the conversation follows the table.",
    included: ["Welcome drink", "All ingredients and dinner", "Tea, coffee and local craft beer"],
    notIncluded: ["Transport to the venue", "Extra alcoholic drinks"],
    notSuitableFor: ["Wheelchair users (the venue is on the second floor)", "Guests with food allergies"],
    timeline: [
      { time: "18:00", title: "Welcome drink & hellos", text: "Meet your hosts and tonight’s neighbors over a local craft beer, tea or juice." },
      { time: "18:20", title: "Cook together", text: "Four or five seasonal dishes, split across the table. Nobody needs to know how to cook." },
      { time: "19:15", title: "Sit down and eat", text: "One long table, everything you just made, and stories of everyday life in Kamakura." },
      { time: "20:00", title: "Goodnight — or one more cup of tea", text: "Someone usually picks up the guitar. The station is two minutes away whenever you’re ready." },
    ],
    meeting: {
      area: "Near Kamakura Station, 2-minute walk",
      entrance: "Use the side entrance on the right of the building and take the stairs to the second floor. Look for the small sign by the door.",
      exteriorPhotoUrl: "/sample/photos/niho-exterior.jpg",
    },
    knowBeforeYouGo: [
      "The menu changes with seasonal ingredient availability.",
      "Community members vary by date; specific people cannot be guaranteed.",
      "English fluency varies among community members.",
    ],
    photos: [
      photo("cd-1", "niho-cd-table-01.jpg", "Dinner laid out on the long table"),
      photo("cd-2", "niho-cd-kitchen-together.jpg", "Cooking together in the shared kitchen"),
      photo("cd-3", "niho-cd-food-trays.jpg", "Trays of dishes made together"),
      photo("cd-4", "niho-dinner-1.jpg", "Welcome drinks in the living room"),
      photo("cd-5", "niho-cd-hands-salad.jpg", "Hands dressing a salad"),
      photo("cd-6", "niho-dinner-5.jpg", "Talking in the living room"),
      photo("cd-7", "niho-cd-strawberry-daifuku.jpg", "Strawberry daifuku for dessert"),
      photo("cd-8", "niho-cd-table-02.jpg", "Neighbors around the long table"),
    ],
    offers: [
      {
        id: "offer-dinner",
        name: "Dinner",
        adultPriceYen: 30000,
        childPriceYen: 12000,
        capacity: 8,
        startTime: "18:00",
        durationMinutes: 120,
        weekdays: [2, 4, 6],
        closedDates: ["2026-12-31", "2027-01-01"],
        questions: ["Any dietary preferences we should know about?"],
      },
      { id: "offer-tea", name: "tea time", adultPriceYen: 15000, childPriceYen: null, capacity: 8, startTime: "13:00", durationMinutes: 120, weekdays: [0], closedDates: [], questions: [] },
    ],
  }),
  experience({
    id: "kintsugi",
    slug: "kamakura-ceramic-mending",
    title: "Mend a Broken Bowl with a Kamakura Restorer",
    status: "review",
    requestedOn: "2026-10-19",
    language: "en",
    lead: "Learn the basics of kintsugi with a restorer who has mended Kamakura’s bowls for twenty years. Bring a chipped piece from home or pick one from the studio shelf.",
    dayLanguage: "Japanese, with basic English",
    highlights: ["Mend a real chipped bowl with lacquer and gold powder.", "Two hours in a working studio, four guests at most."],
    description:
      "The studio sits on a quiet street behind Komachi-dori. You will clean the chip, build it up with lacquer and finish it with gold. The lacquer cures for a week, then we ship the bowl to you.",
    included: ["A bowl to mend", "All materials", "Tea"],
    notIncluded: ["Transport", "Shipping outside Japan"],
    notSuitableFor: [],
    timeline: [
      { time: "10:00", title: "Hello and tea", text: "A cup of tea while your host shows a few mended pieces." },
      { time: "10:20", title: "Mend", text: "Clean, fill, lacquer, gold." },
    ],
    meeting: { area: "Komachi-dori area, 8-minute walk from Kamakura Station", entrance: "", exteriorPhotoUrl: null },
    knowBeforeYouGo: ["Lacquer takes a week to cure; the finished bowl is shipped to your home or hotel."],
    // No photos in the preview: the list shows a plain thumbnail.
    photos: [],
    offers: [{ id: "offer-workshop", name: "Workshop", adultPriceYen: 8800, childPriceYen: null, capacity: 4, startTime: "10:00", durationMinutes: 120, weekdays: [0, 6], closedDates: [], questions: [] }],
  }),
  experience({
    id: "coffee",
    slug: "kamakura-coffee-roasting",
    title: "Roast Your Own Coffee in a Kamakura Living Room",
    status: "draft",
    language: "en",
    lead: "",
    dayLanguage: "",
    highlights: [],
    description: "",
    included: [],
    notIncluded: [],
    notSuitableFor: [],
    timeline: [],
    meeting: NO_MEETING,
    knowBeforeYouGo: [],
    photos: [],
    offers: [],
  }),
];

export const MOCK_STUDIO_EXPERIENCES: readonly HostExperience[] = [
  experience({
    id: "calligraphy",
    slug: "kamakura-calligraphy",
    title: "Write Your Own Kanji with a Kamakura Calligrapher",
    status: "draft",
    language: "en",
    lead: "Grind your own ink, learn the basic strokes and write the kanji of your choice in a quiet studio near Kamakura Station.",
    dayLanguage: "Japanese and English",
    highlights: ["Practice the eight basic strokes with a real brush.", "Take home the kanji you wrote, mounted on card."],
    description: "",
    included: [],
    notIncluded: [],
    notSuitableFor: [],
    timeline: [],
    meeting: NO_MEETING,
    knowBeforeYouGo: [],
    photos: [],
    offers: [],
  }),
];
