import type { PageDocument } from "@niho/web/core";
import { validatePublishedDocument, type PageId } from "./page-document-contract";
import { readBoundedJson, ResponseBodyTooLarge } from "./read-bounded-json";

const MAX_BYTES = 512 * 1024;
export type DocumentFailure = { pageId: PageId; reason: "network" | "http" | "invalid" | "oversized" | "context"; status?: number };
export function reportDocumentFailure(failure: DocumentFailure): void {
  // エラー本文・例外・URL・原稿・cookieを記録しない。pageIdは固定allowlistのみ。
  console.warn("[niho-web] published document fallback", failure);
}
export async function fetchPageDocument(pageId: PageId, options: {
  origin: string; fetch?: typeof fetch; onFailure?: (failure: DocumentFailure) => void; timeoutMs?: number;
}): Promise<PageDocument | null> {
  const fail = options.onFailure ?? reportDocumentFailure;
  let response: Response;
  try {
    const origin = new URL(options.origin);
    if ((origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))) || origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password) throw new Error("Invalid public origin");
    response = await (options.fetch ?? fetch)(new URL(`/api/public/experiences/pages/${pageId}/en`, origin), {
      method: "GET", headers: { Accept: "application/json" }, cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.timeout(options.timeoutMs ?? 3000)
    });
  } catch { fail({ pageId, reason: "network" }); return null; }
  if (response.status === 404) return null;
  if (response.status !== 200) { fail({ pageId, reason: "http", status: response.status }); return null; }
  try {
    if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) throw new Error("Invalid media type");
    return validatePublishedDocument(await readBoundedJson(response, MAX_BYTES), pageId);
  } catch (error) { fail({ pageId, reason: error instanceof ResponseBodyTooLarge ? "oversized" : "invalid" }); return null; }
}
