import { ExperienceGridSkeleton } from "@/components/ExperienceCard";

export default function Loading() {
  return (
    <div className="container-page pt-8 sm:pt-12" role="status" aria-label="Loading experiences">
      <div className="max-w-2xl space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-sand" />
        <div className="h-12 w-64 animate-pulse rounded bg-sand" />
      </div>
      <div className="mt-8 h-32 animate-pulse rounded-[var(--radius-card)] bg-sand" />
      <div className="mt-12">
        <ExperienceGridSkeleton />
      </div>
    </div>
  );
}
