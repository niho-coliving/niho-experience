"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureBookingAttribution } from "@/lib/booking-attribution";

/** Captures only allowlisted UTM values in volatile memory while the visitor navigates. */
export function AttributionCapture({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (enabled) captureBookingAttribution(window.location.search, navigator.doNotTrack);
  }, [enabled, pathname]);

  return null;
}
