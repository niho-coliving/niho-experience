import type { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { hostMockScenario, MOCK_ID_TOKEN_PREFIX, MOCK_USER, mockToken } from "@/lib/host/mock-niho";
import { nihoIdOrNull } from "@/lib/host/providers";
import { HOST_HOME_PATH, withProvider } from "@/lib/host/routes";
import { hostNotFound, isHostMock, MOCK_ID_TOKEN_TTL_MS, seeOther, setSessionCookie } from "@/lib/host/server";
import { startSession } from "@/lib/host/session";

const MOCK_CONNECTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Preview only (EXPERIENCE_API_MODE=mock): signs in as a synthetic host.
 * `?mock=empty` gives an account with no providers; `?expired=1` starts with
 * an expired ID token to exercise the refresh-then-reload path. 404 in http mode.
 */
export function GET(request: NextRequest) {
  if (!config.hostConsoleEnabled || !isHostMock()) return hostNotFound();
  const params = request.nextUrl.searchParams;
  const now = Date.now();
  const session = startSession(
    {
      refreshToken: mockToken("mock-refresh-token."),
      idToken: mockToken(MOCK_ID_TOKEN_PREFIX),
      idTokenExpiresAt: params.get("expired") === "1" ? now - 1000 : now + MOCK_ID_TOKEN_TTL_MS,
      connectionId: mockToken("mock-connection-"),
      connectionExpiresAt: now + MOCK_CONNECTION_TTL_MS,
      displayName: MOCK_USER.displayName,
      iconUrl: null,
      mockScenario: hostMockScenario(params.get("mock")),
    },
    now,
  );
  const response = seeOther(withProvider(HOST_HOME_PATH, nihoIdOrNull(params.get("providerId"))));
  setSessionCookie(response, session, now);
  return response;
}
