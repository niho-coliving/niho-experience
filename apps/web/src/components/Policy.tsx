import type { CancellationPolicy } from "@niho-experience/api-client";

export function PolicyDetails({ policy }: { policy: CancellationPolicy }) {
  return <div className="rounded-xl border border-line bg-surface p-4">
    <p className="font-bold">{policy.code === "NONE" ? "Non-refundable" : `Free cancellation until ${policy.freeCancellationHoursBefore} hours before the start`}</p>
    <p className="mt-2 text-sm text-ink-soft">This policy applies to the option and date you select.</p>
  </div>;
}
