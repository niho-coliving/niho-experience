import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { cookieSealer } from "@/lib/host/cookie-seal";
import { siteOrigin } from "@/lib/host/server";
import { mutationFromSameOrigin } from "@/lib/host/relay";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, adminCookieOptions, decodeAdminSession, encodeAdminSession, type AdminSession } from "@/admin/session";

export const isAdminPreview = () => config.apiMode === "mock" && config.adminSupportConsoleEnabled;

export function requireAdminConsole() {
  if (!config.adminSupportConsoleEnabled) notFound();
}

const adminSealer = () => cookieSealer(config.hostSessionSecret, "admin-session");

export const readAdminSession = cache(async (): Promise<AdminSession | null> => {
  // A sealed preview cookie is never treated as evidence of a production admin role.
  if (!isAdminPreview()) return null;
  const jar = await cookies();
  return decodeAdminSession(adminSealer(), jar.get(ADMIN_SESSION_COOKIE)?.value, Date.now());
});

export function setAdminSessionCookie(response: NextResponse, session: AdminSession) {
  response.cookies.set(ADMIN_SESSION_COOKIE, encodeAdminSession(adminSealer(), session), adminCookieOptions(ADMIN_SESSION_MAX_AGE_SECONDS));
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", adminCookieOptions(0));
}

export function adminMutationAllowed(request: Request): boolean {
  return mutationFromSameOrigin(request.method, request.headers, siteOrigin());
}

export function adminJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "cache-control": "private, no-store" } });
}

