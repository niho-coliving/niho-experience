import type { HostGuestMessage, HostReplyMessage, HostThread, HostThreadBooking } from "../types";
import { MOCK_KITCHEN_BOOKINGS } from "./bookings";

/*
 * Invented messages for the sample kitchen (#106); nobody here is real and no guest has an
 * address (NIHO keeps it). Two questions before booking (one waiting, one answered), the
 * messages of Sofia Rossi's dinner (bk-2031: the host's note before it, and her answer by
 * email), and a question NIHO could not translate. Every time is before the preview's
 * moment (MOCK_NOW, 10/21 15:30). The translations are what NIHO would show; the English of
 * a reply is what the guest got.
 */

/** A booked guest's thread is joined to their booking: its day, start and head count as 予約 has them. */
function bookedAs(id: string): HostThreadBooking {
  const booking = MOCK_KITCHEN_BOOKINGS.find((candidate) => candidate.id === id);
  if (!booking) throw new Error(`mock thread: no booking ${id}`);
  return { id, date: booking.date, start: booking.start, guests: booking.guests };
}

type GuestFields = Pick<HostGuestMessage, "id" | "at" | "original" | "translation"> & Partial<Pick<HostGuestMessage, "language" | "viaEmail">>;
const guest = (fields: GuestFields): HostGuestMessage => ({ from: "guest", language: "en", viaEmail: false, ...fields });
const host = (fields: Pick<HostReplyMessage, "id" | "at" | "japanese" | "english">): HostReplyMessage => ({ from: "host", status: "sent", ...fields });

export const MOCK_KITCHEN_THREADS: readonly HostThread[] = [
  // (a) A question before booking, waiting for the host for two hours.
  {
    id: "th-3012",
    experienceId: "community-dinner",
    guest: "Emma Wilson",
    topic: "子ども",
    booking: null,
    messages: [
      guest({
        id: "th-3012-1",
        at: "2026-10-21T13:24",
        original: "Hi! Can I bring my 9-year-old daughter to the dinner? She loves cooking but is a picky eater.",
        translation: "こんにちは！ 9 歳の娘と一緒にディナーに参加できますか？ 料理は大好きですが、好き嫌いがあります。",
      }),
    ],
  },
  // (b) A question before booking that the host has answered.
  {
    id: "th-3007",
    experienceId: "community-dinner",
    guest: "Daniel Fischer",
    topic: "食べもの",
    booking: null,
    messages: [
      guest({
        id: "th-3007-1",
        at: "2026-10-19T20:41",
        original: "Do you have vegetarian options? My partner doesn't eat meat or fish.",
        translation: "ベジタリアン向けの料理はありますか？ パートナーが肉も魚も食べません。",
      }),
      host({
        id: "th-3007-2",
        at: "2026-10-20T09:12",
        japanese: "はい、ご用意できます。ご予約のときに申込メモへ書いていただければ、だしも野菜でお作りします。",
        english: "Yes, we can. If you mention it in the booking note, we will make the broth with vegetables too.",
      }),
    ],
  },
  // (c) A booked guest answered the host's note by email, and waits for the answer.
  {
    id: "th-3004",
    experienceId: "community-dinner",
    guest: "Sofia Rossi",
    topic: null,
    booking: bookedAs("bk-2031"),
    messages: [
      host({
        id: "th-3004-1",
        at: "2026-10-16T09:20",
        japanese: "ご予約ありがとうございます！ 電車が遅れても、そのまま 2 階へ上がってきてください。18:00 に始めますが、お席は取っておきます。",
        english: "Thank you for booking with us! If your train is late, come straight up: we start at 18:00 and will keep your seats.",
      }),
      guest({
        id: "th-3004-2",
        at: "2026-10-21T11:05",
        original: "Thank you! Our train gets in around 17:40. Is there somewhere we can leave our suitcases during dinner?",
        translation: "ありがとうございます！ 電車は 17:40 ごろに着きます。ディナーの間、スーツケースを置いておける場所はありますか？",
        viaEmail: true,
      }),
    ],
  },
  // (d) NIHO could not translate this one: the host reads the original and can still answer.
  {
    id: "th-3010",
    experienceId: "community-dinner",
    guest: "Jiwoo Han",
    topic: null,
    booking: null,
    messages: [
      guest({
        id: "th-3010-1",
        at: "2026-10-21T08:47",
        language: "ko",
        original: "안녕하세요. 휠체어로도 참가할 수 있을까요? 엘리베이터가 있는지 궁금합니다.",
        translation: null,
      }),
    ],
  },
];

/** What NIHO's draft says for a reply the preview has no English for. */
export const PREVIEW_ENGLISH_DRAFT = "[Preview] NIHO's English draft of your message appears here.";

/** The example replies to the waiting threads, with a natural English for each. */
export const MOCK_REPLY_EXAMPLES: readonly { threadId: string; japanese: string; english: string }[] = [
  {
    threadId: "th-3012",
    japanese: "ご質問ありがとうございます。お子さまも大歓迎です。子ども料金（¥12,000）があり、苦手な食材を前日までに教えていただければ、別の料理をご用意します。",
    english: "Thank you for asking! Children are very welcome. There is a child price (¥12,000), and if you tell us by the day before what she doesn't eat, we will make something else for her.",
  },
  {
    threadId: "th-3004",
    japanese: "はい、入口の横にスーツケースを置ける場所があります。17:40 ごろでしたら、そのままお越しください。",
    english: "Yes, there is room for suitcases next to the entrance. If you arrive around 17:40, just come straight in.",
  },
  {
    threadId: "th-3010",
    japanese: "お問い合わせありがとうございます。会場は 2 階で、エレベーターがありません。ご不便をおかけして申し訳ありません。",
    english: "Thank you for your message. The kitchen is on the second floor and there is no elevator. We are sorry for the inconvenience.",
  },
];

/** The preview's 英語にする: the example's English for its Japanese, else a sentence that says it is a preview. */
export function mockEnglishDraft(threadId: string, japanese: string): string {
  const example = MOCK_REPLY_EXAMPLES.find((candidate) => candidate.threadId === threadId && candidate.japanese === japanese.trim());
  return example?.english ?? PREVIEW_ENGLISH_DRAFT;
}
