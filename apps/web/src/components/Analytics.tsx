"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentProps } from "react";
import { setAnalyticsSink, track, type EventProps, type FunnelEvent } from "@/lib/analytics";

/**
 * "debug" (preview builds) keeps events in window.__nihoEvents for review and
 * tests. "off" sends nothing; a real tool is wired here once #14 decides one.
 */
export function AnalyticsSetup({ mode }: { mode: "debug" | "off" }) {
  useEffect(() => {
    if (mode !== "debug") {
      setAnalyticsSink(null);
      return;
    }
    window.__nihoEvents = [];
    setAnalyticsSink((e) => {
      window.__nihoEvents?.push(e);
      console.debug("[funnel]", e.event, e.props);
    });
    return () => setAnalyticsSink(null);
  }, [mode]);
  return null;
}

/** Records an event when the page is shown, and again only if its contents change (e.g. new filters). */
export function TrackView({ event, props }: { event: FunnelEvent; props?: EventProps }) {
  const lastSent = useRef<string | null>(null);
  const key = `${event}:${JSON.stringify(props ?? {})}`;
  useEffect(() => {
    if (lastSent.current === key) return;
    lastSent.current = key;
    // Let AnalyticsSetup register its sink first.
    queueMicrotask(() => track(event, props));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers `props`
  }, [event, key]);
  return null;
}

export function TrackedLink({ event, props, onClick, ...rest }: ComponentProps<typeof Link> & { event: FunnelEvent; props?: EventProps }) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        track(event, props);
        onClick?.(e);
      }}
    />
  );
}
