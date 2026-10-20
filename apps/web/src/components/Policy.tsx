import type { CancellationPolicy } from "@niho-experience/api-client";

/** "Free cancellation until 48 hours before the start", or "Non-refundable". */
export function policyTitle(policy: CancellationPolicy): string {
  return policy.code === "NONE" ? "Non-refundable" : `Free cancellation until ${policy.freeCancellationHoursBefore} hours before the start`;
}
