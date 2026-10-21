import "server-only";
import { nihoIdOrNull, selectProvider, type HostProvider } from "@/lib/host/providers";
import { hostApiClient, isHostMock, loadHostProviders, readHostSession } from "@/lib/host/server";
import { idTokenUsable, type HostSession } from "@/lib/host/session";
import type { BookingExperience } from "./bookings";
import { bookingClock, bookingList, bookingOf, editorExperience, hostConsoleSnapshot, hostHome, type HostBookingList, type HostBookingLookup, type HostEditorExperience, type HostHomeData } from "./console-data";
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
  /** YYYY-MM-DD in Japan (the preview's fixed day in mock mode). */
  today: string;
  home: HostHomeData;
  experiences: readonly HostExperience[];
  settings: HostSettings;
}

/**
 * `GET /api/experience-providers/:id` through the typed host client (#87): NIHO in http
 * mode, the contract mock in mock mode. Null when it cannot be read or names another provider.
 */
async function loadProviderDetail(providerId: string): Promise<HostProvider | null> {
  const session = await readHostSession();
  if (!session || !idTokenUsable(session, Date.now())) return null;
  try {
    const result = await hostApiClient(session).getExperienceProvider(providerId);
    const detail = result.ok ? result.data.provider : null;
    return detail?.id === providerId ? detail : null;
  } catch {
    return null;
  }
}

/**
 * Everything the console pages show for one provider: the home rows and numbers,
 * the experiences and the settings' starting values. Mock mode returns the synthetic
 * sets; http mode is empty while the host contract has no such API (see console-data.ts).
 * The provider's own fields come from NIHO's provider detail in both modes, falling back
 * to the list. Only display fields reach the (client) settings form, never NIHO's internal ids.
 */
export async function loadHostConsoleData(provider: HostProvider): Promise<HostConsoleData> {
  const snapshot = hostConsoleSnapshot(provider.id, isHostMock() ? "mock" : "http", Date.now());
  const known = (await loadProviderDetail(provider.id)) ?? provider;
  return {
    today: snapshot.today,
    home: hostHome(snapshot),
    experiences: snapshot.experiences,
    settings: {
      displayName: known.displayName,
      kind: known.kind,
      bio: known.bio,
      sellerDisclosureUrl: known.sellerDisclosureUrl ?? "",
      reviewStatus: known.reviewStatus,
      payout: snapshot.payout,
      meetingPoint: snapshot.meetingPoint,
      notificationEmail: snapshot.notificationEmail,
    },
  };
}

export interface HostExperienceEditorData {
  editor: HostEditorExperience;
  /** 迎える人: the provider's name and introduction, as 設定 › 提供者情報 has them. */
  host: { name: string; bio: string };
  /** The day a submission is dated (申請日). */
  today: string;
}

/** The experience editor's page (#89): the experience with this id and the provider who hosts it. */
export async function loadHostExperienceEditor(provider: HostProvider, id: string): Promise<HostExperienceEditorData> {
  const data = await loadHostConsoleData(provider);
  return {
    editor: editorExperience(data, isHostMock() ? "mock" : "http", id),
    host: { name: data.settings.displayName, bio: data.settings.bio },
    today: data.today,
  };
}

export interface HostBookingsData {
  /** The day the list counts from (the preview's fixed day in mock mode). */
  today: string;
  /** The moment actions are dated with (the preview's fixed one in mock mode); null takes the clock. */
  now: string | null;
  list: HostBookingList;
  /** The booking `?booking=` names; null when it names none. */
  requested: HostBookingLookup | null;
  /** The provider's experiences, for the list's select, its headings and its seat counts. */
  experiences: BookingExperience[];
}

/**
 * 予約 (#90): the provider's bookings and the one `?booking=` names: synthetic in mock mode,
 * nothing yet in http mode (the page says 準備中). The client screen gets the experiences'
 * titles and the offers' capacity and length, not their pages.
 */
export async function loadHostBookings(provider: HostProvider, requestedId: string | null): Promise<HostBookingsData> {
  const mode = isHostMock() ? "mock" : "http";
  const snapshot = hostConsoleSnapshot(provider.id, mode, Date.now());
  return {
    today: snapshot.today,
    now: bookingClock(mode),
    list: bookingList(snapshot, mode),
    requested: requestedId ? bookingOf(snapshot, mode, requestedId) : null,
    experiences: snapshot.experiences.map(({ id, title, offers }) => ({ id, title, offers: offers.map(({ id: offerId, capacity, durationMinutes }) => ({ id: offerId, capacity, durationMinutes })) })),
  };
}
