import { HOST_API_PREFIX, HOST_INTRO_PATH, HOST_REFRESH_PATH } from "./routes";

/**
 * Browser side of the host session (#86). The tokens stay in an HttpOnly cookie;
 * this module only asks the server to refresh them, one request at a time across
 * every tab, because NIHO ends the connection if an old refresh token is reused.
 */
export const HOST_REFRESH_LOCK = "niho-host-refresh";

export type RefreshOutcome = { status: "ok"; idTokenExpiresAt: number } | { status: "signed-out" } | { status: "failed" };

export interface HostClientDeps {
  fetch: typeof fetch;
  /** Web Locks when the browser has them; otherwise only this tab is serialised. */
  locks?: Pick<LockManager, "request"> | undefined;
  onSignedOut: () => void;
}

function browserDeps(): HostClientDeps {
  return {
    fetch: (...args) => fetch(...args),
    locks: typeof navigator !== "undefined" && "locks" in navigator ? navigator.locks : undefined,
    onSignedOut: () => window.location.assign(HOST_INTRO_PATH),
  };
}

async function postRefresh(fetchImpl: typeof fetch): Promise<RefreshOutcome> {
  try {
    const response = await fetchImpl(HOST_REFRESH_PATH, { method: "POST", credentials: "same-origin", cache: "no-store", headers: { accept: "application/json" } });
    if (response.status === 401) return { status: "signed-out" };
    if (!response.ok) return { status: "failed" };
    const body = (await response.json()) as { idTokenExpiresAt?: unknown };
    const idTokenExpiresAt = Number(body.idTokenExpiresAt);
    return Number.isFinite(idTokenExpiresAt) ? { status: "ok", idTokenExpiresAt } : { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}

let inFlight: Promise<RefreshOutcome> | null = null;

/**
 * Asks the server to refresh the session if it is due. Calls in this tab share one
 * request; tabs queue on a Web Lock, and the server skips the refresh when another
 * tab has just done it.
 */
export function refreshHostSession(deps: HostClientDeps = browserDeps()): Promise<RefreshOutcome> {
  if (!inFlight) {
    const run = () => postRefresh(deps.fetch);
    const underLock = async (): Promise<RefreshOutcome> => (deps.locks ? await deps.locks.request(HOST_REFRESH_LOCK, run) : run());
    inFlight = underLock().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function needsRefresh(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;
  try {
    const body = (await response.clone().json()) as { error?: unknown };
    return body.error === "session_refresh_required";
  } catch {
    return false;
  }
}

/**
 * fetch for `/host/api/<path>`. When the relay says the ID token needs refreshing,
 * refreshes through the same single-flight path and retries once. Bodies must be
 * re-sendable (string, Blob, FormData, URLSearchParams), not streams.
 */
export async function hostFetch(path: string, init: RequestInit = {}, deps: HostClientDeps = browserDeps()): Promise<Response> {
  const url = `${HOST_API_PREFIX}${path.replace(/^\/+/, "")}`;
  const send = () => deps.fetch(url, { ...init, credentials: "same-origin", cache: "no-store" });
  const first = await send();
  if (!(await needsRefresh(first))) return first;
  const outcome = await refreshHostSession(deps);
  if (outcome.status === "signed-out") {
    deps.onSignedOut();
    return first;
  }
  return outcome.status === "ok" ? send() : first;
}
