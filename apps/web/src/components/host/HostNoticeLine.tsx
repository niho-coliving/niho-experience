import type { HostNotice } from "@/host/payout";
import { HostIcon } from "./HostIcon";

/**
 * The result of an action next to its controls: a success is read out politely (role=status,
 * always on the page, empty and without height until there is something to say), an error at
 * once (role=alert).
 */
export function HostNoticeLine({ notice, className = "" }: { notice: HostNotice | null; className?: string }) {
  return (
    <>
      <p role="status" className="text-[0.78125rem] leading-normal font-extrabold text-moss">
        {notice?.tone === "success" ? (
          <span className={`flex items-start gap-1 ${className}`.trim()}>
            <HostIcon name="check" className="mt-0.5 size-3.5" />
            {notice.message}
          </span>
        ) : null}
      </p>
      {notice?.tone === "error" ? (
        <p role="alert" className={`text-[0.78125rem] leading-normal font-extrabold text-danger ${className}`.trim()}>
          {notice.message}
        </p>
      ) : null}
    </>
  );
}
