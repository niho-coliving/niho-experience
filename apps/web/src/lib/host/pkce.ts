import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** RFC 7636 verifier: 32 random bytes as base64url (43 characters). */
export function createPkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** S256 challenge for the NIHO confirmation page (43 base64url characters). */
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier, "ascii").digest("base64url");
}

/** Login state echoed back by NIHO. NIHO accepts 22–128 base64url characters. */
export function createLoginState(): string {
  return randomBytes(32).toString("base64url");
}

export const LOGIN_STATE_PATTERN = /^[A-Za-z0-9_-]{22,128}$/;

/**
 * Constant-time comparison of the state we stored with the one in the callback.
 * Both sides are hashed first so neither the content nor the length leaks.
 */
export function loginStatesMatch(expected: string, received: string | null | undefined): boolean {
  if (!received || !LOGIN_STATE_PATTERN.test(received) || !LOGIN_STATE_PATTERN.test(expected)) return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(received).digest();
  return timingSafeEqual(a, b);
}
