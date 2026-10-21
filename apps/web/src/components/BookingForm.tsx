"use client";

import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { computeExpectedTotalYen, createClientRequestKey, type CheckoutAnswer, type ExperienceApiClient, type ExperienceCheckoutRequest, type ExperienceOffer } from "@niho-experience/api-client";
import { dayOption } from "@/lib/date-filter";
import { formatDuration, formatYen } from "@/lib/format";
import { formatClock } from "@/lib/schedule";
import { safeHttpsUrl } from "@/lib/safe-url";
import { track } from "@/lib/analytics";
import { readBookingAttribution } from "@/lib/booking-attribution";
import type { ExperienceDetailForSite } from "@/lib/experience-types";
import { checkoutErrorCopy } from "./States";
import { policyTitle } from "./Policy";
import type { BookingSelection } from "./SlotPicker";
import { BookingCheckoutViewV1, EN_STATIC_COPY_V1, type BookingCheckoutViewModelV1 } from "@niho/experience-presentation/v1";
import { PRESENTATION_PRIMITIVES_V1 } from "./PresentationV1";

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
  const consentInvalid = invalidField === "consent" || invalidField === "consent.agreedVersion";

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
  async function submit() {
    if (submitting || checkingAvailability || needsFreshDetails || retrySecondsRemaining > 0 || !api || total === null || !availabilityOk) return;
    setProblem(""); setInvalidField("");
    if (!guestName.trim()) { setProblem("Please enter your full name."); setInvalidField("guestName"); return; }
    const answered = collectAnswers();
    const missing = offer.bookingQuestions.find((question) => question.required && !answered.some((answer) => answer.questionId === question.id));
    if (missing) { setProblem(EN_STATIC_COPY_V1.text("booking.requiredQuestion")); setInvalidField(missing.id); return; }
    if (!agreed) { setProblem(EN_STATIC_COPY_V1.text("booking.requiredTerms")); setInvalidField("consent"); return; }
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
      setProblem(EN_STATIC_COPY_V1.text("booking.checkoutError"));
      return;
    }
    setSubmitting(false);
    if (result.ok) {
      if (preview) {
        const { isMockCheckoutUrl } = await import("@niho-experience/api-client/mock");
        if (!isMockCheckoutUrl(result.checkoutUrl)) { setProblem(EN_STATIC_COPY_V1.text("booking.previewUnexpected")); return; }
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
        ? EN_STATIC_COPY_V1.text("booking.rateLimitedCount", { seconds: retryAfter, noun: retryAfter === 1 ? "second" : "seconds" })
        : checkoutErrorCopy[result.error.code]);
      setInvalidField(result.error.questionId ?? result.error.field ?? "");
      if (result.error.code === "REQUEST_MISMATCH") attemptRef.current = null;
      if (["CONSENT_OUTDATED", "QUESTIONS_CHANGED", "PRICE_CHANGED"].includes(result.error.code)) setNeedsFreshDetails(true);
      if (["OCCURRENCE_INVALID", "FULL", "UNAVAILABLE"].includes(result.error.code)) setAvailabilityOk(false);
    } else {
      track("checkout_error", { experience: experience.slug, error_code: result.kind === "network_error" ? "unavailable" : "unexpected_response" });
      setProblem(EN_STATIC_COPY_V1.text(result.kind === "network_error" ? "booking.checkoutError" : "booking.checkoutUnexpected"));
    }
  }

  async function refreshLatestDetails() {
    if (!api || refreshing) return;
    setRefreshing(true);
    setProblem("");
    setInvalidField("");
    try {
      const result = publicApiVersion === "1.0"
        ? await api.getExperience(experience.slug)
        : await api.getExperienceV11(experience.slug);
      if (!result.ok || result.data.experience.slug !== experience.slug) {
        setProblem(EN_STATIC_COPY_V1.text("booking.latestLoadError"));
        return;
      }
      if (!onExperienceRefresh(result.data.experience)) {
        setProblem(EN_STATIC_COPY_V1.text("booking.latestUnavailable"));
      }
    } catch {
      setProblem(EN_STATIC_COPY_V1.text("booking.latestLoadError"));
    } finally {
      setRefreshing(false);
    }
  }

  const approval = offer.acceptanceMode === "APPROVAL";
  const day = dayOption(selection.date);
  const when = `${day.label} · ${formatClock(offer.startTime)}`;
  const guests = `${selection.adultCount} adult${selection.adultCount === 1 ? "" : "s"}${selection.childCount ? `, ${selection.childCount} child${selection.childCount === 1 ? "" : "ren"}` : ""}`;
  const legalDocuments = experience.booking.legalDocuments.flatMap((doc) => { const url = safeHttpsUrl(doc.url); return url ? [{ kind: doc.kind, url }] : []; });
  const model: BookingCheckoutViewModelV1 = {
    summary: { title: experience.title, image: experience.cover ? { src: experience.cover.url, alt: "" } : null, summary: `${formatDuration(offer.durationMinutes)} · ${formatClock(offer.startTime)} JST · ${offer.name}` },
    availability: checkingAvailability ? "checking" : needsFreshDetails ? "stale" : availabilityOk ? "ready" : "unavailable",
    refreshing,
    refreshDisabled: refreshing || !api,
    problem: problem || undefined,
    guestName,
    guestEmail,
    note,
    questions: offer.bookingQuestions.map((question) => ({ id: question.id, prompt: question.prompt, description: question.description ?? undefined, required: question.required, type: question.inputType, value: answers[question.id] ?? (question.inputType === "SHORT_TEXT" || question.inputType === "LONG_TEXT" ? "" : []), options: question.options, invalid: invalidField === question.id })),
    invalidGuestName: invalidField === "guestName",
    invalidGuestEmail: invalidField === "guestEmail",
    invalidNote: invalidField === "note",
    approval,
    review: [
      { label: EN_STATIC_COPY_V1.text("booking.date"), value: `${when} JST` },
      { label: EN_STATIC_COPY_V1.text("booking.guests"), value: guests },
      { label: EN_STATIC_COPY_V1.text("booking.adults"), value: EN_STATIC_COPY_V1.text("booking.adultRow", { count: selection.adultCount, price: formatYen(offer.pricing.adultPriceYen) }) },
      ...(selection.childCount && offer.pricing.child ? [{ label: EN_STATIC_COPY_V1.text("booking.children"), value: EN_STATIC_COPY_V1.text("booking.childRow", { count: selection.childCount, price: formatYen(offer.pricing.child.priceYen) }) }] : []),
    ],
    total: total === null ? EN_STATIC_COPY_V1.text("booking.totalUnavailable") : formatYen(total),
    policyTitle: policyTitle(offer.cancellationPolicy),
    sellerName: experience.seller.displayName,
    sellerLegalUrl: sellerLegalUrl ?? undefined,
    legalDocuments,
    consentVersion: experience.booking.consentVersion,
    agreed,
    invalidConsent: consentInvalid,
    preview,
    submitting,
    retryWaiting: retrySecondsRemaining > 0,
    actionDisabled: submitting || checkingAvailability || !api || !availabilityOk || needsFreshDetails || retrySecondsRemaining > 0 || total === null,
    when,
  };
  return <BookingCheckoutViewV1 model={model} titleAs={titleAs} problemRef={alertRef} primitives={PRESENTATION_PRIMITIVES_V1} callbacks={{ onBack, onRefresh: refreshLatestDetails, onGuestNameChange: (value) => onDraftChange((current) => ({ ...current, guestName: value })), onGuestEmailChange: (value) => onDraftChange((current) => ({ ...current, guestEmail: value })), onNoteChange: (value) => onDraftChange((current) => ({ ...current, note: value })), onAnswerChange: updateAnswer, onAgreementChange: setAgreed, onSubmit: submit }} />;
}
