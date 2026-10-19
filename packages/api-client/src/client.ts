import {
  CatalogSchema,
  CheckoutRequestSchema,
  CheckoutResultSchema,
  ExperienceDetailSchema,
  QuoteRequestSchema,
  QuoteResultSchema,
  SlotListSchema,
  type Catalog,
  type CatalogQuery,
  type CheckoutRequest,
  type CheckoutResult,
  type ExperienceDetail,
  type QuoteRequest,
  type QuoteResult,
  type SlotList,
} from "./contract";

/** Operations the public site needs. Adapters: mock (now) and HTTP (after #7 / NIHO integration A). */
export interface ExperienceApi {
  readonly mode: "mock" | "http";
  getCatalog(query: CatalogQuery): Promise<Catalog>;
  /** Resolves null when the experience is not published. */
  getExperience(slug: string): Promise<ExperienceDetail | null>;
  getSlots(experienceId: string): Promise<SlotList>;
  createQuote(request: QuoteRequest): Promise<QuoteResult>;
  startGuestCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
}

/** Thrown when an adapter cannot be reached or returns data outside the contract. */
export class ExperienceApiUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExperienceApiUnavailableError";
  }
}

function parseOrThrow<T>(schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: unknown } }, value: unknown, op: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ExperienceApiUnavailableError(`${op}: response does not match contract`, { cause: result.error });
  }
  return result.data;
}

/**
 * Validates requests and responses of any adapter against the same contract,
 * so the mock cannot drift from what the real API will be checked against.
 */
export function withContractValidation(api: ExperienceApi): ExperienceApi {
  return {
    mode: api.mode,
    async getCatalog(query) {
      return parseOrThrow(CatalogSchema, await api.getCatalog(query), "getCatalog");
    },
    async getExperience(slug) {
      const detail = await api.getExperience(slug);
      return detail === null ? null : parseOrThrow(ExperienceDetailSchema, detail, "getExperience");
    },
    async getSlots(experienceId) {
      return parseOrThrow(SlotListSchema, await api.getSlots(experienceId), "getSlots");
    },
    async createQuote(request) {
      const req = QuoteRequestSchema.parse(request);
      return parseOrThrow(QuoteResultSchema, await api.createQuote(req), "createQuote");
    },
    async startGuestCheckout(request) {
      const req = CheckoutRequestSchema.parse(request);
      return parseOrThrow(CheckoutResultSchema, await api.startGuestCheckout(req), "startGuestCheckout");
    },
  };
}

/**
 * Placeholder for the real connection. Endpoint names, auth between the site
 * server and NIHO, and origin rules are decided in #7 with the contract lane.
 */
export function createHttpExperienceApi(_options: { baseUrl: string }): ExperienceApi {
  const notConnected = async (): Promise<never> => {
    throw new ExperienceApiUnavailableError(
      "HTTP adapter is not connected yet. The public API contract is pending (issue #7 / NIHO integration A).",
    );
  };
  return {
    mode: "http",
    getCatalog: notConnected,
    getExperience: notConnected,
    getSlots: notConnected,
    createQuote: notConnected,
    startGuestCheckout: notConnected,
  };
}
