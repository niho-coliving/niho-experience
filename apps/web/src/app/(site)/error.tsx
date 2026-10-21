"use client";

import { ErrorState } from "@/components/States";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} />;
}
