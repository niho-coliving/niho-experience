import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { EXPERIENCE_HOST_API_CONTRACT } from "../src/contract-meta.ts";
import {
  auditContractDocument,
  auditHostContractDocument,
  EXPERIENCE_CONTRACT_DOCUMENT,
  EXPERIENCE_HOST_CONTRACT_DOCUMENT,
  EXPERIENCE_HOST_FIELD_POLICY,
} from "../src/testing/index.ts";
import { generateContractTypes } from "../scripts/gen-types.ts";

type AnyRecord = Record<string, any>;

const clone = () => structuredClone(EXPERIENCE_HOST_CONTRACT_DOCUMENT) as AnyRecord;

describe("ホスト API の契約の文書", () => {
  it("ホストの規則（範囲・Bearer・印・閉じた形・禁止項目・応答は全項目必須）を満たす", () => {
    expect(auditHostContractDocument()).toEqual([]);
  });

  it("選別済み契約の sha256 が一致する", async () => {
    const body = await readFile(new URL("../contract/experience-host-api.openapi.json", import.meta.url));
    const recorded = await readFile(new URL("../contract/experience-host-api.openapi.json.sha256", import.meta.url), "utf8");
    expect(recorded.trim()).toBe(`${createHash("sha256").update(body).digest("hex")}  experience-host-api.openapi.json`);
  });

  it("版と状態が contract-meta と一致する", () => {
    const info = EXPERIENCE_HOST_CONTRACT_DOCUMENT.info as AnyRecord;
    expect(info.version).toBe(EXPERIENCE_HOST_API_CONTRACT.version);
    expect(info["x-niho-contract-status"]).toBe(EXPERIENCE_HOST_API_CONTRACT.status);
  });

  it("操作は提供者の 11 個と GET /api/auth/me だけ", () => {
    const operations = Object.entries(EXPERIENCE_HOST_CONTRACT_DOCUMENT.paths as AnyRecord).flatMap(([path, item]) =>
      Object.entries(item as AnyRecord)
        .filter(([method]) => method !== "parameters")
        .map(([method, operation]) => `${method.toUpperCase()} ${path} ${(operation as AnyRecord).operationId}`),
    );
    expect(operations.sort()).toEqual([
      "GET /api/auth/me getAuthMe",
      "GET /api/experience-providers listExperienceProviders",
      "GET /api/experience-providers/{providerId} getExperienceProvider",
      "GET /api/experience-providers/{providerId}/payments/readiness getExperienceProviderPaymentReadiness",
      "GET /api/experience-providers/{providerId}/payments/reuse-candidates listExperienceProviderPaymentReuseCandidates",
      "PATCH /api/experience-providers/{providerId} updateExperienceProvider",
      "POST /api/experience-providers registerExperienceProvider",
      "POST /api/experience-providers/{providerId}/payments/connect/resume resumeExperienceProviderPaymentConnect",
      "POST /api/experience-providers/{providerId}/payments/connect/start startExperienceProviderPaymentConnect",
      "POST /api/experience-providers/{providerId}/payments/connect/sync syncExperienceProviderPaymentConnect",
      "POST /api/experience-providers/{providerId}/payments/reuse reuseExperienceProviderPayment",
      "POST /api/experience-providers/{providerId}/submit submitExperienceProvider",
    ].sort());
  });

  it("閉じない schema は許可リストの 2 つだけで、me の応答は ExperienceHostAuthMe", () => {
    expect(Object.keys(EXPERIENCE_HOST_FIELD_POLICY.openSchemas).sort()).toEqual(["ErrorResponse", "ExperienceHostAuthMe"]);
    const me = (EXPERIENCE_HOST_CONTRACT_DOCUMENT.paths as AnyRecord)["/api/auth/me"].get.responses["200"].content["application/json"].schema;
    expect(me).toEqual({ $ref: "#/components/schemas/ExperienceHostAuthMe" });
  });

  it("生成した型が契約と一致する（drift が無い）", async () => {
    const committed = await readFile(new URL("../src/generated/host-openapi.ts", import.meta.url), "utf8");
    expect(committed).toBe(await generateContractTypes("host"));
  });

  it("公開契約とホスト契約は互いの監査を通らない（監査が混ざらない）", () => {
    expect(auditContractDocument()).toEqual([]);
    expect(auditContractDocument(EXPERIENCE_HOST_CONTRACT_DOCUMENT).join("\n")).toContain("公開 namespace の外です");
    expect(auditHostContractDocument(EXPERIENCE_CONTRACT_DOCUMENT).join("\n")).toContain("ホスト API の範囲");
  });
});

describe("ホスト契約の監査の自己検査", () => {
  it("禁止の項目名・語を足すと失敗する", () => {
    const leaked = clone();
    const provider = leaked.components.schemas.ExperienceProvider;
    provider.properties.contactEmail = { type: "string" };
    provider.properties.stripeAccountId = { type: "string" };
    provider.properties.payoutSchedule = { type: "string" };
    provider.required.push("contactEmail", "stripeAccountId", "payoutSchedule");
    leaked.components.schemas.ExperienceHostAuthMe.properties.user.properties.phoneNumber = { type: "string" };
    leaked.components.schemas.ExperienceHostAuthMe.properties.user.required.push("phoneNumber");
    expect(auditHostContractDocument(leaked)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("ExperienceProvider.contactEmail: ホスト API に入れてはいけない語（email）"),
        expect.stringContaining("ExperienceProvider.stripeAccountId: ホスト API に入れてはいけない名前"),
        expect.stringContaining("ExperienceProvider.payoutSchedule: ホスト API に入れてはいけない語（payout）"),
        expect.stringContaining("ExperienceHostAuthMe.user.phoneNumber"),
      ]),
    );
  });

  it("閉じていない object・印の無い schema・使われない schema を見つける", () => {
    const loose = clone();
    loose.components.schemas.ExperienceProviderConsent.additionalProperties = true;
    delete loose.components.schemas.ExperienceProviderKind["x-niho-experience-host-dto"];
    loose.components.schemas.ExperienceProviderPaymentReuseCandidate.properties.extra = { type: "object", properties: { a: { type: "string" } }, required: ["a"] };
    loose.components.schemas.ExperienceProviderPaymentReuseCandidate.required.push("extra");
    loose.components.schemas.Unused = { "x-niho-experience-host-dto": true, type: "object", properties: {}, additionalProperties: false };
    expect(auditHostContractDocument(loose)).toEqual(
      expect.arrayContaining([
        "ExperienceProviderConsent: additionalProperties: false が必要です",
        "ExperienceProviderKind: x-niho-experience-host-dto: true が必要です",
        "ExperienceProviderPaymentReuseCandidate.extra: additionalProperties: false が必要です",
        expect.stringContaining("Unused: どの操作からも辿れない schema"),
      ]),
    );
  });

  it("範囲の外の path・Bearer でない security・me の書き込みを見つける", () => {
    const widened = clone();
    widened.paths["/api/users/{userId}"] = { get: { operationId: "getUser", security: [{ FirebaseIdToken: [] }], responses: {} } };
    widened.paths["/api/experience-providers"].get.security = [];
    widened.paths["/api/experience-providers/{providerId}"].patch.security = [{ FirebaseIdToken: [] }, {}];
    widened.paths["/api/auth/me"].delete = { operationId: "deleteMe", security: [{ FirebaseIdToken: [] }], responses: {} };
    expect(auditHostContractDocument(widened)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/api/users/{userId}: ホスト API の範囲"),
        "GET /api/experience-providers: security は [{ FirebaseIdToken: [] }] だけにします",
        "PATCH /api/experience-providers/{providerId}: security は [{ FirebaseIdToken: [] }] だけにします",
        expect.stringContaining("DELETE /api/auth/me: この path で使える method は GET だけです"),
      ]),
    );
  });

  it("応答の項目を任意にすると失敗する", () => {
    const optional = clone();
    optional.components.schemas.ExperienceProviderListResponse.required = ["providers"];
    expect(auditHostContractDocument(optional).join("\n")).toContain("ExperienceProviderListResponse: 応答の項目は常に返す");
  });
});
