"use client";

import { useEffect, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type RefObject, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { computeExpectedTotalYen, createClientRequestKey, type CheckoutAnswer, type ExperienceApiClient, type ExperienceCheckoutRequest, type ExperienceOffer } from "@niho-experience/api-client";
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
import { BookingQuestion } from "./BookingQuestion";

export type BookingDraft = { guestName: string; guestEmail: string; note: string; answerSets: Record<string, Record<string, string | string[]>> };
export type CheckoutAttempt = { signature: string; key: string };

export function BookingForm({ api, apiUnavailable, experience, offer, selection, preview, attributionEnabled, publicApiVersion, onExperienceRefresh, draft, onDraftChange, attemptRef, onBack, titleAs = "h1" }: { api: ExperienceApiClient | null; apiUnavailable: boolean; experience: ExperienceDetailForSite; offer: ExperienceOffer; selection: BookingSelection; preview: boolean; attributionEnabled: boolean; publicApiVersion: "1.0" | "1.1" | "1.2"; onExperienceRefresh: (experience: ExperienceDetailForSite) => boolean; draft: BookingDraft; onDraftChange: Dispatch<SetStateAction<BookingDraft>>; attemptRef: RefObject<CheckoutAttempt | null>; onBack: () => void; titleAs?: "h1" | "p" }) {
  const router = useRouter();
  const { guestName, guestEmail, note } = draft;
  const questionSet = `${offer.id}:${offer.bookingQuestionsFingerprint}`;
  const answers = draft.answerSets[questionSet] ?? {};
  const [refreshing, setRefreshing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [availabilityOk, setAvailabilityOk] = useState(false);
  const [checking, setChecking] = useState(true);
  const [needsFreshDetails, setNeedsFreshDetails] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const viewTracked = useRef(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const total = computeExpectedTotalYen(offer.pricing, selection.adultCount, selection.childCount);
  const headCount = selection.adultCount + selection.childCount;
  const selectionValid = Number.isInteger(selection.adultCount) && Number.isInteger(selection.childCount) && selection.adultCount >= 0 && selection.childCount >= 0 && headCount >= offer.minimumParticipants && headCount <= offer.maxPartySize && (selection.childCount === 0 || !!offer.pricing.child) && (!offer.pricing.child?.adultRequired || selection.childCount === 0 || selection.adultCount > 0);
  const retrySecondsRemaining = retryUntil === null ? 0 : Math.max(0, Math.ceil((retryUntil - clockNow) / 1000));
  const checkingAvailability = checking && !apiUnavailable;
  const sellerLegalUrl = safeHttpsUrl(experience.seller.legalNoticeUrl);

  useEffect(() => {
    if (!api) return;
    let active = true;
    api.getAvailability(experience.slug, { offerId: offer.id }).then((result) => {
      if (!active) return;
      const occurrence = result.ok ? result.data.occurrences.find((item) => item.offerId === offer.id && item.date === selection.date) : undefined;
      setAvailabilityOk(selectionValid && !!occurrence?.bookable && occurrence.seatsLeft >= headCount);
      setChecking(false);
    }).catch(() => { if (active) { setAvailabilityOk(false); setChecking(false); } });
    return () => { active = false; };
  }, [api, experience.slug, offer.id, selection.date, headCount, selectionValid]);
  useEffect(() => {
    if (!problem) return;
    const id = invalidField === "consent" || invalidField === "consent.agreedVersion" ? "booking-consent"
      : ["guestName", "guestEmail", "note"].includes(invalidField) ? `booking-${invalidField}`
      : offer.bookingQuestions.some((question) => question.id === invalidField) ? `question-${invalidField}` : null;
    const control = id ? document.getElementById(id) : null;
    (control ?? alertRef.current)?.focus();
  }, [problem, invalidField, offer.bookingQuestions]);
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
    if (checkingAvailability || viewTracked.current) return;
    viewTracked.current = true;
    if (availabilityOk && total !== null) track("booking_form_view", { experience: experience.slug, guests: headCount, total_jpy: total });
    else track("booking_unavailable", { experience: experience.slug, error_code: "unavailable" });
  }, [availabilityOk, checkingAvailability, experience.slug, headCount, total]);

  function updateAnswer(id: string, value: string | string[]) { onDraftChange((current) => ({ ...current, answerSets: { ...current.answerSets, [questionSet]: { ...current.answerSets[questionSet], [id]: value } } })); }
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
    if (submitting || checkingAvailability || needsFreshDetails || retrySecondsRemaining > 0 || !api || total === null || !availabilityOk) return;
    setProblem(""); setInvalidField("");
    if (!guestName.trim()) { setProblem("Please enter your full name."); setInvalidField("guestName"); return; }
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
    if (attemptRef.current?.signature !== signature) attemptRef.current = { signature, key: createClientRequestKey() };
    const body: ExperienceCheckoutRequest = { ...draft, clientRequestKey: attemptRef.current.key };
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
      if (result.error.code === "REQUEST_MISMATCH") attemptRef.current = null;
      if (["CONSENT_OUTDATED", "QUESTIONS_CHANGED", "PRICE_CHANGED"].includes(result.error.code)) setNeedsFreshDetails(true);
      if (["OCCURRENCE_INVALID", "FULL", "UNAVAILABLE"].includes(result.error.code)) setAvailabilityOk(false);
    } else {
      track("checkout_error", { experience: experience.slug, error_code: result.kind === "network_error" ? "unavailable" : "unexpected_response" });
      setProblem(result.kind === "network_error" ? "We couldn't reach checkout. Your details are still here; please try again." : "Checkout could not be started. Please try again.");
    }
  }

  async function refreshLatestDetails() {
    if (!api || refreshing) return;
    setRefreshing(true);
    setProblem("");
    try {
      const result = publicApiVersion === "1.0"
        ? await api.getExperience(experience.slug)
        : await api.getExperienceV11(experience.slug);
      if (!result.ok || result.data.experience.slug !== experience.slug) {
        setProblem("We couldn't load the latest details. Please try again.");
        return;
      }
      if (!onExperienceRefresh(result.data.experience)) {
        setProblem("The latest booking details are not available yet. Please try again.");
      }
    } catch {
      setProblem("We couldn't load the latest details. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }

  const approval = offer.acceptanceMode === "APPROVAL";
  const day = dayOption(selection.date);
  const when = `${day.label} · ${formatClock(offer.startTime)}`;
  const guests = `${selection.adultCount} adult${selection.adultCount === 1 ? "" : "s"}${selection.childCount ? `, ${selection.childCount} child${selection.childCount === 1 ? "" : "ren"}` : ""}`;
  const optional = <small className="font-bold text-muted">(optional)</small>;

  return <form onSubmit={submit}>
    <BookingSummaryCard experience={experience} offer={offer} titleAs={titleAs} />
    <button type="button" onClick={onBack} className="link-leaf mt-3 text-sm">Change date or guest count</button>
    <div className="mt-5 space-y-4 empty:hidden">
      {checkingAvailability ? <p role="status">Checking this date again…</p> : needsFreshDetails ? <Notice role="alert" tone="warn" title="Review the latest details">The price, questions or booking terms changed. <button type="button" disabled={refreshing || !api} onClick={refreshLatestDetails} className="font-bold text-moss underline">{refreshing ? "Refreshing…" : "Reload the experience"}</button> to review them and agree again. Your contact details stay on this page.</Notice> : !availabilityOk ? <Notice role="alert" tone="warn" title="This date needs another look">Nothing has been charged. <button type="button" onClick={onBack} className="font-bold text-moss underline">Check dates again</button> to see the latest availability.</Notice> : null}
      {problem ? <div id="booking-problem" ref={alertRef} tabIndex={-1} className="outline-none"><Notice role="alert" tone="danger" title="Please check your booking">{problem}</Notice></div> : null}
    </div>

    <section aria-labelledby="details-heading">
      <StepHeading id="details-heading" step={3}>Your details</StepHeading>
      <p className="text-sm text-muted">No account is needed. NIHO sends confirmation and meeting details to your email.</p>
      <label className={fieldLabelClass}>Full name<input id="booking-guestName" name="guestName" aria-invalid={invalidField === "guestName" || undefined} aria-describedby={invalidField === "guestName" ? "booking-problem" : undefined} autoComplete="name" required maxLength={100} value={guestName} onChange={(event) => onDraftChange((current) => ({ ...current, guestName: event.target.value }))} className={fieldInputClass} /></label>
      <label className={fieldLabelClass}>Email<input id="booking-guestEmail" name="guestEmail" aria-invalid={invalidField === "guestEmail" || undefined} aria-describedby={invalidField === "guestEmail" ? "booking-problem" : undefined} type="email" inputMode="email" autoComplete="email" required maxLength={254} value={guestEmail} onChange={(event) => onDraftChange((current) => ({ ...current, guestEmail: event.target.value }))} className={fieldInputClass} /></label>
      {offer.bookingQuestions.length ? <fieldset className="mt-6"><legend className="font-sans text-sm font-extrabold tracking-[0.02em] text-muted">Questions from your host</legend>{offer.bookingQuestions.map((question) => (
        <BookingQuestion key={question.id} question={question} value={answers[question.id]} invalid={invalidField === question.id} onChange={(value) => updateAnswer(question.id, value)} />
      ))}</fieldset> : null}
      <label className={fieldLabelClass}>Anything else for your hosts? {optional}<textarea id="booking-note" name="note" aria-invalid={invalidField === "note" || undefined} aria-describedby={invalidField === "note" ? "booking-problem" : undefined} rows={3} maxLength={500} value={note} onChange={(event) => onDraftChange((current) => ({ ...current, note: event.target.value }))} className={`${fieldInputClass} min-h-[84px] resize-y`} /></label>
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
        <label className={`mt-3.5 flex items-start gap-3 text-[0.90625rem] ${invalidField === "consent" ? "text-danger" : "text-ink-soft"}`}><input id="booking-consent" type="checkbox" aria-describedby={invalidField === "consent" || invalidField === "consent.agreedVersion" ? "booking-problem" : undefined} checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required aria-invalid={invalidField === "consent" || undefined} className="mt-px size-[22px] shrink-0 accent-moss" /><span>I have reviewed the total, seller, cancellation policy and linked terms, and agree to version {experience.booking.consentVersion}.</span></label>
      </div>
    </section>
    <p className="mt-6 text-center text-sm text-muted">{preview ? "Preview only: no card details or payment." : "NIHO will confirm your booking after payment. No charge is made on this page."}</p>

    <BookingBar
      stack
      total={<><b className="text-lg font-extrabold text-ink">{total === null ? "Unavailable" : formatYen(total)}</b> total</>}
      line={when}
      action={<button type="submit" disabled={submitting || checkingAvailability || !api || !availabilityOk || needsFreshDetails || retrySecondsRemaining > 0 || total === null} aria-busy={submitting} className={buttonClass("primary", "min-h-[46px] w-full shrink-0 px-6 min-[30rem]:w-auto")}>{retrySecondsRemaining > 0 ? "Please wait…" : submitting ? "Preparing checkout…" : approval ? "Request to book" : preview ? "Continue to mock payment" : "Continue to secure payment"}</button>}
    />
  </form>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 py-[5px]"><dt className="text-ink-soft">{label}</dt><dd className="text-right font-extrabold">{value}</dd></div>;
}

function Note({ icon, id, children }: { icon: HandIconName; id?: string; children: ReactNode }) {
  return <p id={id} className="mt-3.5 flex items-start gap-2.5 text-[0.90625rem] text-ink-soft"><HandIcon name={icon} className="size-[26px] shrink-0 text-moss [stroke-width:1.6]" /><span>{children}</span></p>;
}
