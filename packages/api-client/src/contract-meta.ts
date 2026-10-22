/**
 * 契約の版と状態（contract/experience-public-api.openapi.json の info と一致することを test が確かめる）。
 * `agreed` は NIHO 側（niho-app の contracts/exports）が書き出した配布物であることを表す。実 API と接続済みかどうかは
 * 配備と `verify:live` の結果で判断し、画面・文書で接続済みと表示しない。
 */
export const EXPERIENCE_API_CONTRACT = {
  version: "1.2.0",
  status: "agreed",
} as const;

/**
 * ホスト API の契約（contract/experience-host-api.openapi.json）の版と状態。`draft` は NIHO 側（niho-app の contracts/exports）が
 * 書き出したが、まだ NIHO の main に入っていない・配備されていない段階を表す。ホストの画面は mock で作り、実 API と接続済みとは扱わない。
 */
export const EXPERIENCE_HOST_API_CONTRACT = {
  version: "0.2.0",
  status: "draft",
} as const;

/**
 * Admin 認証だけの選別済み契約。NIHO 側 b1bee0090e の先行実装に対応するが、
 * まだ配備済みとは扱わない。予約・料金・通知・ホスト設定 API は含まない。
 */
export const EXPERIENCE_ADMIN_AUTH_API_CONTRACT = {
  version: "1.0.0",
  status: "agreed",
  sourceCommit: "b1bee0090e",
  deploymentStatus: "not-deployed",
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
