import { ExperienceGridSkeleton } from "@/components/ExperienceCard";

export default function Loading() {
  return (
    <div className="pt-9 sm:pt-14" role="status" aria-label="Loading experiences">
      <div className="container-page space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-sand" />
        <div className="h-12 w-72 max-w-full animate-pulse rounded bg-sand" />
        <div className="h-12 w-full max-w-xl animate-pulse rounded-full bg-sand" />
      </div>
      <div className="mt-6 border-y border-line">
        <div className="container-page flex gap-2 overflow-hidden py-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-[68px] w-14 shrink-0 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      </div>
      <div className="container-page mt-16">
        <ExperienceGridSkeleton />
      </div>
    </div>
  );
}
