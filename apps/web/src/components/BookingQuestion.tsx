import type { ExperienceOffer } from "@niho-experience/api-client";
import { fieldInputClass, fieldLabelClass } from "./BookingParts";

export function BookingQuestion({ question, value, invalid, onChange }: {
  question: ExperienceOffer["bookingQuestions"][number];
  value: string | string[] | undefined;
  invalid: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const id = `question-${question.id}`;
  const descriptionId = `${id}-description`;
  const describedBy = [question.description ? descriptionId : null, invalid ? "booking-problem" : null].filter(Boolean).join(" ") || undefined;
  const label = <>{question.prompt}{question.required ? <> *<span className="sr-only"> (required)</span></> : <> <small className="font-bold text-muted">(optional)</small></>}</>;
  const description = question.description ? <p id={descriptionId} className="mt-0.5 text-[0.8125rem] text-muted">{question.description}</p> : null;
  const inputProps = { id, "aria-invalid": invalid || undefined, "aria-describedby": describedBy, "aria-required": question.required || undefined, className: fieldInputClass };
  const selected = Array.isArray(value) ? value : [];

  if (question.inputType === "MULTI_SELECT") return (
    <fieldset id={id} tabIndex={-1} aria-invalid={invalid || undefined} aria-describedby={describedBy} className="min-w-0">
      <legend className={fieldLabelClass}>{label}</legend>
      {description}
      <div className="mt-2 space-y-2">{question.options.map((option) => (
        <label key={option.id} className="flex min-h-11 items-center gap-2.5">
          <input type="checkbox" checked={selected.includes(option.id)} onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))} className="size-5 accent-moss" />
          {option.label}
        </label>
      ))}</div>
    </fieldset>
  );
  return <div>
    <label htmlFor={id} className={fieldLabelClass}>{label}</label>
    {description}
    {question.inputType === "SINGLE_SELECT" ? (
      <select {...inputProps} value={selected[0] ?? ""} onChange={(event) => onChange(event.target.value ? [event.target.value] : [])}>
        <option value="">Choose an answer</option>
        {question.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    ) : question.inputType === "LONG_TEXT" ? (
      <textarea {...inputProps} className={`${fieldInputClass} min-h-[84px] resize-y`} maxLength={1000} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />
    ) : (
      <input {...inputProps} maxLength={200} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />
    )}
  </div>;
}
