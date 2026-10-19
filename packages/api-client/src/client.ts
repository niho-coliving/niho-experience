/**
 * NIHO 公開 API のクライアント（docs/api-contract.md）。認証・cookie を使わず、旅行者の入力をログ・URL に載せない。
 *
 * - 一覧・詳細は SSR から読んでよい。残席と checkout はブラウザから読む（checkout はサーバーから代理送信しない）。
 * - 応答の形は信頼境界の外なので、遷移先 URL など危険な値は使う前に確かめる。
 */
import type {
  ExperienceAvailabilityResponse,
  ExperienceCatalogResponse,
  ExperienceCheckoutError,
  ExperienceCheckoutRequest,
  ExperienceDetailResponse,
  OfferId,
  RegionKey,
} from "./types.ts";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ExperienceApiClientOptions = {
  /** NIHO の公開 Web origin（例: https://niho.life）。末尾の `/` は不要。 */
  nihoWebOrigin: string;
  /** 既定は globalThis.fetch。mock は `@niho-experience/api-client/mock` の createMockExperienceFetch。 */
  fetch?: FetchLike;
  /** 1 回の要求の待ち時間の上限（既定 10 秒）。 */
  timeoutMs?: number;
  /**
   * 一覧・詳細（共有キャッシュしてよい公開投影）を読むときだけ fetch に足す設定（例: Next.js の `{ next: { revalidate: 60 } }`）。
   * 省略時は `cache: "no-store"`。残席・checkout には使わない。応答の `Cache-Control` より長く保持しない。
   */
  cacheableReadInit?: RequestInit;
};

export type ReadFailure =
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "invalid_request"; message: string }
  | { ok: false; kind: "network_error" }
  | { ok: false; kind: "unexpected_response"; status: number };

export type ReadResult<T> = { ok: true; data: T } | ReadFailure;

export type CheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "rejected"; status: number; error: ExperienceCheckoutError; retryAfterSeconds: number | null }
  | { ok: false; kind: "network_error" }
  | { ok: false; kind: "unexpected_response"; status: number };

const DEFAULT_TIMEOUT_MS = 10_000;
const STRIPE_CHECKOUT_ORIGIN = "https://checkout.stripe.com";

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("nihoWebOrigin must be https");
  }
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("nihoWebOrigin must be an origin without path");
  }
  return url.origin;
}

/**
 * checkout の応答の遷移先として受け付ける URL か。Stripe の Checkout か、NIHO の origin の予約確認ページだけ。
 * 想定外の URL（別ドメイン・javascript: 等）には遷移しない。
 */
export function isAllowedCheckoutRedirect(candidate: string, nihoWebOrigin: string): boolean {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (url.origin === STRIPE_CHECKOUT_ORIGIN) return true;
  return url.origin === normalizeOrigin(nihoWebOrigin) && /^\/living\/[^/]+\/pages\/[^/]+\/bookings\/[^/]+$|^\/experiences\/bookings\/[^/]+$/.test(url.pathname);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCheckoutError(value: unknown): value is ExperienceCheckoutError {
  return isObject(value) && typeof value.code === "string" && typeof value.message === "string" && typeof value.retryable === "boolean";
}

export function createExperienceApiClient(options: ExperienceApiClientOptions) {
  const origin = normalizeOrigin(options.nihoWebOrigin);
  const fetchImpl: FetchLike = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request(path: string, init: RequestInit, cacheable = false): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const cacheInit: RequestInit = cacheable && options.cacheableReadInit ? options.cacheableReadInit : { cache: "no-store" };
    try {
      return await fetchImpl(`${origin}${path}`, {
        ...cacheInit,
        ...init,
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson<T>(path: string, cacheable: boolean): Promise<ReadResult<T>> {
    const response = await request(path, { method: "GET", headers: { accept: "application/json" } }, cacheable);
    if (!response) return { ok: false, kind: "network_error" };
    if (response.status === 404) return { ok: false, kind: "not_found" };
    if (response.status === 400) {
      const body: unknown = await response.json().catch(() => null);
      const message = isObject(body) && isObject(body.error) && typeof body.error.message === "string" ? body.error.message : "invalid request";
      return { ok: false, kind: "invalid_request", message };
    }
    if (response.status !== 200) return { ok: false, kind: "unexpected_response", status: response.status };
    const body: unknown = await response.json().catch(() => undefined);
    if (!isObject(body)) return { ok: false, kind: "unexpected_response", status: response.status };
    return { ok: true, data: body as T };
  }

  return {
    /** 掲載中の体験の一覧（SSR 可）。 */
    listExperiences(params: { region?: RegionKey } = {}): Promise<ReadResult<ExperienceCatalogResponse>> {
      const query = params.region ? `?region=${encodeURIComponent(params.region)}` : "";
      return readJson(`/api/public/experiences${query}`, true);
    },

    /** 体験の詳細（SSR 可）。 */
    getExperience(slug: string): Promise<ReadResult<ExperienceDetailResponse>> {
      return readJson(`/api/public/experiences/${encodeURIComponent(slug)}`, true);
    },

    /** 開催回と残席（ブラウザから。キャッシュしない）。 */
    getAvailability(slug: string, params: { offerId?: OfferId } = {}): Promise<ReadResult<ExperienceAvailabilityResponse>> {
      const query = params.offerId ? `?offerId=${encodeURIComponent(params.offerId)}` : "";
      return readJson(`/api/public/experiences/${encodeURIComponent(slug)}/availability${query}`, false);
    },

    /**
     * ゲスト予約の開始（ブラウザから）。成功したら `checkoutUrl` へ遷移する。
     * 通信失敗（`network_error`）は同じ body・同じ `clientRequestKey` で再送してよい。
     */
    async startCheckout(slug: string, body: ExperienceCheckoutRequest): Promise<CheckoutResult> {
      const response = await request(`/api/public/experiences/${encodeURIComponent(slug)}/checkout`, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response) return { ok: false, kind: "network_error" };
      if (response.status === 404) return { ok: false, kind: "not_found" };
      const parsed: unknown = await response.json().catch(() => undefined);
      if (response.status === 201) {
        const checkoutUrl = isObject(parsed) ? parsed.checkoutUrl : undefined;
        if (typeof checkoutUrl === "string" && isAllowedCheckoutRedirect(checkoutUrl, origin)) {
          return { ok: true, checkoutUrl };
        }
        return { ok: false, kind: "unexpected_response", status: response.status };
      }
      const error = isObject(parsed) ? parsed.error : undefined;
      if (isCheckoutError(error)) {
        const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
        return {
          ok: false,
          kind: "rejected",
          status: response.status,
          error,
          retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
        };
      }
      return { ok: false, kind: "unexpected_response", status: response.status };
    },
  };
}

export type ExperienceApiClient = ReturnType<typeof createExperienceApiClient>;
