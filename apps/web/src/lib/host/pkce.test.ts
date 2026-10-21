import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createLoginState, createPkceVerifier, LOGIN_STATE_PATTERN, loginStatesMatch, pkceChallenge } from "./pkce";

describe("PKCE", () => {
  it("makes 43-character base64url verifiers that differ each time", () => {
    const verifier = createPkceVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(createPkceVerifier()).not.toBe(verifier);
  });

  it("derives the S256 challenge: base64url(SHA-256(verifier)) without padding", () => {
    const verifier = createPkceVerifier();
    const challenge = pkceChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toBe(createHash("sha256").update(verifier).digest("base64url"));
  });
});

describe("login state", () => {
  it("is a 43-character base64url value NIHO accepts", () => {
    const state = createLoginState();
    expect(state).toMatch(LOGIN_STATE_PATTERN);
    expect(state).toHaveLength(43);
  });

  it("matches only the exact state", () => {
    const state = createLoginState();
    expect(loginStatesMatch(state, state)).toBe(true);
    expect(loginStatesMatch(state, createLoginState())).toBe(false);
    expect(loginStatesMatch(state, `${state}x`)).toBe(false);
    expect(loginStatesMatch(state, state.slice(0, -1))).toBe(false);
    expect(loginStatesMatch(state, null)).toBe(false);
    expect(loginStatesMatch(state, "")).toBe(false);
    expect(loginStatesMatch(state, `${state.slice(0, -1)}+`)).toBe(false);
  });
});
