"use client";

import { useEffect, useRef } from "react";
import type { SiteVideo } from "@/lib/site-media";

/**
 * Silent decorative loop. It plays only while on screen and never when the visitor
 * asks for reduced motion (the poster stays). It is never the LCP element: the hero
 * is a prioritized image, and videos only load metadata until they play.
 */
export function AmbientVideo({ video, className = "" }: { video: SiteVideo; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => {
      if (visible && !reduce.matches) element.play().catch(() => undefined);
      else element.pause();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        update();
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    reduce.addEventListener("change", update);
    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", update);
      element.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      className={`h-full w-full object-cover ${className}`}
      src={video.src}
      poster={video.poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}
