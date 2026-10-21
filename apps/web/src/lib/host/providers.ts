/**
 * The little the host frame (H1) needs from NIHO's provider list. H2 (#87)
 * replaces this hand-written shape with types generated from the contract.
 */

/** NIHO ids are opaque url-safe tokens; same rule as offer ids in the api-client mock. */
export const NIHO_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function nihoIdOrNull(value: unknown): string | null {
  return typeof value === "string" && NIHO_ID_PATTERN.test(value) ? value : null;
}

export type HostProviderRole = "OWNER" | "EDITOR";
export type HostProviderKind = "INDIVIDUAL" | "BUSINESS";
export type HostProviderReviewStatus = "DRAFT" | "REQUESTED" | "APPROVED" | "SUSPENDED";

export interface HostProvider {
  id: string;
  displayName: string;
  role: HostProviderRole | null;
  /*
   * The settings screen's fields (#88). Only the detail (`GET /api/experience-providers/:id`,
   * parseProviderDetail) fills them; the list leaves them out. Hand-written like the rest
   * of this file: #87 replaces them with the types generated from the contract.
   */
  kind?: HostProviderKind;
  bio?: string;
  sellerDisclosureUrl?: string | null;
  reviewStatus?: HostProviderReviewStatus;
}

const ROLE_LABELS: Record<HostProviderRole, string> = { OWNER: "オーナー", EDITOR: "編集者" };

export function providerRoleLabel(role: HostProviderRole | null): string | null {
  return role ? ROLE_LABELS[role] : null;
}

function parseProvider(value: unknown): HostProvider | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = nihoIdOrNull(record.id);
  const displayName = typeof record.displayName === "string" ? record.displayName.trim().slice(0, 120) : "";
  if (!id || !displayName) return null;
  const role = record.memberRole === "OWNER" || record.memberRole === "EDITOR" ? record.memberRole : null;
  return { id, displayName, role };
}

/**
 * Reads `GET /api/experience-providers` (`{ providers: [...] }`, or a bare array).
 * Returns null when the body is not a provider list at all; entries without a
 * valid id or name are left out rather than shown half-filled.
 */
export function parseProviderList(body: unknown): HostProvider[] | null {
  const list = Array.isArray(body) ? body : body && typeof body === "object" && Array.isArray((body as { providers?: unknown }).providers) ? (body as { providers: unknown[] }).providers : null;
  if (!list) return null;
  return list.map(parseProvider).filter((provider): provider is HostProvider => provider !== null);
}

const PROVIDER_KINDS: readonly HostProviderKind[] = ["INDIVIDUAL", "BUSINESS"];
const REVIEW_STATUSES: readonly HostProviderReviewStatus[] = ["DRAFT", "REQUESTED", "APPROVED", "SUSPENDED"];
const BIO_MAX = 4000;

function httpsUrlOrNull(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Reads `GET /api/experience-providers/:id` (`{ provider: {...} }`) for the settings
 * screen: the list's fields plus kind, bio, seller page and review status. Unknown
 * values are left out (the screen shows them as not set) rather than guessed.
 */
export function parseProviderDetail(body: unknown): HostProvider | null {
  const record = body && typeof body === "object" ? (body as { provider?: unknown }).provider : null;
  const provider = parseProvider(record);
  if (!provider || !record || typeof record !== "object") return null;
  const fields = record as Record<string, unknown>;
  const kind = PROVIDER_KINDS.find((candidate) => candidate === fields.kind);
  const reviewStatus = REVIEW_STATUSES.find((candidate) => candidate === fields.reviewStatus);
  return {
    ...provider,
    ...(kind ? { kind } : {}),
    ...(typeof fields.bio === "string" ? { bio: fields.bio.trim().slice(0, BIO_MAX) } : {}),
    ...("sellerDisclosureUrl" in fields ? { sellerDisclosureUrl: httpsUrlOrNull(fields.sellerDisclosureUrl) } : {}),
    ...(reviewStatus ? { reviewStatus } : {}),
  };
}

/** The provider to open: the one asked for if this account has it, else the first. */
export function selectProvider(providers: readonly HostProvider[], requestedId: string | null): { provider: HostProvider | null; requestedMissing: boolean } {
  const requested = requestedId ? providers.find((provider) => provider.id === requestedId) : undefined;
  return { provider: requested ?? providers[0] ?? null, requestedMissing: Boolean(requestedId) && !requested };
}
