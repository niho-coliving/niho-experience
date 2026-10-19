/**
 * 合成の体験データ（架空）。実在の提供者・顧客・住所・写真・レビュー・販売実績を含めない。
 * 名前に「(sample)」を付け、画像は仮素材にして、プレビューで実物と誤認させない。
 * 予約の状態を画面で確かめられるよう、即時確定・承認制・複数商品と子ども料金・申込停止中の 4 件を用意する。
 */
import type { ExperienceDetail } from "../types.ts";
import { placeholderImage, type PlaceholderImageOptions, type PlaceholderImageSpec } from "../mock/placeholder-image.ts";

export const FIXTURE_NIHO_WEB_ORIGIN = "https://niho.life";
/** 体験サイトの公開 origin は未確定のため、予約済みの example ドメインを使う。 */
export const FIXTURE_EXPERIENCE_SITE_ORIGIN = "https://experiences.niho.example";
export const FIXTURE_CONSENT_VERSION = "2026-10-01";
export const FIXTURE_UPDATED_AT = "2026-10-15T09:00:00.000Z";

const KAMAKURA = { key: "kamakura", name: "Kamakura" } as const;

/** 質問の無い商品の fingerprint（空配列の SHA-256・NIHO と同じ算出）。 */
export const EMPTY_BOOKING_QUESTIONS_FINGERPRINT = "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945";

function legalDocuments() {
  return [
    { kind: "TERMS" as const, url: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/terms` },
    { kind: "PRIVACY" as const, url: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/privacy` },
    { kind: "COMMERCIAL_TRANSACTIONS" as const, url: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/tokushoho` },
  ];
}

function bookingTerms(checkoutAvailable: boolean): ExperienceDetail["booking"] {
  return {
    checkoutAvailable,
    currency: "JPY",
    timeZone: "Asia/Tokyo",
    consentVersion: FIXTURE_CONSENT_VERSION,
    legalDocuments: legalDocuments(),
  };
}

function images(specs: PlaceholderImageSpec[], options: PlaceholderImageOptions) {
  return specs.map((spec) => placeholderImage(spec, options));
}

/** 画像の名前は mock-assets/ の SVG と一致させる（test が確かめる）。 */
export const FIXTURE_IMAGE_SPECS = {
  dinner: [
    { name: "dinner-table", label: "Shared dinner table", hue: 28 },
    { name: "dinner-kitchen", label: "Cooking together", hue: 18 },
    { name: "dinner-living-room", label: "Living room", hue: 40 },
    { name: "dinner-entrance", label: "Entrance", hue: 200 },
  ],
  indigo: [
    { name: "indigo-vat", label: "Indigo vat", hue: 220 },
    { name: "indigo-cloth", label: "Dyed cloth", hue: 210 },
    { name: "indigo-hands", label: "Hands at work", hue: 230 },
  ],
  cycling: [
    { name: "cycling-coast", label: "Coastal road", hue: 190 },
    { name: "cycling-market", label: "Morning market", hue: 45 },
    { name: "cycling-breakfast", label: "Breakfast", hue: 35 },
  ],
  pottery: [
    { name: "pottery-wheel", label: "Pottery wheel", hue: 15 },
    { name: "pottery-cups", label: "Finished cups", hue: 25 },
  ],
  people: [
    { name: "host-yui", label: "Host", hue: 330 },
    { name: "host-aiko", label: "Host", hue: 280 },
    { name: "host-ken", label: "Host", hue: 150 },
    { name: "logo-komorebi", label: "Logo", hue: 100 },
    { name: "logo-shonan-cycle", label: "Logo", hue: 170 },
  ],
} satisfies Record<string, PlaceholderImageSpec[]>;

function person(index: number, options: PlaceholderImageOptions) {
  const spec = FIXTURE_IMAGE_SPECS.people[index];
  if (!spec) throw new Error(`unknown placeholder ${index}`);
  return placeholderImage(spec, options);
}

export function buildFixtureExperiences(options: PlaceholderImageOptions = {}): ExperienceDetail[] {
  const dinnerPhotos = images(FIXTURE_IMAGE_SPECS.dinner, options);
  const indigoPhotos = images(FIXTURE_IMAGE_SPECS.indigo, options);
  const cyclingPhotos = images(FIXTURE_IMAGE_SPECS.cycling, options);
  const potteryPhotos = images(FIXTURE_IMAGE_SPECS.pottery, options);

  return [
    {
      slug: "home-cooked-dinner-with-locals",
      title: "Home-cooked dinner with locals in a shared living room",
      contentLanguage: "EN",
      region: { ...KAMAKURA },
      canonicalUrl: `${FIXTURE_EXPERIENCE_SITE_ORIGIN}/experiences/home-cooked-dinner-with-locals`,
      lead: "Cook and share a seasonal dinner with the people who live and work around a neighbourhood living room.",
      languageNote: "English & Japanese",
      highlights: [
        "Help prepare two or three home-style dishes",
        "Meet residents, makers and regulars of the living room",
        "Small group of up to 12 guests",
      ],
      timeline: [
        { time: "18:00", title: "Welcome", text: "A short tour of the living room and a drink.", photoIndex: 2 },
        { time: "18:20", title: "Cook together", text: "Prepare dishes with the host.", photoIndex: 1 },
        { time: "19:15", title: "Dinner", text: "Eat around one table and talk.", photoIndex: 0 },
      ],
      description:
        "This is a sample experience for previews.\n\nThe host plans a simple menu from seasonal vegetables. Nobody needs to be a good cook — chopping, plating and tasting are all part of it.",
      included: ["Dinner and soft drinks", "Recipe card in English"],
      notIncluded: ["Alcohol", "Transport"],
      notSuitableFor: ["Guests who need a fully gluten-free kitchen"],
      knowBeforeYouGo: ["Please arrive five minutes early.", "Shoes are removed at the entrance."],
      cover: dinnerPhotos[0] ?? null,
      photos: dinnerPhotos,
      meetingPointDisclosure: "PUBLIC",
      meetingPoint: {
        name: "Komorebi Living (sample)",
        address: "Sample address, Kamakura (fictional)",
        accessNote: "About 10 minutes on foot from the nearest station (sample).",
        entranceNote: "Ring the bell at the wooden door.",
        mapUrl: null,
        exteriorPhotoIndex: 3,
      },
      hosts: [{ displayName: "Yui (sample)", avatar: person(0, options) }],
      provider: {
        name: "Komorebi Living (sample)",
        kind: "SPOT",
        tagline: "A neighbourhood living room for members and visitors (sample).",
        logo: person(3, options),
      },
      seller: { displayName: "Komorebi Living (sample seller)", legalNoticeUrl: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/tokushoho` },
      offers: [
        {
          id: "offer_dinner_seat",
          name: "Dinner seat",
          shortDescription: null,
          pricing: {
            currency: "JPY",
            taxIncluded: true,
            adultPriceYen: 6500,
            child: { priceYen: 3000, minAge: 6, maxAge: 12, adultRequired: true },
          },
          capacity: 12,
          maxPartySize: 6,
          minimumParticipants: 1,
          durationMinutes: 150,
          startTime: "18:00",
          weekdays: [5, 6],
          cancellationPolicy: { code: "FREE_UNTIL_24H", freeCancellationHoursBefore: 24 },
          acceptanceMode: "INSTANT",
          bookingQuestions: [
            {
              id: "q_diet",
              prompt: "Any dietary restrictions or allergies?",
              description: "We can cook vegetarian on request.",
              inputType: "SHORT_TEXT",
              required: false,
              options: [],
            },
          ],
          bookingQuestionsFingerprint: "dce02f9d434f7c20c25dbe1f6d4c805f360ce9623fcfa6a5823d4315bf8f8e5f",
        },
      ],
      booking: bookingTerms(true),
      updatedAt: FIXTURE_UPDATED_AT,
    },
    {
      slug: "indigo-dyeing-with-an-artisan",
      title: "Indigo dyeing morning with a local artisan",
      contentLanguage: "EN",
      region: { ...KAMAKURA },
      canonicalUrl: `${FIXTURE_EXPERIENCE_SITE_ORIGIN}/experiences/indigo-dyeing-with-an-artisan`,
      lead: "Dye a cotton handkerchief in natural indigo at a small home studio.",
      languageNote: "English (basic) & Japanese",
      highlights: ["Learn how natural indigo is kept alive", "Take home what you dye"],
      timeline: [],
      description: "This is a sample experience for previews.\n\nThe studio is the artisan's home, so the exact place is shared after the booking is confirmed.",
      included: ["Cotton handkerchief", "Tea"],
      notIncluded: [],
      notSuitableFor: ["Children under 10"],
      knowBeforeYouGo: ["Wear clothes that can get stained."],
      cover: indigoPhotos[0] ?? null,
      photos: indigoPhotos,
      meetingPointDisclosure: "AFTER_BOOKING",
      meetingPoint: null,
      hosts: [{ displayName: "Aiko (sample)", avatar: person(1, options) }],
      provider: { name: "Aiko S. (sample host)", kind: "INDIVIDUAL", tagline: null, logo: null },
      seller: { displayName: "Aiko S. (sample seller)", legalNoticeUrl: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/tokushoho` },
      offers: [
        {
          id: "offer_indigo_session",
          name: "Morning session",
          shortDescription: "About two hours including tea.",
          pricing: { currency: "JPY", taxIncluded: true, adultPriceYen: 8800, child: null },
          capacity: 4,
          maxPartySize: 4,
          minimumParticipants: 1,
          durationMinutes: 120,
          startTime: "10:00",
          weekdays: [2, 4],
          cancellationPolicy: { code: "FREE_UNTIL_48H", freeCancellationHoursBefore: 48 },
          acceptanceMode: "APPROVAL",
          bookingQuestions: [
            {
              id: "q_colour",
              prompt: "Which shade would you like to dye?",
              description: null,
              inputType: "SINGLE_SELECT",
              required: true,
              options: [
                { id: "o_deep", label: "Deep indigo" },
                { id: "o_light", label: "Light sky blue" },
              ],
            },
            {
              id: "q_notes",
              prompt: "Anything the host should know?",
              description: "For example, experience with dyeing or mobility needs.",
              inputType: "LONG_TEXT",
              required: false,
              options: [],
            },
          ],
          bookingQuestionsFingerprint: "61ddf89b8bd85da6297f3ab0aaf94e4d3663c055f0d5240fbd7606ac70ea8410",
        },
      ],
      booking: bookingTerms(true),
      updatedAt: FIXTURE_UPDATED_AT,
    },
    {
      slug: "seaside-cycling-and-market-breakfast",
      title: "Seaside cycling and a fish market breakfast",
      contentLanguage: "EN",
      region: { ...KAMAKURA },
      canonicalUrl: `${FIXTURE_EXPERIENCE_SITE_ORIGIN}/experiences/seaside-cycling-and-market-breakfast`,
      lead: "Ride the coast in the early morning and finish with breakfast at a local market.",
      languageNote: "English",
      highlights: ["Quiet coastal roads before the crowds", "Breakfast chosen by the guide"],
      timeline: [
        { time: "07:30", title: "Bike fitting", text: "Helmets and a short safety talk.", photoIndex: null },
        { time: "08:00", title: "Coastal ride", text: "An easy, mostly flat route.", photoIndex: 0 },
        { time: "09:45", title: "Market breakfast", text: "Breakfast at the morning market.", photoIndex: 2 },
      ],
      description: "This is a sample experience for previews.\n\nGroups of two or more. Choose a standard bike or an e-bike.",
      included: ["Bike and helmet", "Breakfast"],
      notIncluded: ["Insurance beyond the basic cover"],
      notSuitableFor: ["Riders who cannot ride a bicycle confidently"],
      knowBeforeYouGo: ["The tour runs in light rain and stops in heavy rain or strong wind."],
      cover: cyclingPhotos[0] ?? null,
      photos: cyclingPhotos,
      meetingPointDisclosure: "PUBLIC",
      meetingPoint: {
        name: "Shonan Cycle Works (sample)",
        address: "Sample address near the coast (fictional)",
        accessNote: null,
        entranceNote: null,
        mapUrl: null,
        exteriorPhotoIndex: null,
      },
      hosts: [{ displayName: "Ken (sample)", avatar: person(2, options) }],
      provider: { name: "Shonan Cycle Works (sample)", kind: "BUSINESS", tagline: "A small bike shop by the sea (sample).", logo: person(4, options) },
      seller: { displayName: "Shonan Cycle Works (sample seller)", legalNoticeUrl: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/tokushoho` },
      offers: [
        {
          id: "offer_cycling_standard",
          name: "Standard bike",
          shortDescription: null,
          pricing: {
            currency: "JPY",
            taxIncluded: true,
            adultPriceYen: 7500,
            child: { priceYen: 4000, minAge: 10, maxAge: 15, adultRequired: true },
          },
          capacity: 8,
          maxPartySize: 4,
          minimumParticipants: 2,
          durationMinutes: 180,
          startTime: "07:30",
          weekdays: [0, 6],
          cancellationPolicy: { code: "NONE", freeCancellationHoursBefore: null },
          acceptanceMode: "INSTANT",
          bookingQuestions: [],
          bookingQuestionsFingerprint: EMPTY_BOOKING_QUESTIONS_FINGERPRINT,
        },
        {
          id: "offer_cycling_ebike",
          name: "E-bike",
          shortDescription: "Electric assist for hills.",
          pricing: { currency: "JPY", taxIncluded: true, adultPriceYen: 9800, child: null },
          capacity: 4,
          maxPartySize: 4,
          minimumParticipants: 2,
          durationMinutes: 180,
          startTime: "07:30",
          weekdays: [0, 6],
          cancellationPolicy: { code: "NONE", freeCancellationHoursBefore: null },
          acceptanceMode: "INSTANT",
          bookingQuestions: [],
          bookingQuestionsFingerprint: EMPTY_BOOKING_QUESTIONS_FINGERPRINT,
        },
      ],
      booking: bookingTerms(true),
      updatedAt: FIXTURE_UPDATED_AT,
    },
    {
      slug: "evening-pottery-session",
      title: "Evening pottery session",
      contentLanguage: "EN",
      region: { ...KAMAKURA },
      canonicalUrl: `${FIXTURE_EXPERIENCE_SITE_ORIGIN}/experiences/evening-pottery-session`,
      lead: "Shape a cup on the wheel. Bookings are paused in this sample to show the unavailable state.",
      languageNote: "Japanese with English support",
      highlights: ["Beginner friendly"],
      timeline: [],
      description: "This is a sample experience for previews. Online booking is not open for it.",
      included: ["Clay and firing"],
      notIncluded: ["Shipping of the finished cup"],
      notSuitableFor: [],
      knowBeforeYouGo: [],
      cover: potteryPhotos[0] ?? null,
      photos: potteryPhotos,
      meetingPointDisclosure: "PUBLIC",
      meetingPoint: {
        name: "Komorebi Living (sample)",
        address: "Sample address, Kamakura (fictional)",
        accessNote: null,
        entranceNote: null,
        mapUrl: null,
        exteriorPhotoIndex: null,
      },
      hosts: [],
      provider: { name: "Komorebi Living (sample)", kind: "SPOT", tagline: null, logo: person(3, options) },
      seller: { displayName: "Komorebi Living (sample seller)", legalNoticeUrl: `${FIXTURE_NIHO_WEB_ORIGIN}/legal/tokushoho` },
      offers: [
        {
          id: "offer_pottery_seat",
          name: "Wheel seat",
          shortDescription: null,
          pricing: { currency: "JPY", taxIncluded: true, adultPriceYen: 3000, child: null },
          capacity: 6,
          maxPartySize: 2,
          minimumParticipants: 1,
          durationMinutes: 90,
          startTime: "19:00",
          weekdays: [3],
          cancellationPolicy: { code: "FREE_UNTIL_24H", freeCancellationHoursBefore: 24 },
          acceptanceMode: "INSTANT",
          bookingQuestions: [],
          bookingQuestionsFingerprint: EMPTY_BOOKING_QUESTIONS_FINGERPRINT,
        },
      ],
      booking: bookingTerms(false),
      updatedAt: FIXTURE_UPDATED_AT,
    },
  ];
}
