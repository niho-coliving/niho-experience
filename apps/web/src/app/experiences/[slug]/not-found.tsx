import { ButtonLink } from "@/components/ui";

export default function ExperienceNotFound() {
  return (
    <div className="container-page max-w-2xl py-20 text-center">
      <p className="eyebrow">Not listed</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">This experience isn&apos;t available</h1>
      <p className="mt-4 text-ink-soft">It may have ended or is no longer listed. Nothing has been booked.</p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href="/experiences">See all experiences</ButtonLink>
      </div>
    </div>
  );
}
