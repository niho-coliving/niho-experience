"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { computeExpectedTotalYen, createClientRequestKey, type CheckoutAnswer, type ExperienceApiClient, type ExperienceCheckoutRequest, type ExperienceOffer } from "@niho-experience/api-client";
import { getBrowserApi } from "@/lib/browser-api";
import { dayOption } from "@/lib/date-filter";
import { formatYen } from "@/lib/format";
import { formatClock } from "@/lib/schedule";
import { safeHttpsUrl } from "@/lib/safe-url";
import { track } from "@/lib/analytics";
import { readBookingAttribution } from "@/lib/booking-attribution";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { checkoutErrorCopy } from "./States";
import { BookingBar, BookingSummaryCard, StepHeading, fieldInputClass, fieldLabelClass } from "./BookingParts";
import { HandIcon, type HandIconName } from "./HandIcon";
import { policyTitle } from "./Policy";
import { Notice, buttonClass } from "./ui";
import type { BookingSelection } from "./SlotPicker";

export function BookingForm({ experience, offer, selection, preview, nihoWebOrigin, attributionEnabled, onBack, titleAs = "h1" }: { experience: ExperienceDetailForSite; offer: ExperienceOffer; selection: BookingSelection; preview: boolean; nihoWebOrigin: string; attributionEnabled: boolean; onBack: () => void; titleAs?: "h1" | "p" }) {
  const router = useRouter();
  const [api, setApi] = useState<ExperienceApiClient | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [note, setNote] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [availabilityOk, setAvailabilityOk] = useState(false);
  const [checking, setChecking] = useState(true);
  const [needsFreshDetails, setNeedsFreshDetails] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const viewTracked = useRef(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const total = computeExpectedTotalYen(offer.pricing, selection.adultCount, selection.childCount);
  const headCount = selection.adultCount + selection.childCount;
  const retrySecondsRemaining = retryUntil === null ? 0 : Math.max(0, Math.ceil((retryUntil - clockNow) / 1000));
  const sellerLegalUrl = safeHttpsUrl(experience.seller.legalNoticeUrl);

  useEffect(() => {
    let active = true;
    getBrowserApi(preview, nihoWebOrigin).then((client) => { if (active) setApi(client); }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [preview, nihoWebOrigin]);

  useEffect(() => {
    if (!api) return;
    let active = true;
    api.getAvailability(experience.slug, { offerId: offer.id }).then((result) => {
      if (!active) return;
      const occurrence = result.ok ? result.data.occurrences.find((item) => item.offerId === offer.id && item.date === selection.date) : undefined;
      setAvailabilityOk(!!occurrence?.bookable && occurrence.seatsLeft >= headCount);
      setChecking(false);
    }).catch(() => { if (active) { setAvailabilityOk(false); setChecking(false); } });
    return () => { active = false; };
  }, [api, experience.slug, offer.id, selection.date, headCount]);
  useEffect(() => { if (problem) alertRef.current?.focus(); }, [problem]);
  useEffect(() => {
    if (retryUntil === null) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      if (now >= retryUntil) setRetryUntil(null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);
  useEffect(() => {
    if (checking || viewTracked.current) return;
    viewTracked.current = true;
    if (availabilityOk && total !== null) track("booking_form_view", { experience: experience.slug, guests: headCount, total_jpy: total });
    else track("booking_unavailable", { experience: experience.slug, error_code: "unavailable" });
  }, [availabilityOk, checking, experience.slug, headCount, total]);

  function updateAnswer(id: string, value: string | string[]) { setAnswers((current) => ({ ...current, [id]: value })); }
  function collectAnswers(): CheckoutAnswer[] {
    const collected: CheckoutAnswer[] = [];
    for (const question of offer.bookingQuestions) {
      const value = answers[question.id];
      if (typeof value === "string" && value.trim()) collected.push({ questionId: question.id, text: value.trim() });
      if (Array.isArray(value) && value.length) collected.push({ questionId: question.id, optionIds: value });
    }
    return collected;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || checking || needsFreshDetails || retrySecondsRemaining > 0 || !api || total === null || !availabilityOk) return;
    setProblem(""); setInvalidField("");
    const answered = collectAnswers();
    const missing = offer.bookingQuestions.find((question) => question.required && !answered.some((answer) => answer.questionId === question.id));
    if (missing) { setProblem("Please answer the required question."); setInvalidField(missing.id); return; }
    if (!agreed) { setProblem("Please agree to the booking terms."); setInvalidField("consent"); return; }
    const draft: Omit<ExperienceCheckoutRequest, "clientRequestKey"> = {
      offerId: offer.id, occurrenceDate: selection.date, adultCount: selection.adultCount, childCount: selection.childCount,
      expectedTotalYen: total, bookingQuestionsFingerprint: offer.bookingQuestionsFingerprint,
      guestName: guestName.trim(), guestEmail: guestEmail.trim(), ...(note.trim() ? { note: note.trim() } : {}),
      answers: answered, consent: { agreedVersion: experience.booking.consentVersion },
      ...(attributionEnabled ? readBookingAttribution(navigator.doNotTrack) : {}),
    };
    const signature = JSON.stringify(draft);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: createClientRequestKey() };
    const body: ExperienceCheckoutRequest = { ...draft, clientRequestKey: attempt.current.key };
    setSubmitting(true);
    track("checkout_start", { experience: experience.slug, guests: headCount, total_jpy: total });
    let result: Awaited<ReturnType<ExperienceApiClient["startCheckout"]>>;
    try { result = await api.startCheckout(experience.slug, body); }
    catch {
      setSubmitting(false);
      setProblem("We couldn't reach checkout. Your details are still here; please try again.");
      return;
    }
    setSubmitting(false);
    if (result.ok) {
      if (preview) {
        const { isMockCheckoutUrl } = await import("@niho-experience/api-client/mock");
        if (!isMockCheckoutUrl(result.checkoutUrl)) { setProblem("The preview checkout returned an unexpected address."); return; }
        router.push("/preview/checkout");
      } else window.location.assign(result.checkoutUrl);
      return;
    }
    if (result.kind === "rejected") {
      const errorCode = result.error.code === "INPUT_INVALID" || result.error.code === "ANSWERS_INVALID" ? "invalid_contact" : result.error.code === "FULL" ? "slot_sold_out" : result.error.code === "UNAVAILABLE" ? "unavailable" : result.error.code.toLowerCase();
      track("checkout_error", { experience: experience.slug, error_code: errorCode });
      const retryAfter = result.error.code === "RATE_LIMITED" ? result.retryAfterSeconds : null;
      const now = Date.now();
      setClockNow(now);
      setRetryUntil(retryAfter ? now + retryAfter * 1000 : null);
      setProblem(retryAfter
        ? `Too many attempts. Try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`
        : checkoutErrorCopy[result.error.code]);
      setInvalidField(result.error.questionId ?? result.error.field ?? "");
      if (result.error.code === "REQUEST_MISMATCH") attempt.current = null;
      if (["CONSENT_OUTDATED", "QUESTIONS_CHANGED", "PRICE_CHANGED"].includes(result.error.code)) setNeedsFreshDetails(true);
      if (["OCCURRENCE_INVALID", "FULL", "UNAVAILABLE"].includes(result.error.code)) setAvailabilityOk(false);
    } else {
      track("checkout_error", { experience: experience.slug, error_code: result.kind === "network_error" ? "unavailable" : "unexpected_response" });
      setProblem(result.kind === "network_error" ? "We couldn't reach checkout. Your details are still here; please try again." : "Checkout could not be started. Please try again.");
    }
  }

  const approval = offer.acceptanceMode === "APPROVAL";
  const day = dayOption(selection.date);
  const when = `${day.label} · ${formatClock(offer.startTime)}`;
  const guests = `${selection.adultCount} adult${selection.adultCount === 1 ? "" : "s"}${selection.childCount ? `, ${selection.childCount} child${selection.childCount === 1 ? "" : "ren"}` : ""}`;
  const answerText = (id: string) => (typeof answers[id] === "string" ? (answers[id] as string) : "");
  const optional = <small className="font-bold text-muted">(optional)</small>;

  return <form onSubmit={submit}>
    <BookingSummaryCard experience={experience} offer={offer} titleAs={titleAs} />
    <button type="button" onClick={onBack} className="link-leaf mt-3 text-sm">Change date or guest count</button>
    <div className="mt-5 space-y-4 empty:hidden">
      {checking ? <p role="status">Checking this date again…</p> : needsFreshDetails ? <Notice role="alert" tone="warn" title="Review the latest details">The price, questions or booking terms changed. <a href={`/experiences/${experience.slug}`} className="font-bold text-moss underline">Reload the experience</a> before choosing a date and agreeing again.</Notice> : !availabilityOk ? <Notice role="alert" tone="warn" title="This date needs another look">Nothing has been charged. <button type="button" onClick={onBack} className="font-bold text-moss underline">Check dates again</button> to see the latest availability.</Notice> : null}
      {problem ? <div ref={alertRef} tabIndex={-1} className="outline-none"><Notice role="alert" tone="danger" title="Please check your booking">{problem}</Notice></div> : null}
    </div>

    <section aria-labelledby="details-heading">
      <StepHeading id="details-heading" step={3}>Your details</StepHeading>
      <p className="text-sm text-muted">No account is needed. NIHO sends confirmation and meeting details to your email.</p>
      <label className={fieldLabelClass}>Full name<input name="guestName" autoComplete="name" required maxLength={100} value={guestName} onChange={(event) => setGuestName(event.target.value)} className={fieldInputClass} /></label>
      <label className={fieldLabelClass}>Email<input name="guestEmail" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} className={fieldInputClass} /></label>
      {offer.bookingQuestions.length ? <fieldset className="mt-6"><legend className="font-sans text-sm font-extrabold tracking-[0.02em] text-muted">Questions from your host</legend>{offer.bookingQuestions.map((question) => <div key={question.id}>
        <label htmlFor={`question-${question.id}`} className={fieldLabelClass}>{question.prompt}{question.required ? " *" : <> {optional}</>}</label>{question.description ? <p className="mt-0.5 text-[0.8125rem] text-muted">{question.description}</p> : null}
        {question.inputType === "SHORT_TEXT" || question.inputType === "LONG_TEXT" ? question.inputType === "LONG_TEXT" ? <textarea id={`question-${question.id}`} maxLength={1000} value={answerText(question.id)} onChange={(event) => updateAnswer(question.id, event.target.value)} aria-invalid={invalidField === question.id || undefined} className={`${fieldInputClass} min-h-[84px] resize-y`} /> : <input id={`question-${question.id}`} maxLength={200} value={answerText(question.id)} onChange={(event) => updateAnswer(question.id, event.target.value)} aria-invalid={invalidField === question.id || undefined} className={fieldInputClass} /> :
        question.inputType === "SINGLE_SELECT" ? <select id={`question-${question.id}`} value={Array.isArray(answers[question.id]) ? (answers[question.id] as string[])[0] ?? "" : ""} onChange={(event) => updateAnswer(question.id, event.target.value ? [event.target.value] : [])} aria-invalid={invalidField === question.id || undefined} className={fieldInputClass}><option value="">Choose an answer</option>{question.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select> :
        <div id={`question-${question.id}`} className="mt-2 space-y-2">{question.options.map((option) => { const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []; return <label key={option.id} className="flex min-h-11 items-center gap-2.5"><input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => updateAnswer(question.id, event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))} className="size-5 accent-moss" />{option.label}</label>; })}</div>}
      </div>)}</fieldset> : null}
      <label className={fieldLabelClass}>Anything else for your hosts? {optional}<textarea name="note" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className={`${fieldInputClass} min-h-[84px] resize-y`} /></label>
    </section>

    <section aria-labelledby="check-heading">
      <StepHeading id="check-heading" step={4}>{approval ? "Check and send" : "Check and pay"}</StepHeading>
      <dl className="rounded-[22px] bg-sand px-[18px] py-4 text-[0.9375rem]">
        <Row label="Date" value={`${when} JST`} />
        <Row label="Guests" value={guests} />
        <Row label="Adults" value={`${selection.adultCount} × ${formatYen(offer.pricing.adultPriceYen)}`} />
        {selection.childCount && offer.pricing.child ? <Row label="Children" value={`${selection.childCount} × ${formatYen(offer.pricing.child.priceYen)}`} /> : null}
        <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line-strong pt-3">
          <dt className="text-ink-soft">Total<small className="block text-[0.78125rem] font-bold text-muted">Japanese yen, tax included. No additional fee.</small></dt>
          <dd className="text-xl font-extrabold">{total === null ? "Unavailable" : formatYen(total)}</dd>
        </div>
      </dl>
      <Note icon="umbrella" id="terms"><b className="font-extrabold text-ink">{policyTitle(offer.cancellationPolicy)}.</b> This policy applies to the option and date you select.</Note>
      <Note icon={approval ? "people" : "check"}>{approval ? "Your card is authorized, then the host reviews your request. You are charged only if approved." : "Your booking is confirmed after payment is completed by NIHO."}</Note>
      <Note icon="card">Secure payment by Stripe. Sold by <strong className="text-ink">{experience.seller.displayName}</strong>.{sellerLegalUrl ? <> <a href={sellerLegalUrl} className="font-extrabold text-ink underline" rel="noopener noreferrer">Seller information</a></> : null}</Note>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm text-ink-soft">Booking terms: {experience.booking.legalDocuments.map((doc, index) => { const url = safeHttpsUrl(doc.url); return url ? <span key={doc.kind}>{index ? " · " : null}<a href={url} target="_blank" rel="noopener noreferrer" className="font-extrabold text-ink underline">{doc.kind === "COMMERCIAL_TRANSACTIONS" ? "Seller information" : doc.kind === "PRIVACY" ? "Privacy policy" : "Terms of service"}</a></span> : null; })}</p>
        <label className={`mt-3.5 flex items-start gap-3 text-[0.90625rem] ${invalidField === "consent" ? "text-danger" : "text-ink-soft"}`}><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required aria-invalid={invalidField === "consent" || undefined} className="mt-px size-[22px] shrink-0 accent-moss" /><span>I have reviewed the total, seller, cancellation policy and linked terms, and agree to version {experience.booking.consentVersion}.</span></label>
      </div>
    </section>
    <p className="mt-6 text-center text-sm text-muted">{preview ? "Preview only: no card details or payment." : "NIHO will confirm your booking after payment. No charge is made on this page."}</p>

    <BookingBar
      stack
      total={<><b className="text-lg font-extrabold text-ink">{total === null ? "Unavailable" : formatYen(total)}</b> total</>}
      line={when}
      action={<button type="submit" disabled={submitting || checking || !availabilityOk || needsFreshDetails || retrySecondsRemaining > 0 || total === null} aria-busy={submitting} className={buttonClass("primary", "min-h-[46px] w-full shrink-0 px-6 min-[30rem]:w-auto")}>{retrySecondsRemaining > 0 ? "Please wait…" : submitting ? "Preparing checkout…" : approval ? "Request to book" : preview ? "Continue to mock payment" : "Continue to secure payment"}</button>}
    />
  </form>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 py-[5px]"><dt className="text-ink-soft">{label}</dt><dd className="text-right font-extrabold">{value}</dd></div>;
}

function Note({ icon, id, children }: { icon: HandIconName; id?: string; children: ReactNode }) {
  return <p id={id} className="mt-3.5 flex items-start gap-2.5 text-[0.90625rem] text-ink-soft"><HandIcon name={icon} className="size-[26px] shrink-0 text-moss [stroke-width:1.6]" /><span>{children}</span></p>;
}
