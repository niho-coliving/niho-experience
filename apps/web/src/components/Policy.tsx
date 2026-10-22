import type { CancellationPolicy } from "@niho-experience/api-client";

/** "Free cancellation until 48 hours before the start", or "Non-refundable". */
export function policyTitle(policy: CancellationPolicy, locale: "en" | "ja" = "en"): string {
  if (locale === "ja") return policy.code === "NONE" ? "返金不可" : `開始${policy.freeCancellationHoursBefore}時間前までキャンセル無料`;
  return policy.code === "NONE" ? "Non-refundable" : `Free cancellation until ${policy.freeCancellationHoursBefore} hours before the start`;
}
