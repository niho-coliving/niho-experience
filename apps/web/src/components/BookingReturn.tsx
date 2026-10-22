import { HandIcon, type HandIconName } from "./HandIcon";
import { ButtonLink } from "./ui";

/** The kind of booking NIHO puts on the return URL (`?type=instant|approval`). Anything else, or nothing, is the neutral page. */
export type BookingReturnType = "instant" | "approval";

export function readReturnType(value: string | string[] | undefined): BookingReturnType | null {
  return value === "instant" || value === "approval" ? value : null;
}

type Step = { icon: HandIconName; title: string; text: string };

/**
 * What happens after payment. NIHO owns payment, confirmation and the booking status; this page never says a booking is
 * complete or paid (a return URL proves nothing). It only says what to expect next, and its wording may follow the kind of
 * booking (a fixed word on the URL, never free text, so nobody can put their own wording on this page).
 */
export function BookingReturn({ type, showReview }: { type: BookingReturnType | null; showReview: boolean }) {
  const approval = type === "approval";
  const eyebrow = type ? "thank you" : "almost there";
  const heading = approval ? "The host will review your request" : type ? "Check your email for your booking" : "Check your email";
  const lead = approval
    ? "You are charged only if they accept. NIHO emails you either way."
    : type
      ? "NIHO confirms your booking by email, with a link to your booking."
      : "NIHO sends your booking link by email. If the host needs to approve your request, the email says so.";
  const steps: Step[] = [
    { icon: "mail", title: "Email from NIHO", text: approval ? "It tells you the request is with the host. Another follows when they answer." : "Your booking link, with the meeting details and a way to add the date to your calendar." },
    { icon: "cal", title: "A reminder the day before", text: "A short email with the details you need." },
    { icon: "pin", title: "Meet your host", text: "On the day, open your booking link for the meeting details." },
    ...(showReview ? [{ icon: "chat" as const, title: "Share how it went", text: "After the experience, NIHO asks how it was." }] : []),
  ];

  return (
    <div className="container-page max-w-2xl py-12">
      <p className="hand text-[1.75rem]">{eyebrow}</p>
      <h1 className="mt-1 text-3xl">{heading}</h1>
      <p className="mt-3 text-ink-soft">{lead}</p>
      <h2 className="mt-9 font-sans text-sm font-extrabold tracking-[0.04em] text-muted uppercase">What happens next</h2>
      <ol className="mt-4">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? <span aria-hidden className="absolute top-11 bottom-0 left-[19px] border-l-2 border-dashed border-line-strong" /> : null}
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-pale">
              <HandIcon name={step.icon} className="size-6 text-moss" />
            </span>
            <div className="min-w-0 pt-1">
              <b className="block font-extrabold">{step.title}</b>
              <span className="block text-[0.9375rem] text-ink-soft">{step.text}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted">This page can&apos;t show your booking status. The link in NIHO&apos;s email can.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/help">Didn&apos;t get the email?</ButtonLink>
        <ButtonLink href="/experiences" variant="secondary">Browse experiences</ButtonLink>
      </div>
    </div>
  );
}
