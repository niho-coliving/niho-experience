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

export interface HostProvider {
  id: string;
  displayName: string;
  role: HostProviderRole | null;
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

/** The provider to open: the one asked for if this account has it, else the first. */
export function selectProvider(providers: readonly HostProvider[], requestedId: string | null): { provider: HostProvider | null; requestedMissing: boolean } {
  const requested = requestedId ? providers.find((provider) => provider.id === requestedId) : undefined;
  return { provider: requested ?? providers[0] ?? null, requestedMissing: Boolean(requestedId) && !requested };
}
