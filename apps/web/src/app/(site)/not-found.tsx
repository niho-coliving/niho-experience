import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container-page max-w-2xl py-20 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">We couldn&apos;t find that page</h1>
      <p className="mt-4 text-ink-soft">The experience may have ended or the link may be mistyped.</p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href="/experiences">See all experiences</ButtonLink>
      </div>
    </div>
  );
}
