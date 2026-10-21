"use client";

import { ErrorState } from "@/components/States";

export default function ExperiencesError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="We couldn't load experiences" onRetry={reset} />;
}
