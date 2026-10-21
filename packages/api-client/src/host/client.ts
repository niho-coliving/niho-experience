/**
 * NIHO のホスト API（体験の提供者の本人向け API と `GET /api/auth/me`）のクライアント。**サーバー専用**。
 *
 * - ホスト本人の ID token を `Authorization: Bearer` で送る。ブラウザから import しない（トークンを持つのはこのサイトのサーバーだけ。
 *   ブラウザは `/host/api/*` の中継を呼ぶ）。cookie は送らず、リダイレクトに従わず、キャッシュしない。
 * - 応答の形は信頼境界の外なので、契約の項目だけを確かめて取り出す（知らない項目は渡さない）。
 * - エラーは NIHO の `ErrorResponse` から `{ status, code, reason }`（`reason` は `error.details.reason`）を返す。
 */
import { normalizeOrigin, type FetchLike } from "../client.ts";
import {
  EXPERIENCE_PROVIDER_KINDS,
  EXPERIENCE_PROVIDER_MEMBER_ROLES,
  EXPERIENCE_PROVIDER_PAYMENT_READINESS_REASONS,
  EXPERIENCE_PROVIDER_REVIEW_STATUSES,
  type ExperienceHostAuthMe,
  type ExperienceHostErrorReason,
  type ExperienceProvider,
  type ExperienceProviderConsent,
  type ExperienceProviderDetailResponse,
  type ExperienceProviderListResponse,
  type ExperienceProviderPaymentConnectResponse,
  type ExperienceProviderPaymentReadinessReason,
  type ExperienceProviderPaymentReadinessResponse,
  type ExperienceProviderPaymentReuseCandidate,
  type ExperienceProviderPaymentReuseCandidatesResponse,
  type ExperienceProviderPaymentReuseRequest,
  type ExperienceProviderRegisterRequest,
  type ExperienceProviderRegisterResponse,
  type ExperienceProviderResponse,
  type ExperienceProviderSubmitResponse,
  type ExperienceProviderUpdateRequest,
  type ExperienceProviderWithMemberRole,
} from "./types.ts";

export type ExperienceHostApiClientOptions = {
  /** NIHO の Web origin（例: https://niho.life）。公開クライアントと同じ規則で確かめる。 */
  nihoWebOrigin: string;
  /** ホスト本人の ID token。ログ・URL・ブラウザへ出さない。 */
  idToken: string;
  /** 既定は globalThis.fetch。mock は `@niho-experience/api-client/host/mock` の createMockExperienceHostFetch。 */
  fetch?: FetchLike;
  /** 1 回の要求（応答の本文を読み終えるまで）の待ち時間の上限（既定 10 秒）。 */
  timeoutMs?: number;
};

/** 契約に書かれた理由はその型で、書かれていない理由も文字列のまま渡す。 */
export type ExperienceHostApiErrorReason = ExperienceHostErrorReason | (string & {});

/** NIHO が `ErrorResponse` で断った（400 / 401 / 403 / 404 / 409 / 422 など）。 */
export type ExperienceHostApiError = {
  ok: false;
  kind: "error";
  status: number;
  /** `error.code`（`VALIDATION_ERROR`・`UNAUTHORIZED`・`FORBIDDEN`・`NOT_FOUND`・`CONFLICT`・`UNPROCESSABLE_ENTITY` など）。 */
  code: string;
  /** `error.details.reason`。無ければ null。 */
  reason: ExperienceHostApiErrorReason | null;
  /** NIHO の文言。画面には出さず、画面の文言は `reason` と `status` から決める。 */
  message: string;
};

export type ExperienceHostApiFailure =
  | ExperienceHostApiError
  | { ok: false; kind: "network_error" }
  | { ok: false; kind: "unexpected_response"; status: number };

export type ExperienceHostApiResult<T> = { ok: true; data: T } | ExperienceHostApiFailure;

const DEFAULT_TIMEOUT_MS = 10_000;
const STRIPE_CONNECT_ORIGIN = "https://connect.stripe.com";
/** NIHO の ID（cuid など）。path に入れる前に確かめる（`..` などで別の API を指さない）。 */
const PROVIDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
/** Authorization に入れられる文字だけ（改行・空白でヘッダーを壊さない）。 */
const ID_TOKEN_PATTERN = /^[\x21-\x7e]{1,8192}$/;

/** Stripe の口座の登録の画面（アカウントリンク）として遷移してよい URL か。 */
export function isStripeConnectUrl(candidate: string): boolean {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return false;
  }
  return url.protocol === "https:" && !url.username && !url.password && url.origin === STRIPE_CONNECT_ORIGIN;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isString = (value: unknown): value is string => typeof value === "string";
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === "string";
const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T => typeof value === "string" && (values as readonly string[]).includes(value);

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function readConsent(value: unknown): ExperienceProviderConsent | null {
  return isObject(value) && isString(value.version) && isString(value.text) ? { version: value.version, text: value.text } : null;
}

function readProvider(value: unknown): ExperienceProvider | null {
  if (!isObject(value)) return null;
  const v = value;
  if (
    !isString(v.id) || v.id.length === 0 || !isString(v.ownerUserId) || !isString(v.vesselSpotId) ||
    !isOneOf(EXPERIENCE_PROVIDER_KINDS, v.kind) || !isString(v.displayName) || !isString(v.bio) ||
    !isNullableString(v.sellerDisclosureUrl) || !isOneOf(EXPERIENCE_PROVIDER_REVIEW_STATUSES, v.reviewStatus) ||
    !isString(v.consentVersion) || !isString(v.consentedAt) || !isNullableString(v.submittedAt) || !isNullableString(v.approvedAt) ||
    !isNullableString(v.paymentReuseConsentVersion) || !isNullableString(v.paymentReuseConsentedAt) ||
    !isNullableString(v.paymentReuseSourceSpotId) || !isString(v.createdAt) || !isString(v.updatedAt)
  ) {
    return null;
  }
  return {
    id: v.id,
    ownerUserId: v.ownerUserId,
    vesselSpotId: v.vesselSpotId,
    kind: v.kind,
    displayName: v.displayName,
    bio: v.bio,
    sellerDisclosureUrl: v.sellerDisclosureUrl,
    reviewStatus: v.reviewStatus,
    consentVersion: v.consentVersion,
    consentedAt: v.consentedAt,
    submittedAt: v.submittedAt,
    approvedAt: v.approvedAt,
    paymentReuseConsentVersion: v.paymentReuseConsentVersion,
    paymentReuseConsentedAt: v.paymentReuseConsentedAt,
    paymentReuseSourceSpotId: v.paymentReuseSourceSpotId,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

function readProviderWithRole(value: unknown): ExperienceProviderWithMemberRole | null {
  const provider = readProvider(value);
  if (!provider || !isObject(value)) return null;
  const memberRole = value.memberRole;
  if (memberRole !== null && !isOneOf(EXPERIENCE_PROVIDER_MEMBER_ROLES, memberRole)) return null;
  return { ...provider, memberRole };
}

function readAll<T>(value: unknown, read: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const items: T[] = [];
  for (const item of value) {
    const parsed = read(item);
    if (parsed === null) return null;
    items.push(parsed);
  }
  return items;
}

function readReadinessReason(value: unknown): ExperienceProviderPaymentReadinessReason | null {
  return isOneOf(EXPERIENCE_PROVIDER_PAYMENT_READINESS_REASONS, value) ? value : null;
}

/** `/api/auth/me` は閉じていない応答なので、契約に書いた項目（表示名と顔写真）だけを取り出す。 */
function readAuthMe(body: unknown): ExperienceHostAuthMe | null {
  if (!isObject(body) || !isObject(body.user) || !isString(body.user.id) || !isNullableString(body.user.displayName)) return null;
  const icon = body.userIconImage;
  let userIconImage: ExperienceHostAuthMe["userIconImage"] = null;
  if (icon !== null) {
    if (!isObject(icon) || !isHttpsUrl(icon.signedUrl) || !isString(icon.expiresAt)) return null;
    userIconImage = { signedUrl: icon.signedUrl, expiresAt: icon.expiresAt };
  }
  return { user: { id: body.user.id, displayName: body.user.displayName }, userIconImage };
}

function readList(body: unknown): ExperienceProviderListResponse | null {
  if (!isObject(body) || typeof body.platformAdmin !== "boolean") return null;
  const providers = readAll(body.providers, readProviderWithRole);
  const consent = readConsent(body.consent);
  const paymentReuseConsent = readConsent(body.paymentReuseConsent);
  return providers && consent && paymentReuseConsent ? { providers, platformAdmin: body.platformAdmin, consent, paymentReuseConsent } : null;
}

function readDetail(body: unknown): ExperienceProviderDetailResponse | null {
  if (!isObject(body) || typeof body.platformAdmin !== "boolean") return null;
  const provider = body.provider === null ? null : readProviderWithRole(body.provider);
  const consent = readConsent(body.consent);
  const paymentReuseConsent = readConsent(body.paymentReuseConsent);
  if ((body.provider !== null && !provider) || !consent || !paymentReuseConsent) return null;
  return { provider, platformAdmin: body.platformAdmin, consent, paymentReuseConsent };
}

function readRegistered(body: unknown): ExperienceProviderRegisterResponse | null {
  if (!isObject(body)) return null;
  const provider = readProvider(body.provider);
  const consent = readConsent(body.consent);
  const paymentReuseConsent = readConsent(body.paymentReuseConsent);
  return provider && consent && paymentReuseConsent ? { provider, consent, paymentReuseConsent } : null;
}

function readProviderResponse(body: unknown): ExperienceProviderResponse | null {
  const provider = isObject(body) ? readProvider(body.provider) : null;
  return provider ? { provider } : null;
}

function readSubmitted(body: unknown): ExperienceProviderSubmitResponse | null {
  return isObject(body) && body.submitted === true ? { submitted: true } : null;
}

function readReadiness(body: unknown): ExperienceProviderPaymentReadinessResponse | null {
  if (!isObject(body) || typeof body.ready !== "boolean") return null;
  const reason = readReadinessReason(body.reason);
  const paymentReuseConsent = readConsent(body.paymentReuseConsent);
  return reason && paymentReuseConsent ? { ready: body.ready, reason, paymentReuseConsent } : null;
}

function readReuseCandidate(value: unknown): ExperienceProviderPaymentReuseCandidate | null {
  if (!isObject(value) || !isString(value.id) || !isString(value.name) || typeof value.ready !== "boolean") return null;
  const reason = readReadinessReason(value.reason);
  return reason ? { id: value.id, name: value.name, ready: value.ready, reason } : null;
}

function readReuseCandidates(body: unknown): ExperienceProviderPaymentReuseCandidatesResponse | null {
  if (!isObject(body)) return null;
  const spots = readAll(body.spots, readReuseCandidate);
  const paymentReuseConsent = readConsent(body.paymentReuseConsent);
  return spots && paymentReuseConsent ? { spots, paymentReuseConsent } : null;
}

/** `url` は https の URL だけを受け取る（遷移してよい先かは `isStripeConnectUrl` で画面が確かめる）。 */
function readConnect(body: unknown): ExperienceProviderPaymentConnectResponse | null {
  if (!isObject(body) || typeof body.ready !== "boolean") return null;
  const reason = readReadinessReason(body.reason);
  if (!reason || !(body.url === null || isHttpsUrl(body.url)) || !isNullableString(body.expiresAt)) return null;
  return { url: body.url, expiresAt: body.expiresAt, ready: body.ready, reason };
}

function readError(status: number, body: unknown): ExperienceHostApiError | null {
  if (!isObject(body) || !isObject(body.error)) return null;
  const { code, message, details } = body.error;
  if (!isString(code) || !isString(message) || !isObject(details)) return null;
  const reason = isString(details.reason) && details.reason.length > 0 ? details.reason : null;
  return { ok: false, kind: "error", status, code, reason, message };
}

/** 確かめていない provider ID では NIHO を呼ばず、NIHO の 404 と同じ扱いにする。 */
const INVALID_PROVIDER_ID: ExperienceHostApiError = { ok: false, kind: "error", status: 404, code: "NOT_FOUND", reason: null, message: "" };

export function createExperienceHostApiClient(options: ExperienceHostApiClientOptions) {
  const origin = normalizeOrigin(options.nihoWebOrigin);
  if (!ID_TOKEN_PATTERN.test(options.idToken)) throw new Error("idToken must be a non-empty token without spaces");
  const authorization = `Bearer ${options.idToken}`;
  const fetchImpl: FetchLike = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function call<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    successStatus: number,
    read: (body: unknown) => T | null,
    body?: unknown,
  ): Promise<ExperienceHostApiResult<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers: Record<string, string> = { accept: "application/json", authorization };
    if (body !== undefined) headers["content-type"] = "application/json";
    try {
      let response: Response;
      try {
        response = await fetchImpl(`${origin}${path}`, {
          method,
          headers,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
        });
      } catch {
        return { ok: false, kind: "network_error" };
      }
      let parsed: unknown;
      try {
        const text = await response.text();
        parsed = text ? (JSON.parse(text) as unknown) : null;
      } catch (error) {
        if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) return { ok: false, kind: "network_error" };
        parsed = undefined;
      }
      if (response.status === successStatus) {
        const data = read(parsed);
        return data === null ? { ok: false, kind: "unexpected_response", status: response.status } : { ok: true, data };
      }
      if (response.status >= 400) {
        const error = readError(response.status, parsed);
        if (error) return error;
      }
      return { ok: false, kind: "unexpected_response", status: response.status };
    } finally {
      clearTimeout(timer);
    }
  }

  const providerPath = (providerId: string, suffix = "") => `/api/experience-providers/${encodeURIComponent(providerId)}${suffix}`;
  const validProviderId = (providerId: string) => PROVIDER_ID_PATTERN.test(providerId);

  return {
    /** 本人の表示名と顔写真（`GET /api/auth/me` のうち契約に書いた部分だけ）。 */
    getAuthMe(): Promise<ExperienceHostApiResult<ExperienceHostAuthMe>> {
      return call("GET", "/api/auth/me", 200, readAuthMe);
    },

    /** 本人が OWNER / EDITOR として所属する提供者の一覧と、登録・口座の再利用の同意。 */
    listExperienceProviders(): Promise<ExperienceHostApiResult<ExperienceProviderListResponse>> {
      return call("GET", "/api/experience-providers", 200, readList);
    },

    /** 提供者として自己登録する（201）。422 の reason: `PROVIDER_CONSENT_OUTDATED`・`PROVIDER_EMAIL_REQUIRED`。 */
    registerExperienceProvider(body: ExperienceProviderRegisterRequest): Promise<ExperienceHostApiResult<ExperienceProviderRegisterResponse>> {
      return call("POST", "/api/experience-providers", 201, readRegistered, body);
    },

    /** 提供者の紹介（所属していない・存在しない提供者は 404）。 */
    async getExperienceProvider(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderDetailResponse>> {
      return validProviderId(providerId) ? call("GET", providerPath(providerId), 200, readDetail) : INVALID_PROVIDER_ID;
    },

    /** 紹介を直す（送った項目だけ）。`sellerDisclosureUrl` は OWNER だけ（EDITOR は 403）。 */
    async updateExperienceProvider(providerId: string, body: ExperienceProviderUpdateRequest): Promise<ExperienceHostApiResult<ExperienceProviderResponse>> {
      return validProviderId(providerId) ? call("PATCH", providerPath(providerId), 200, readProviderResponse, body) : INVALID_PROVIDER_ID;
    },

    /** 審査を申請する（OWNER）。409 の reason: `PROVIDER_REVIEW_STATE_CONFLICT`。 */
    async submitExperienceProvider(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderSubmitResponse>> {
      return validProviderId(providerId) ? call("POST", providerPath(providerId, "/submit"), 200, readSubmitted) : INVALID_PROVIDER_ID;
    },

    /** 売上の受取口座の準備の状態（OWNER）。 */
    async getExperienceProviderPaymentReadiness(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderPaymentReadinessResponse>> {
      return validProviderId(providerId) ? call("GET", providerPath(providerId, "/payments/readiness"), 200, readReadiness) : INVALID_PROVIDER_ID;
    },

    /** 売上の受取に再利用できる拠点の販売者口座の候補（OWNER）。 */
    async listExperienceProviderPaymentReuseCandidates(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderPaymentReuseCandidatesResponse>> {
      return validProviderId(providerId) ? call("GET", providerPath(providerId, "/payments/reuse-candidates"), 200, readReuseCandidates) : INVALID_PROVIDER_ID;
    },

    /**
     * 拠点の販売者口座を再利用する（OWNER）。404 の reason: `PROVIDER_PAYMENT_SOURCE_FORBIDDEN`・409: `PROVIDER_PAYMENT_LOCKED`・
     * 422: `PROVIDER_PAYMENT_CONSENT_OUTDATED`・`PROVIDER_PAYMENT_SOURCE_NOT_READY`。
     */
    async reuseExperienceProviderPayment(providerId: string, body: ExperienceProviderPaymentReuseRequest): Promise<ExperienceHostApiResult<ExperienceProviderResponse>> {
      return validProviderId(providerId) ? call("POST", providerPath(providerId, "/payments/reuse"), 200, readProviderResponse, body) : INVALID_PROVIDER_ID;
    },

    /**
     * Stripe の口座の接続を始める（OWNER）。`url` は一度きりで `expiresAt` まで。遷移の前に `isStripeConnectUrl` で確かめる。
     * 409 の reason: `PROVIDER_CONNECT_UNAVAILABLE`・`PROVIDER_PAYMENT_SHARED_ACCOUNT`・`PROVIDER_PAYMENT_LOCKED`。
     */
    async startExperienceProviderPaymentConnect(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderPaymentConnectResponse>> {
      return validProviderId(providerId) ? call("POST", providerPath(providerId, "/payments/connect/start"), 200, readConnect) : INVALID_PROVIDER_ID;
    },

    /** 接続を続ける（リンクの期限切れ・途中で離れたとき）。応答とエラーは start と同じ。 */
    async resumeExperienceProviderPaymentConnect(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderPaymentConnectResponse>> {
      return validProviderId(providerId) ? call("POST", providerPath(providerId, "/payments/connect/resume"), 200, readConnect) : INVALID_PROVIDER_ID;
    },

    /** 口座の状態を Stripe から取り直す（`url` は null）。口座がまだ無ければ 409 `PROVIDER_PAYMENT_NOT_CONNECTED`。 */
    async syncExperienceProviderPaymentConnect(providerId: string): Promise<ExperienceHostApiResult<ExperienceProviderPaymentConnectResponse>> {
      return validProviderId(providerId) ? call("POST", providerPath(providerId, "/payments/connect/sync"), 200, readConnect) : INVALID_PROVIDER_ID;
    },
  };
}

export type ExperienceHostApiClient = ReturnType<typeof createExperienceHostApiClient>;
