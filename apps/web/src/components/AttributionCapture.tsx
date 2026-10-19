"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { doNotTrackEnabled } from "@/lib/analytics";
import { captureFirstTouchAttribution } from "@/lib/attribution";

export function AttributionCapture({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (!enabled || doNotTrackEnabled(navigator.doNotTrack)) return;
    try {
      captureFirstTouchAttribution(window.location.href, window.sessionStorage, false);
    } catch {
      // A browser that blocks session storage must still be able to book.
    }
  }, [enabled, pathname, search]);

  return null;
}
