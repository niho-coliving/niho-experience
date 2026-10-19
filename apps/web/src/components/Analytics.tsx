"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentProps } from "react";
import { sanitizeUmamiPayload, setAnalyticsSink, track, type EventProps, type FunnelEvent, type TrackedEvent } from "@/lib/analytics";

interface UmamiTracker {
  track: (name: string, data?: Record<string, string | number | boolean>) => void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
    nihoUmamiBeforeSend?: (type: string, payload: Record<string, unknown>) => Record<string, unknown> | false;
  }
}

const pendingUmamiEvents: TrackedEvent[] = [];

function flushUmamiEvents() {
  const tracker = window.umami;
  if (!tracker?.track) return;
  for (const event of pendingUmamiEvents.splice(0)) {
    try {
      tracker.track(event.event, event.props);
    } catch {
      // Analytics must not affect the guest.
    }
  }
}

/**
 * Preview keeps events in memory for review. Umami is enabled only by the
 * production layout when its canonical host and runtime website ID are set.
 */
export function AnalyticsSetup({ mode, websiteId }: { mode: "debug" | "off" | "umami"; websiteId: string }) {
  useEffect(() => {
    if (mode === "off") {
      setAnalyticsSink(null);
      return;
    }

    if (mode === "debug") {
      window.__nihoEvents = [];
      setAnalyticsSink((event) => {
        window.__nihoEvents?.push(event);
        console.debug("[funnel]", event.event, event.props);
      });
      return () => setAnalyticsSink(null);
    }

    if (!/^[0-9a-f-]{36}$/i.test(websiteId)) {
      setAnalyticsSink(null);
      return;
    }

    // Umami calls this hook before sending pageviews or events. Define it
    // before adding the external script so no unfiltered payload can race it.
    window.nihoUmamiBeforeSend = (type, payload) =>
      sanitizeUmamiPayload(type, payload, window.location.origin);

    setAnalyticsSink((event) => {
      if (window.umami?.track) {
        try {
          window.umami.track(event.event, event.props);
        } catch {
          // Analytics must not affect the guest.
        }
      } else if (pendingUmamiEvents.length < 100) {
        pendingUmamiEvents.push(event);
      }
    });

    let script = document.getElementById("niho-umami-tracker") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "niho-umami-tracker";
      script.defer = true;
      script.src = "https://cloud.umami.is/script.js";
      script.dataset.websiteId = websiteId;
      script.dataset.domains = "experience.niho.life";
      script.dataset.doNotTrack = "true";
      script.dataset.excludeHash = "true";
      script.dataset.beforeSend = "nihoUmamiBeforeSend";
      script.addEventListener("load", flushUmamiEvents, { once: true });
      document.head.appendChild(script);
    } else if (window.umami?.track) {
      flushUmamiEvents();
    } else {
      script.addEventListener("load", flushUmamiEvents, { once: true });
    }

    return () => setAnalyticsSink(null);
  }, [mode, websiteId]);
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
