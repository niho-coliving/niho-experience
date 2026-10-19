/**
 * SYNTHETIC fixtures. Every host, story, price and date below is invented for
 * the preview. None of it describes a real person, product or booking, and
 * images are placeholder art. Do not replace with real data in this repo.
 */
import type { CancellationPolicy, ExperienceDetail, Image, PriceUnit, Seller, Theme } from "../contract";

export const THEMES = {
  food: { slug: "food", label: "Food & table" },
  craft: { slug: "craft", label: "Craft" },
  nature: { slug: "nature", label: "Nature walks" },
  culture: { slug: "culture", label: "Local life" },
} satisfies Record<string, Theme>;

const KAMAKURA = { slug: "kamakura", name: "Kamakura" };

const placeholder = (name: string, alt: string, width = 1200, height = 900): Image => ({
  url: `/placeholders/${name}.svg`,
  alt,
  width,
  height,
  placeholder: true,
});

const portrait = (name: string, alt: string): Image => placeholder(`portrait-${name}`, alt, 480, 480);

const SAMPLE_SELLER: Seller = {
  displayName: "Sample Seller (synthetic)",
  kind: "niho_spot",
  disclosureUrl: null,
};

const standardCancellation = (version: string, weather: string, minimumGuests: CancellationPolicy["minimumGuests"]): CancellationPolicy => ({
  summary: "Free cancellation up to 3 days before. 50% refund up to 24 hours before.",
  rules: [
    { hoursBefore: 72, refundPercent: 100 },
    { hoursBefore: 24, refundPercent: 50 },
    { hoursBefore: 0, refundPercent: 0 },
  ],
  weather,
  minimumGuests,
  version,
});

/** How the mock builds upcoming slots for each experience. */
export interface SlotPlan {
  weekdays: number[];
  startHour: number;
  startMinute: number;
  unitAmount: number;
  unit: PriceUnit;
  /** Slots starting sooner than this close for booking. */
  cutoffHours: number;
  /** Indexes (in upcoming order) that are sold out. "all" = every slot. */
  soldOut: number[] | "all";
  paused: boolean;
}

export interface Fixture {
  detail: Omit<ExperienceDetail, "availability">;
  plan: SlotPlan;
}

export const FIXTURES: Fixture[] = [
  {
    detail: {
      id: "exp_sample_dinner",
      slug: "neighborhood-dinner-table",
      title: "Home-style dinner at a neighborhood table",
      summary: "Cook two seasonal dishes with Mika, then sit down with the neighbors who drop by on Friday nights.",
      area: KAMAKURA,
      themes: [THEMES.food, THEMES.culture],
      durationMinutes: 150,
      languages: ["en", "ja"],
      price: { from: { amount: 6800, currency: "JPY" }, unit: "per_person" },
      heroImage: placeholder("dinner", "Placeholder illustration: a long wooden table set with bowls of seasonal food"),
      host: {
        displayName: "Mika",
        role: "Home cook and community host",
        portrait: portrait("mika", "Placeholder portrait for the sample host Mika"),
        story: [
          "Mika moved to Kamakura ten years ago and started cooking for whoever was around on Friday evenings. The table grew from four chairs to twelve.",
          "She likes simple food from nearby farms and fishing boats, and conversations that switch between English and Japanese halfway through a sentence.",
        ],
      },
      synthetic: true,
      gallery: [
        placeholder("dinner-2", "Placeholder illustration: hands shaping rice balls on a cutting board"),
        placeholder("dinner-3", "Placeholder illustration: lanterns outside a wooden house at dusk"),
      ],
      description: [
        "This is a relaxed evening in a shared living room, not a cooking class. You will help prepare two dishes using what is in season, then eat together with Mika and a few local regulars.",
        "Expect miso soup made from scratch, something grilled, and plenty of rice. Vegetarian guests are welcome — tell us when you book.",
      ],
      highlights: [
        "Cook alongside a local host in a real neighborhood space",
        "Meet residents who come for the same Friday dinner",
        "Small group of up to 10 guests",
      ],
      itinerary: [
        { title: "Welcome and a walk through the pantry", minutes: 15, detail: "Mika shows what came from which farm this week." },
        { title: "Cook together", minutes: 60, detail: "Everyone takes a job: washing, cutting, grilling or stirring." },
        { title: "Dinner at the long table", minutes: 60, detail: "Eat, talk, and meet whoever stops by." },
        { title: "Tea and goodbye", minutes: 15, detail: "Ask for recommendations for the rest of your stay." },
      ],
      included: ["Dinner and soft drinks", "Ingredients and aprons", "Recipe cards in English"],
      notIncluded: ["Alcoholic drinks", "Transport to the venue"],
      goodToKnow: [
        "Tell us about allergies or dietary needs when you book.",
        "Children aged 6 and over are welcome with an adult.",
      ],
      accessibility: ["Ground-floor space with one small step at the entrance", "Shoes off indoors; chairs available"],
      groupSize: { min: 1, max: 10 },
      meetingArea: { summary: "A residential street about 8 minutes on foot from the station. The exact address is sent after booking.", nearestStation: "Kamakura Station (sample)" },
      seller: SAMPLE_SELLER,
      cancellation: standardCancellation("sample-2026-10", "Held indoors in any weather.", { count: 4, note: "If fewer than 4 guests book, we cancel 48 hours before with a full refund." }),
    },
    plan: { weekdays: [5, 6], startHour: 18, startMinute: 0, unitAmount: 6800, unit: "per_person", cutoffHours: 24, soldOut: [1], paused: false },
  },
  {
    detail: {
      id: "exp_sample_walk",
      slug: "morning-hill-walk-and-tea",
      title: "Private morning hill walk with green tea",
      summary: "A quiet trail above the town with Kenji, ending with whisked green tea and the view to the sea.",
      area: KAMAKURA,
      themes: [THEMES.nature, THEMES.culture],
      durationMinutes: 120,
      languages: ["en"],
      price: { from: { amount: 14000, currency: "JPY" }, unit: "per_group" },
      heroImage: placeholder("walk", "Placeholder illustration: a forest path climbing toward hills and the sea"),
      host: {
        displayName: "Kenji",
        role: "Trail walker and tea lover",
        portrait: portrait("kenji", "Placeholder portrait for the sample host Kenji"),
        story: [
          "Kenji walks the hills every morning before work and knows which paths stay dry after rain.",
          "He carries a small tea set in his backpack and will happily explain why the first sip should be loud.",
        ],
      },
      synthetic: true,
      gallery: [placeholder("walk-2", "Placeholder illustration: a tea bowl on a flat stone with trees behind")],
      description: [
        "Your group walks a forested ridge trail at an easy pace, with stops to talk about the temples and houses below.",
        "At a lookout, Kenji prepares matcha for everyone. The walk is private, so the price covers your whole group.",
      ],
      highlights: ["Private walk for your group only", "Easy-to-moderate trail with gentle climbs", "Matcha prepared outdoors"],
      itinerary: [
        { title: "Meet near the trailhead", minutes: 10, detail: "Short safety talk and a look at the route." },
        { title: "Ridge walk", minutes: 75, detail: "About 4 km with several stops." },
        { title: "Tea at the lookout", minutes: 35, detail: "Whisk your own bowl if you like." },
      ],
      included: ["Matcha and a small sweet", "Rain ponchos if needed"],
      notIncluded: ["Walking shoes", "Transport to the trailhead"],
      goodToKnow: ["Wear shoes with grip. The trail has roots and stone steps.", "Bring water, especially in summer."],
      accessibility: ["Not suitable for wheelchairs or strollers", "Includes uneven steps and slopes"],
      groupSize: { min: 1, max: 4 },
      meetingArea: { summary: "Near a trailhead about 15 minutes on foot from the station. Details are sent after booking.", nearestStation: "Kita-Kamakura Station (sample)" },
      seller: SAMPLE_SELLER,
      cancellation: standardCancellation("sample-2026-10", "In heavy rain or storm warnings we cancel with a full refund or offer another date.", null),
    },
    plan: { weekdays: [0, 3], startHour: 8, startMinute: 0, unitAmount: 14000, unit: "per_group", cutoffHours: 24, soldOut: [], paused: false },
  },
  {
    detail: {
      id: "exp_sample_carving",
      slug: "lacquer-carving-workshop",
      title: "Carve a small tray in the Kamakura-bori style",
      summary: "Learn basic carving strokes from Haruko in her workshop and take home a small tray you made yourself.",
      area: KAMAKURA,
      themes: [THEMES.craft],
      durationMinutes: 180,
      languages: ["en", "ja"],
      price: { from: { amount: 9000, currency: "JPY" }, unit: "per_person" },
      heroImage: placeholder("carving", "Placeholder illustration: carving tools beside a round wooden tray"),
      host: {
        displayName: "Haruko",
        role: "Woodcarver",
        portrait: portrait("haruko", "Placeholder portrait for the sample host Haruko"),
        story: [
          "Haruko learned carving from her grandfather and now teaches small groups at a workbench by the window.",
          "She is patient with beginners and strict about one thing only: always carve away from your hand.",
        ],
      },
      synthetic: true,
      gallery: [placeholder("carving-2", "Placeholder illustration: wood shavings and a half-carved flower pattern")],
      description: [
        "Kamakura-bori is a local tradition of carving patterns into wood before lacquering. In this beginner session you will practise a few strokes and carve a simple pattern on a small tray.",
        "Lacquering takes weeks, so you will take home your carved tray with a quick protective finish.",
      ],
      highlights: ["Hands-on from the first minute", "Up to 4 guests per session", "Take home what you carve"],
      itinerary: [
        { title: "Tools and safety", minutes: 20, detail: "Hold the knife, try the strokes on scrap wood." },
        { title: "Choose and draw a pattern", minutes: 30, detail: "Simple flowers, waves or your own idea." },
        { title: "Carve", minutes: 110, detail: "With breaks and tea." },
        { title: "Finish and wrap", minutes: 20, detail: "Protective finish and packing for travel." },
      ],
      included: ["All tools and materials", "Your carved tray", "Tea"],
      notIncluded: ["Shipping overseas"],
      goodToKnow: ["Recommended for ages 12 and over.", "Wear clothes you do not mind getting dusty."],
      accessibility: ["Seated work at a table", "Second-floor workshop reached by stairs"],
      groupSize: { min: 1, max: 4 },
      meetingArea: { summary: "A workshop on a shopping street about 5 minutes on foot from the station. The address is sent after booking.", nearestStation: "Kamakura Station (sample)" },
      seller: SAMPLE_SELLER,
      cancellation: standardCancellation("sample-2026-10", "Held indoors in any weather.", null),
    },
    plan: { weekdays: [2, 4], startHour: 13, startMinute: 30, unitAmount: 9000, unit: "per_person", cutoffHours: 48, soldOut: [0, 3], paused: false },
  },
  {
    detail: {
      id: "exp_sample_market",
      slug: "fish-market-breakfast",
      title: "Early fish market visit and breakfast cooking",
      summary: "Meet the morning boats with Daichi, pick fish together, and cook a simple breakfast by the shore.",
      area: KAMAKURA,
      themes: [THEMES.food],
      durationMinutes: 150,
      languages: ["en", "ja"],
      price: { from: { amount: 8000, currency: "JPY" }, unit: "per_person" },
      heroImage: placeholder("market", "Placeholder illustration: small fishing boats on a beach at sunrise"),
      host: {
        displayName: "Daichi",
        role: "Former fisherman and home cook",
        portrait: portrait("daichi", "Placeholder portrait for the sample host Daichi"),
        story: ["Daichi fished off this coast for twenty years. Now he cooks for friends and still knows every boat by name."],
      },
      synthetic: true,
      gallery: [],
      description: [
        "Start at sunrise at a small beach market, choose fish with Daichi, then cook rice, soup and grilled fish in a shared kitchen nearby.",
      ],
      highlights: ["Sunrise start", "Cook what you choose", "Up to 6 guests"],
      itinerary: [
        { title: "Morning market", minutes: 45, detail: "See what the boats brought in." },
        { title: "Cook breakfast", minutes: 60, detail: "Rice, miso soup and grilled fish." },
        { title: "Eat together", minutes: 45, detail: "Breakfast with a sea view." },
      ],
      included: ["Breakfast", "Ingredients"],
      notIncluded: ["Transport"],
      goodToKnow: ["Market days depend on the boats. We confirm the evening before."],
      accessibility: ["Includes walking on sand", "Seated breakfast"],
      groupSize: { min: 2, max: 6 },
      meetingArea: { summary: "A beach area about 10 minutes on foot from the station. Details are sent after booking.", nearestStation: "Yuigahama Station (sample)" },
      seller: SAMPLE_SELLER,
      cancellation: standardCancellation("sample-2026-10", "If the boats do not go out, we cancel with a full refund.", { count: 2, note: "Minimum 2 guests per booking." }),
    },
    plan: { weekdays: [6], startHour: 6, startMinute: 30, unitAmount: 8000, unit: "per_person", cutoffHours: 24, soldOut: "all", paused: false },
  },
  {
    detail: {
      id: "exp_sample_indigo",
      slug: "backyard-indigo-dyeing",
      title: "Indigo dyeing in a backyard studio",
      summary: "Dye a cotton scarf with natural indigo in Sora's garden studio and learn simple folding patterns.",
      area: KAMAKURA,
      themes: [THEMES.craft],
      durationMinutes: 120,
      languages: ["en"],
      price: { from: { amount: 7500, currency: "JPY" }, unit: "per_person" },
      heroImage: placeholder("indigo", "Placeholder illustration: blue cloth drying on a line in a garden"),
      host: {
        displayName: "Sora",
        role: "Textile artist",
        portrait: portrait("sora", "Placeholder portrait for the sample host Sora"),
        story: ["Sora grows a little indigo in the garden and keeps a dye vat going all year."],
      },
      synthetic: true,
      gallery: [],
      description: ["Fold, bind and dip a cotton scarf, then watch it turn from green to blue as it meets the air."],
      highlights: ["Natural indigo vat", "Take home your scarf"],
      itinerary: [
        { title: "Folding patterns", minutes: 30, detail: "Try a few on paper first." },
        { title: "Dyeing", minutes: 60, detail: "Several dips with time to oxidise." },
        { title: "Rinse and dry", minutes: 30, detail: "With tea in the garden." },
      ],
      included: ["Cotton scarf", "Gloves and apron"],
      notIncluded: ["Transport"],
      goodToKnow: ["Indigo can stain hands and clothes."],
      accessibility: ["Outdoor garden with gravel paths"],
      groupSize: { min: 1, max: 6 },
      meetingArea: { summary: "A garden studio in a quiet residential area. Details are sent after booking.", nearestStation: "Hase Station (sample)" },
      seller: SAMPLE_SELLER,
      cancellation: standardCancellation("sample-2026-10", "Held under a roof in light rain. Storm warnings cancel with a full refund.", null),
    },
    plan: { weekdays: [1, 6], startHour: 10, startMinute: 0, unitAmount: 7500, unit: "per_person", cutoffHours: 24, soldOut: [], paused: true },
  },
];

/** Contact emails that make the mock checkout return a specific failure. */
export const MOCK_CHECKOUT_TRIGGERS = {
  "sold-out@example.com": "SLOT_SOLD_OUT",
  "price-changed@example.com": "PRICE_CHANGED",
  "unavailable@example.com": "UNAVAILABLE",
  "expired@example.com": "QUOTE_EXPIRED",
} as const;
