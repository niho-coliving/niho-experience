"use server";

import { redirect } from "next/navigation";
import { GuestContactSchema, type ApiErrorCode, type CheckoutResult } from "@niho-experience/api-client";
import { getApi } from "@/lib/api";
import { isAllowedCheckoutUrl } from "@/lib/checkout";
import { config } from "@/lib/config";

export type CheckoutState = { status: "idle" } | { status: "error"; code: ApiErrorCode; fields: string[] };

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};
const optional = (value: string) => (value ? value : undefined);

/**
 * Sends the guest's contact details to the booking API and moves on to the
 * hosted payment page. Nothing here is logged, stored or put in a URL.
 */
export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const contact = GuestContactSchema.safeParse({
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    phone: optional(text(formData, "phone")),
    countryOfResidence: optional(text(formData, "country")),
    note: optional(text(formData, "note")),
  });
  const fields = contact.success ? [] : [...new Set(contact.error.issues.map((i) => String(i.path[0])))];
  if (formData.get("agree") !== "yes") fields.push("agree");
  if (!contact.success || fields.length) return { status: "error", code: "INVALID_CONTACT", fields };

  let result: CheckoutResult;
  try {
    result = await getApi().startGuestCheckout({
      quoteId: text(formData, "quoteId"),
      contact: contact.data,
      acceptedPolicyVersion: text(formData, "policyVersion"),
      idempotencyKey: text(formData, "idempotencyKey"),
    });
  } catch {
    return { status: "error", code: "UNAVAILABLE", fields: [] };
  }
  if (!result.ok) return { status: "error", code: result.error.code, fields: result.error.fields ?? [] };
  if (!isAllowedCheckoutUrl(result.checkout.redirectUrl, config.apiMode)) {
    return { status: "error", code: "UNAVAILABLE", fields: [] };
  }
  redirect(result.checkout.redirectUrl);
}
