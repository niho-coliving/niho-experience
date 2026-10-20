/**
 * 契約の版と状態（contract/experience-public-api.openapi.json の info と一致することを test が確かめる）。
 * `agreed` は NIHO 側（niho-app の contracts/exports）が書き出した配布物であることを表す。実 API と接続済みかどうかは
 * 配備と `verify:live` の結果で判断し、画面・文書で接続済みと表示しない。
 */
export const EXPERIENCE_API_CONTRACT = {
  version: "1.2.0",
  status: "agreed",
} as const;

/** 予約に関わる時刻の基準。表示も日本時間（Asia/Tokyo）で行う。 */
export const EXPERIENCE_TIME_ZONE = "Asia/Tokyo";

/** 開催回を返す期間（日本時間の今日から）。 */
export const EXPERIENCE_AVAILABILITY_WINDOW_DAYS = 90;

/** ゲスト入力の上限（契約の ExperienceCheckoutRequest と同じ）。 */
export const EXPERIENCE_CHECKOUT_INPUT_LIMITS = {
  guestNameMaxLength: 100,
  guestEmailMaxLength: 254,
  noteMaxLength: 500,
  shortTextAnswerMaxLength: 200,
  longTextAnswerMaxLength: 1000,
  clientRequestKeyMinLength: 8,
  clientRequestKeyMaxLength: 120,
} as const;
