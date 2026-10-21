/** Host console URLs (#86). Shared by server routes and client components. */
export const HOST_INTRO_PATH = "/host";
export const HOST_HOME_PATH = "/host/home";
export const HOST_REGISTER_PATH = "/host/register";
export const HOST_LOGIN_PATH = "/host/auth/login";
export const HOST_MOCK_LOGIN_PATH = "/host/auth/mock-login";
export const HOST_REFRESH_PATH = "/host/auth/refresh";
export const HOST_LOGOUT_PATH = "/host/auth/logout";
export const HOST_AUTH_ERROR_PATH = "/host/auth/error";
export const HOST_API_PREFIX = "/host/api/";

export const HOST_NAV = [
  { href: HOST_HOME_PATH, label: "ホーム" },
  { href: "/host/experiences", label: "体験" },
  { href: "/host/bookings", label: "予約" },
  { href: "/host/sales", label: "売上" },
  { href: "/host/settings", label: "設定" },
] as const;

/** `path?providerId=…` when a provider is chosen; the only query the console carries between pages. */
export function withProvider(path: string, providerId: string | null | undefined): string {
  return providerId ? `${path}?${new URLSearchParams({ providerId })}` : path;
}

/** Why the login did not finish; each has its own message on /host/auth/error. */
export const LOGIN_ERROR_REASONS = ["expired", "state", "denied", "rejected", "unavailable"] as const;
export type LoginErrorReason = (typeof LOGIN_ERROR_REASONS)[number];
