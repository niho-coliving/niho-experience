/**
 * 旅行者の一周（src/journey.ts）の合成データ。仮契約の mock だけが使う。
 *
 * - 合成の体験（`(sample)`）の文言は架空。
 * - pilot の体験は、fixture に既にある事実（pilot-experiences.ts の notSuitableFor・knowBeforeYouGo・languageNote・highlights）を
 *   条件の形に並べ直しただけで、新しい事実を足さない。オーナーが確認した原稿に置き換わるまでは推奨値。
 * - 条件の無い体験を残す（dinner など）。画面は「条件が空」でも崩れず、従来の Good to know の一覧へ戻ることを確かめる。
 */
import type { ExperienceConditions, JourneyDetailExtras } from "../journey.ts";

const VERSION = "2026-10-22";

const CONDITIONS: Readonly<Record<string, ExperienceConditions>> = {
  // 承認制・同意の対象あり（年齢と段差）
  "indigo-dyeing-with-an-artisan": {
    version: VERSION,
    items: [
      { kind: "AGE", headline: "Ages 10 and up", detail: "Children must join with an adult", consentText: "Ages 10 and up" },
      { kind: "PHYSICAL", headline: "Standing and working with your hands", detail: "About 2 hours, with short breaks", consentText: null },
      { kind: "HOST_LANGUAGE", headline: "Hosted in Japanese and basic English", detail: "Step-by-step photo guide provided", consentText: null },
      { kind: "FOOD", headline: "Tea and a sweet after", detail: "Vegan option on request", consentText: null },
      { kind: "ACCESS", headline: "Not wheelchair accessible", detail: "Steps up to the studio", consentText: "Steps up to the studio" },
      { kind: "WEATHER", headline: "Rain or shine", detail: "Held indoors", consentText: null },
    ],
  },
  // 即時確定・取消なし。条件の一部だけ（食べもの・段差は無い）
  "seaside-cycling-and-market-breakfast": {
    version: VERSION,
    items: [
      { kind: "AGE", headline: "Ages 8 and up", detail: "Everyone rides their own bicycle", consentText: "Everyone can ride a bicycle confidently" },
      { kind: "PHYSICAL", headline: "Easy, mostly flat ride", detail: "Helmets provided, bikes fitted before we start", consentText: null },
      { kind: "HOST_LANGUAGE", headline: "Hosted in English", detail: null, consentText: null },
      { kind: "FOOD", headline: "Market breakfast included", detail: "Ask before booking if you avoid seafood", consentText: null },
      { kind: "WEATHER", headline: "Light rain is fine", detail: "Stops in heavy rain or strong wind", consentText: "The ride may stop in heavy rain or strong wind" },
    ],
  },
  // 予約を受けていない体験（同意の対象なし）
  "evening-pottery-session": {
    version: VERSION,
    items: [
      { kind: "AGE", headline: "Ages 12 and up", detail: null, consentText: null },
      { kind: "HOST_LANGUAGE", headline: "Japanese with English support", detail: null, consentText: null },
    ],
  },
  // pilot：fixture にある事実だけ（子どもは 12 歳未満不可・階段と坂・小雨は決行・椅子あり・英語の案内）
  "engakuji-zen-meditation": {
    version: VERSION,
    items: [
      { kind: "AGE", headline: "Ages 12 and up", detail: null, consentText: "Ages 12 and up" },
      { kind: "PHYSICAL", headline: "Seated meditation", detail: "A chair is available if sitting on the floor is difficult", consentText: null },
      { kind: "HOST_LANGUAGE", headline: "English-speaking guide", detail: null, consentText: null },
      { kind: "ACCESS", headline: "Hilly grounds with stairs and slopes", detail: "Not suitable if you can't manage stairs and slopes", consentText: "Hilly grounds with stairs and slopes" },
      { kind: "WEATHER", headline: "Goes ahead in light rain", detail: "Cancelled with a refund or another date in a heavy rain, storm or emergency warning", consentText: null },
    ],
  },
};

/** 予約前の質問を受け付けない体験（予約を受けていない体験）。 */
const QUESTIONS_CLOSED: ReadonlySet<string> = new Set(["evening-pottery-session"]);

export function journeyExtrasFor(slug: string): JourneyDetailExtras {
  return { enabled: true, conditions: CONDITIONS[slug] ?? null, questionsOpen: !QUESTIONS_CLOSED.has(slug) };
}
