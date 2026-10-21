import "server-only";
import { config } from "@/lib/config";
import { nihoIdOrNull, parseProviderDetail, selectProvider, type HostProvider } from "@/lib/host/providers";
import { isHostMock, loadHostProviders, nihoApiFetch, readHostSession } from "@/lib/host/server";
import { idTokenUsable, type HostSession } from "@/lib/host/session";
import { hostConsoleSnapshot, hostHome, type HostHomeData } from "./console-data";
import type { HostExperience, HostSettings } from "./types";

type SearchParams = Record<string, string | string[] | undefined>;

export interface HostPageContext {
  session: HostSession;
  providers: HostProvider[];
  /** The provider this page shows; null when the account has none yet. */
  provider: HostProvider | null;
  /** `?providerId=` named a provider this account cannot open; `provider` is the first one instead. */
  providerNotFound: boolean;
  /** The URL's own `?providerId=` (when well formed), carried on every link of the page. */
  linkProviderId: string | null;
}

/**
 * The signed-in host and the provider a console page shows. Null while the console
 * layout shows sign-in, refresh or error instead (it reads the same cached list).
 */
export async function hostPageContext(query: SearchParams): Promise<HostPageContext | null> {
  const [load, session] = await Promise.all([loadHostProviders(), readHostSession()]);
  if (load.status !== "ok" || !session) return null;
  const requested = typeof query.providerId === "string" ? query.providerId : null;
  const linkProviderId = nihoIdOrNull(requested);
  const { provider, requestedMissing } = selectProvider(load.providers, linkProviderId);
  return { session, providers: load.providers, provider, providerNotFound: requested !== null && (requestedMissing || !linkProviderId), linkProviderId };
}

export interface HostConsoleData {
  home: HostHomeData;
  experiences: readonly HostExperience[];
  settings: HostSettings;
}

/** `GET /api/experience-providers/:id` through the session's NIHO (the synthetic one in mock mode). */
async function loadProviderDetail(providerId: string): Promise<HostProvider | null> {
  const session = await readHostSession();
  if (!session || !idTokenUsable(session, Date.now())) return null;
  try {
    const url = new URL(`/api/experience-providers/${encodeURIComponent(providerId)}`, config.nihoWebOrigin);
    const response = await nihoApiFetch(session)(url.href, {
      headers: { authorization: `Bearer ${session.idToken}`, accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const detail = parseProviderDetail(await response.json());
    return detail?.id === providerId ? detail : null;
  } catch {
    return null;
  }
}

/**
 * Everything the console pages show for one provider: the home rows and numbers,
 * the experiences and the settings' starting values. Mock mode returns the synthetic
 * sets; http mode is empty until #87 (see console-data.ts). The provider's own
 * fields come from NIHO's provider detail in both modes, falling back to the list.
 */
export async function loadHostConsoleData(provider: HostProvider): Promise<HostConsoleData> {
  const snapshot = hostConsoleSnapshot(provider.id, isHostMock() ? "mock" : "http", Date.now());
  const known = (await loadProviderDetail(provider.id)) ?? provider;
  return {
    home: hostHome(snapshot),
    experiences: snapshot.experiences,
    settings: {
      displayName: known.displayName,
      kind: known.kind ?? null,
      bio: known.bio ?? "",
      sellerDisclosureUrl: known.sellerDisclosureUrl ?? "",
      reviewStatus: known.reviewStatus ?? null,
      payout: snapshot.payout,
      meetingPoint: snapshot.meetingPoint,
      notificationEmail: snapshot.notificationEmail,
    },
  };
}
