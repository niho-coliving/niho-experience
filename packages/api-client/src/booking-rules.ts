/**
 * 予約の表示と再送の規則（契約の意味を画面ごとにばらばらに解釈しないための純関数）。
 * 金額・残席・確定の正は NIHO。ここでの計算は画面の表示と送信前の確認だけに使う。
 */
import type { CancellationPolicy, CheckoutErrorCode, OfferPricing } from "./types.ts";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** 画面に出す合計（税込・円）。checkout の `expectedTotalYen` にこの値を送る。子ども料金の無い商品に子どもを数えたら null。 */
export function computeExpectedTotalYen(pricing: OfferPricing, adultCount: number, childCount: number): number | null {
  if (!Number.isInteger(adultCount) || !Number.isInteger(childCount) || adultCount < 0 || childCount < 0) return null;
  if (adultCount + childCount < 1) return null;
  if (childCount > 0 && pricing.child === null) return null;
  return pricing.adultPriceYen * adultCount + (pricing.child?.priceYen ?? 0) * childCount;
}

/** 無料で取り消せる期限（UTC の ISO 文字列）。返金なしの規定は null。 */
export function freeCancellationDeadline(startAtIso: string, policy: CancellationPolicy): string | null {
  if (policy.freeCancellationHoursBefore === null) return null;
  const startAt = Date.parse(startAtIso);
  if (Number.isNaN(startAt)) return null;
  return new Date(startAt - policy.freeCancellationHoursBefore * HOUR_MS).toISOString();
}

/** UTC の時刻を日本時間の `YYYY-MM-DD` と `HH:mm` にする（Intl のタイムゾーン変換に頼らない）。 */
export function toJstDateTimeParts(iso: string): { date: string; time: string } | null {
  const instant = Date.parse(iso);
  if (Number.isNaN(instant)) return null;
  const shifted = new Date(instant + JST_OFFSET_MS);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  };
}

/**
 * checkout の失敗をどう扱うか（docs/api-contract.md「エラーと再送」）。
 * - `resend-same-key`: 時間をおいて同じ `clientRequestKey`・同じ内容で再送してよい
 * - `reload-and-reselect`: 詳細と残席を読み直し、旅行者に選び直してもらう（再送するなら新しい key）
 * - `fix-input`: 入力を直してもらう（直した内容は新しい key）
 * - `new-key-and-confirm`: 同じ key で別の内容を送っていた。旅行者に内容を確かめてから新しい key で送る
 * - `wait`: `Retry-After` の秒数だけ待つ
 */
export type CheckoutRecovery = "resend-same-key" | "reload-and-reselect" | "fix-input" | "new-key-and-confirm" | "wait";

export function checkoutRecoveryFor(code: CheckoutErrorCode | "NETWORK_ERROR" | "UNEXPECTED_RESPONSE"): CheckoutRecovery {
  switch (code) {
    case "NETWORK_ERROR":
    case "UNEXPECTED_RESPONSE":
    case "CHECKOUT_UNAVAILABLE":
      return "resend-same-key";
    case "RATE_LIMITED":
      return "wait";
    case "REQUEST_MISMATCH":
      return "new-key-and-confirm";
    case "VALIDATION_ERROR":
    case "INPUT_INVALID":
    case "ANSWERS_INVALID":
      return "fix-input";
    case "CONSENT_OUTDATED":
    case "OCCURRENCE_INVALID":
    case "UNAVAILABLE":
    case "FULL":
    case "HOLD_LIMIT":
    case "QUESTIONS_CHANGED":
    case "PRICE_CHANGED":
      return "reload-and-reselect";
  }
}

/** 申込の試行ごとの key（UUID v4）。内容を変えたら作り直す。 */
export function createClientRequestKey(): string {
  return globalThis.crypto.randomUUID();
}
