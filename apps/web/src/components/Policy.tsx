import type { CancellationPolicy } from "@niho-experience/api-client";

const span = (hours: number) => (hours >= 48 && hours % 24 === 0 ? `${hours / 24} days` : `${hours} hours`);

/** Rules arrive sorted from the earliest cancellation window to the latest. */
export function ruleLabel(rules: CancellationPolicy["rules"], index: number) {
  const rule = rules[index]!;
  if (rule.hoursBefore > 0) return `${span(rule.hoursBefore)} or more before`;
  const previous = rules[index - 1];
  return previous ? `Less than ${span(previous.hoursBefore)} before, or no-show` : "Any time";
}

export function PolicyDetails({ policy }: { policy: CancellationPolicy }) {
  const rules = [...policy.rules].sort((a, b) => b.hoursBefore - a.hoursBefore);
  return (
    <div className="space-y-3">
      <p className="font-bold">{policy.summary}</p>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {rules.map((r, i) => (
          <li key={r.hoursBefore} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span>{ruleLabel(rules, i)}</span>
            <span className="shrink-0 font-bold">{r.refundPercent === 0 ? "No refund" : `${r.refundPercent}% refund`}</span>
          </li>
        ))}
      </ul>
      <p className="text-ink-soft">
        <span className="font-bold text-ink">Weather: </span>
        {policy.weather}
      </p>
      {policy.minimumGuests ? (
        <p className="text-ink-soft">
          <span className="font-bold text-ink">Minimum group: </span>
          {policy.minimumGuests.note}
        </p>
      ) : null}
    </div>
  );
}
