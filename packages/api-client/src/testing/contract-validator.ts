/**
 * 契約の検証（Node・test 専用）。mock の応答も実 API の応答も、同じ OpenAPI の schema で検証する（docs/api-contract.md）。
 *
 * - `createContractValidator`: OpenAPI 3.0 の schema（`nullable`）を JSON Schema にして ajv で検証する。
 * - `auditContractDocument`: 契約そのものが公開の規則（閉じた形・禁止項目・応答は全項目必須）を満たすか。
 * - `findSensitiveValues`: 応答・fixture の値に、個人情報・秘密・内部 ID らしい値が混ざっていないか。
 */
import { Ajv, type ErrorObject, type ValidateFunction } from "ajv";
import addFormatsModule from "ajv-formats";

import contractDocument from "../../contract/experience-public-api.openapi.json" with { type: "json" };
import fieldPolicy from "../../contract/public-field-policy.json" with { type: "json" };

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const EXPERIENCE_CONTRACT_DOCUMENT = contractDocument as unknown as JsonObject;
export const EXPERIENCE_FIELD_POLICY = fieldPolicy;

/** OpenAPI 3.0 の schema を ajv（JSON Schema draft-07）で読める形にする。`x-` 拡張は外し、参照は `contract#/$defs/` にする。 */
export function toJsonSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toJsonSchema);
  if (!isObject(schema)) return schema;
  const converted: JsonObject = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key.startsWith("x-") || key === "nullable" || key === "example" || key === "examples") continue;
    if (key === "$ref" && typeof value === "string") {
      converted.$ref = value.replace("#/components/schemas/", "contract#/$defs/");
      continue;
    }
    if (key === "properties" && isObject(value)) {
      converted.properties = Object.fromEntries(Object.entries(value).map(([name, child]) => [name, toJsonSchema(child)]));
      continue;
    }
    converted[key] = toJsonSchema(value);
  }
  if (schema.nullable === true) {
    if (typeof converted.type === "string") {
      const { enum: enumValues, ...rest } = converted;
      const withNull: JsonObject = { ...rest, type: [converted.type, "null"] };
      if (Array.isArray(enumValues)) withNull.enum = [...enumValues, null];
      return withNull;
    }
    return { anyOf: [converted, { type: "null" }] };
  }
  return converted;
}

const addFormats = addFormatsModule as unknown as (ajv: Ajv) => Ajv;

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`);
}

export function createContractValidator(document: JsonObject = EXPERIENCE_CONTRACT_DOCUMENT) {
  const components = isObject(document.components) ? document.components : {};
  const schemas = isObject(components.schemas) ? components.schemas : {};
  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  ajv.addSchema({ $id: "contract", $defs: toJsonSchema(schemas) });
  const compiled = new Map<string, ValidateFunction>();

  function validatorFor(schemaName: string): ValidateFunction {
    const existing = compiled.get(schemaName);
    if (existing) return existing;
    if (!(schemaName in schemas)) throw new Error(`unknown schema: ${schemaName}`);
    const validate = ajv.compile({ $ref: `contract#/$defs/${schemaName}` });
    compiled.set(schemaName, validate);
    return validate;
  }

  function validateSchema(schemaName: string, value: unknown): ValidationResult {
    const validate = validatorFor(schemaName);
    return validate(value) ? { ok: true } : { ok: false, errors: formatErrors(validate.errors) };
  }

  /** operation の応答（status と本文）を検証する。本文の無い応答（404 等）は本文が空であることを確かめる。 */
  function validateResponse(operationId: string, status: number, body: unknown): ValidationResult {
    const operation = findOperation(document, operationId);
    if (!operation) return { ok: false, errors: [`unknown operation: ${operationId}`] };
    const responses = isObject(operation.responses) ? operation.responses : {};
    const declared = resolveRef(document, responses[String(status)]);
    if (!isObject(declared)) return { ok: false, errors: [`status ${status} is not declared for ${operationId}`] };
    const content = isObject(declared.content) ? declared.content : null;
    if (!content) {
      return body === null || body === undefined || body === "" ? { ok: true } : { ok: false, errors: ["response must not have a body"] };
    }
    const media = content["application/json"];
    const schema = isObject(media) ? media.schema : undefined;
    const ref = isObject(schema) && typeof schema.$ref === "string" ? schema.$ref : null;
    if (!ref) return { ok: false, errors: ["response schema must be a $ref"] };
    return validateSchema(ref.replace("#/components/schemas/", ""), body);
  }

  return { validateSchema, validateResponse };
}

export type ContractValidator = ReturnType<typeof createContractValidator>;

function resolveRef(document: JsonObject, value: unknown): unknown {
  if (!isObject(value) || typeof value.$ref !== "string") return value;
  const path = value.$ref.replace(/^#\//, "").split("/");
  let current: unknown = document;
  for (const segment of path) {
    current = isObject(current) ? current[segment] : undefined;
  }
  return current;
}

export function findOperation(document: JsonObject, operationId: string): JsonObject | null {
  const paths = isObject(document.paths) ? document.paths : {};
  for (const pathItem of Object.values(paths)) {
    if (!isObject(pathItem)) continue;
    for (const operation of Object.values(pathItem)) {
      if (isObject(operation) && operation.operationId === operationId) return operation;
    }
  }
  return null;
}

/** camelCase の名前を小文字の語に分ける（`guestEmail` → guest, email・`photoIndex` → photo, index）。 */
export function splitNameTokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());
}

function hasForbiddenToken(name: string): string | null {
  const tokens = splitNameTokens(name);
  const joined = tokens.join("");
  for (const forbidden of fieldPolicy.forbiddenNameTokens) {
    if (forbidden.length <= 3 ? tokens.includes(forbidden) : tokens.includes(forbidden) || joined.includes(forbidden)) {
      return forbidden;
    }
  }
  return null;
}

/** 契約の文書が公開の規則を満たしているか。違反の説明を返す（空なら OK）。 */
export function auditContractDocument(document: JsonObject = EXPERIENCE_CONTRACT_DOCUMENT): string[] {
  const violations: string[] = [];
  const components = isObject(document.components) ? document.components : {};
  const schemas = isObject(components.schemas) ? components.schemas : {};
  const sensitive = fieldPolicy.sensitiveRequestFields as Record<string, { fields: string[]; reason: string }>;
  const requestSchemaNames = new Set<string>();

  const paths = isObject(document.paths) ? document.paths : {};
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!path.startsWith("/api/public/experiences")) violations.push(`${path}: 公開 namespace の外です`);
    if (!isObject(pathItem)) continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!isObject(operation)) continue;
      const context = `${method.toUpperCase()} ${path}`;
      if (!Array.isArray(operation.security) || operation.security.length !== 0) violations.push(`${context}: security: [] が必要です`);
      const requestBody = isObject(operation.requestBody) ? operation.requestBody : null;
      const requestSchema = requestBody && isObject(requestBody.content) ? (requestBody.content["application/json"] as JsonObject | undefined)?.schema : undefined;
      if (isObject(requestSchema) && typeof requestSchema.$ref === "string") {
        requestSchemaNames.add(requestSchema.$ref.replace("#/components/schemas/", ""));
      }
    }
  }

  // 要求の schema から辿れる schema（任意項目を許す）
  const requestClosure = new Set<string>();
  const visit = (name: string) => {
    if (requestClosure.has(name)) return;
    requestClosure.add(name);
    JSON.stringify(schemas[name]).replace(/#\/components\/schemas\/([A-Za-z0-9]+)/g, (_match, child: string) => {
      visit(child);
      return "";
    });
  };
  requestSchemaNames.forEach(visit);

  for (const [name, schema] of Object.entries(schemas)) {
    if (!isObject(schema)) continue;
    if (schema.type !== "object") continue;
    if (schema["x-niho-public-dto"] !== true) violations.push(`${name}: x-niho-public-dto: true が必要です`);
    if (schema.additionalProperties !== false) violations.push(`${name}: additionalProperties: false が必要です`);
    const properties = isObject(schema.properties) ? Object.keys(schema.properties) : [];
    const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
    if (!requestClosure.has(name)) {
      const missing = properties.filter((property) => !required.includes(property));
      if (missing.length > 0) violations.push(`${name}: 応答の項目は常に返す（required に ${missing.join(", ")} が無い）`);
    }
    const allowedSensitive = sensitive[name]?.fields ?? [];
    for (const property of properties) {
      if (allowedSensitive.includes(property)) continue;
      if (fieldPolicy.forbiddenPropertyNames.some((forbidden) => forbidden.toLowerCase() === property.toLowerCase())) {
        violations.push(`${name}.${property}: 公開してはいけない名前です`);
        continue;
      }
      const token = hasForbiddenToken(property);
      if (token) violations.push(`${name}.${property}: 公開してはいけない語（${token}）を含みます`);
    }
    for (const field of allowedSensitive) {
      if (!properties.includes(field)) violations.push(`${name}: sensitiveRequestFields の ${field} が schema にありません`);
    }
    if (allowedSensitive.length > 0 && !requestClosure.has(name)) {
      violations.push(`${name}: 個人情報の項目は要求の schema にだけ置けます`);
    }
  }
  return violations;
}

const SENSITIVE_VALUE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Stripe の ID・鍵", pattern: /\b(acct|cus|pi|ch|re|sk|rk|pk|whsec|seti|sub|in)_[A-Za-z0-9]{8,}/ },
  { label: "保存先の objectKey", pattern: /\b(article\/image|photo-cloud|profile\/icon|uploads?)\/[A-Za-z0-9_-]+\// },
  { label: "gs:// の URL", pattern: /gs:\/\// },
  { label: "電話番号", pattern: /(?:\+81|\b0\d{1,4})[-\s]?\d{1,4}[-\s]?\d{3,4}\b/ },
  { label: "署名つき URL の資格情報", pattern: /[?&](X-Goog-Signature|X-Amz-Signature|Signature)=/ },
  { label: "DB 接続文字列", pattern: /postgres(ql)?:\/\// },
];

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

/** 値（応答・fixture）を走査し、個人情報・秘密・内部の保存先らしい値の場所を返す。 */
export function findSensitiveValues(value: unknown, path = "$"): string[] {
  const findings: string[] = [];
  if (typeof value === "string") {
    if (value.startsWith("data:image/svg+xml")) return findings;
    for (const match of value.matchAll(EMAIL_PATTERN)) {
      const domain = (match[1] ?? "").toLowerCase();
      if (!fieldPolicy.allowedValueExceptions.emailDomains.includes(domain)) findings.push(`${path}: メールアドレス`);
    }
    for (const { label, pattern } of SENSITIVE_VALUE_PATTERNS) {
      if (pattern.test(value)) findings.push(`${path}: ${label}`);
    }
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...findSensitiveValues(item, `${path}[${index}]`)));
    return findings;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) findings.push(...findSensitiveValues(child, `${path}.${key}`));
  }
  return findings;
}
