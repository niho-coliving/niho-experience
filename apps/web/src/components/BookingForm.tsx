"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { computeExpectedTotalYen, createClientRequestKey, type CheckoutAnswer, type ExperienceApiClient, type ExperienceDetail, type ExperienceCheckoutRequest, type ExperienceOffer } from "@niho-experience/api-client";
import { isMockCheckoutUrl } from "@niho-experience/api-client/mock";
import { getBrowserApi } from "@/lib/browser-api";
import { formatLongDay, formatYen } from "@/lib/format";
import { safeHttpsUrl } from "@/lib/safe-url";
import { track } from "@/lib/analytics";
import { checkoutErrorCopy } from "./States";
import { PolicyDetails } from "./Policy";
import { Notice, buttonClass } from "./ui";
import type { BookingSelection } from "./SlotPicker";

export function BookingForm({ experience, offer, selection, preview, nihoWebOrigin, onBack }: { experience: ExperienceDetail; offer: ExperienceOffer; selection: BookingSelection; preview: boolean; nihoWebOrigin: string; onBack: () => void }) {
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
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const viewTracked = useRef(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const total = computeExpectedTotalYen(offer.pricing, selection.adultCount, selection.childCount);
  const headCount = selection.adultCount + selection.childCount;
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
    });
    return () => { active = false; };
  }, [api, experience.slug, offer.id, selection.date, headCount]);
  useEffect(() => { if (problem) alertRef.current?.focus(); }, [problem]);
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
    if (submitting || !api || total === null || !availabilityOk) return;
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
    };
    const signature = JSON.stringify(draft);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: createClientRequestKey() };
    const body: ExperienceCheckoutRequest = { ...draft, clientRequestKey: attempt.current.key };
    setSubmitting(true);
    const result = await api.startCheckout(experience.slug, body);
    setSubmitting(false);
    if (result.ok) {
      if (preview) {
        if (!isMockCheckoutUrl(result.checkoutUrl)) { setProblem("The preview checkout returned an unexpected address."); return; }
        router.push("/preview/checkout");
      } else window.location.assign(result.checkoutUrl);
      return;
    }
    if (result.kind === "rejected") {
      const errorCode = result.error.code === "INPUT_INVALID" || result.error.code === "ANSWERS_INVALID" ? "invalid_contact" : result.error.code === "FULL" ? "slot_sold_out" : result.error.code === "UNAVAILABLE" ? "unavailable" : result.error.code.toLowerCase();
      track("checkout_error", { experience: experience.slug, error_code: errorCode });
      setProblem(checkoutErrorCopy[result.error.code]);
      setInvalidField(result.error.questionId ?? result.error.field ?? "");
      if (result.error.code === "REQUEST_MISMATCH") attempt.current = null;
      if (["CONSENT_OUTDATED", "QUESTIONS_CHANGED", "PRICE_CHANGED", "OCCURRENCE_INVALID", "FULL", "UNAVAILABLE"].includes(result.error.code)) setAvailabilityOk(false);
    } else {
      track("checkout_error", { experience: experience.slug, error_code: result.kind === "network_error" ? "unavailable" : "unexpected_response" });
      setProblem(result.kind === "network_error" ? "We couldn't reach checkout. Your details are still here; please try again." : "Checkout could not be started. Please try again.");
    }
  }

  return <form onSubmit={submit} className="space-y-6">
    <button type="button" onClick={onBack} className="font-bold text-moss underline">← Change date or guest count</button>
    <div className="rounded-[var(--radius-card)] border border-line bg-sand p-4"><h2 className="text-xl">Your booking</h2><p className="mt-2 font-bold">{experience.title} · {offer.name}</p><p>{formatLongDay(`${selection.date}T12:00:00+09:00`)} · {offer.startTime} JST</p><p>{selection.adultCount} adult{selection.adultCount === 1 ? "" : "s"}{selection.childCount ? ` · ${selection.childCount} child${selection.childCount === 1 ? "" : "ren"}` : ""}</p><p className="mt-2">Adults: {selection.adultCount} × {formatYen(offer.pricing.adultPriceYen)}{selection.childCount && offer.pricing.child ? <><br />Children: {selection.childCount} × {formatYen(offer.pricing.child.priceYen)}</> : null}</p><p className="mt-2 text-2xl font-bold">Total {total === null ? "Unavailable" : formatYen(total)}</p><p className="text-sm text-muted">Japanese yen, tax included. No additional fee.</p><p className="mt-2">Sold by <strong>{experience.seller.displayName}</strong>.</p>{sellerLegalUrl ? <a href={sellerLegalUrl} className="font-bold text-moss underline" rel="noopener noreferrer">Seller information</a> : null}<p className="mt-2 text-sm">{offer.acceptanceMode === "APPROVAL" ? "Your card is authorized, then the host reviews your request. You are charged only if approved." : "Your booking is confirmed after payment is completed by NIHO."}</p></div>
    <section id="terms"><h2 className="mb-3 text-2xl">Cancellation policy</h2><PolicyDetails policy={offer.cancellationPolicy} /></section>
    {checking ? <p role="status">Checking this date again…</p> : !availabilityOk ? <Notice role="alert" tone="warn" title="This date needs another look">Please go back, check the latest availability and choose a date again.</Notice> : null}
    {problem ? <div ref={alertRef} tabIndex={-1} className="outline-none"><Notice role="alert" tone="danger" title="Please check your booking">{problem}</Notice></div> : null}
    <fieldset className="space-y-4"><legend className="mb-2 text-2xl font-semibold">Your details</legend><p className="text-sm text-muted">No account is needed. NIHO sends confirmation and meeting details to your email.</p>
      <label className="block font-bold">Full name<input name="guestName" autoComplete="name" required maxLength={100} value={guestName} onChange={(event) => setGuestName(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base" /></label>
      <label className="block font-bold">Email<input name="guestEmail" type="email" autoComplete="email" required maxLength={254} value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base" /></label>
      <label className="block font-bold">Note for your host <span className="font-normal text-muted">(optional)</span><textarea name="note" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base" /></label>
    </fieldset>
    {offer.bookingQuestions.length ? <fieldset className="space-y-4"><legend className="mb-2 text-2xl font-semibold">Questions from your host</legend>{offer.bookingQuestions.map((question) => <div key={question.id}>
      <label htmlFor={`question-${question.id}`} className="block font-bold">{question.prompt}{question.required ? " *" : " (optional)"}</label>{question.description ? <p className="text-sm text-muted">{question.description}</p> : null}
      {question.inputType === "SHORT_TEXT" || question.inputType === "LONG_TEXT" ? question.inputType === "LONG_TEXT" ? <textarea id={`question-${question.id}`} maxLength={1000} value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={(event) => updateAnswer(question.id, event.target.value)} aria-invalid={invalidField === question.id || undefined} className="mt-1 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-base" /> : <input id={`question-${question.id}`} maxLength={200} value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={(event) => updateAnswer(question.id, event.target.value)} aria-invalid={invalidField === question.id || undefined} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base" /> :
      question.inputType === "SINGLE_SELECT" ? <select id={`question-${question.id}`} value={Array.isArray(answers[question.id]) ? (answers[question.id] as string[])[0] ?? "" : ""} onChange={(event) => updateAnswer(question.id, event.target.value ? [event.target.value] : [])} aria-invalid={invalidField === question.id || undefined} className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-base"><option value="">Choose an answer</option>{question.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select> :
      <div id={`question-${question.id}`} className="mt-2 space-y-2">{question.options.map((option) => { const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []; return <label key={option.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => updateAnswer(question.id, event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))} className="size-5 accent-moss" />{option.label}</label>; })}</div>}
    </div>)}</fieldset> : null}
    <div className="rounded-xl border border-line bg-sand p-4"><p className="mb-2 font-bold">Booking terms</p><ul className="mb-3 list-disc pl-5">{experience.booking.legalDocuments.map((doc) => { const url = safeHttpsUrl(doc.url); return url ? <li key={doc.kind}><a href={url} target="_blank" rel="noopener noreferrer" className="font-bold text-moss underline">{doc.kind === "COMMERCIAL_TRANSACTIONS" ? "Seller information" : doc.kind === "PRIVACY" ? "Privacy policy" : "Terms of service"}</a></li> : null; })}</ul><label className="flex gap-3"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required aria-invalid={invalidField === "consent" || undefined} className="mt-1 size-5 shrink-0 accent-moss" /><span>I have reviewed the total, seller, cancellation policy and linked terms, and agree to version {experience.booking.consentVersion}.</span></label></div>
    <button type="submit" onClick={() => track("checkout_start", { experience: experience.slug, guests: headCount, total_jpy: total ?? undefined })} disabled={submitting || checking || !availabilityOk || total === null} aria-busy={submitting} className={buttonClass("primary", "w-full text-lg")}>{submitting ? "Preparing checkout…" : offer.acceptanceMode === "APPROVAL" ? "Request to book" : preview ? "Continue to mock payment" : "Continue to secure payment"}</button>
    <p className="text-center text-sm text-muted">{preview ? "Preview only: no card details or payment." : "NIHO will confirm your booking after payment. No charge is made on this page."}</p>
  </form>;
}
