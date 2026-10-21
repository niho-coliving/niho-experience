/**
 * ホスト API の契約（contract/experience-host-api.openapi.json）の検証（Node・test 専用）。公開契約の監査
 * （`auditContractDocument`）とは別の規則で、公開契約の規則は変えない。
 *
 * - path は `/api/experience-providers` 以下と `GET /api/auth/me` だけ。各 operation の security は Bearer（`FirebaseIdToken`）だけ。
 * - 操作から辿れる schema（閉包）は `x-niho-experience-host-dto: true` の印が必須。どの操作からも辿れない schema は置かない。
 * - object は `additionalProperties: false`。閉じない schema は `host-field-policy.json` の `openSchemas` に理由と一緒に書いたものだけ。
 * - 応答だけで使う object は全項目を required にする（応答の項目は常に返す）。
 * - 項目名・引数名は `host-field-policy.json` の禁止の名前・語を含まない。
 */
import hostContractDocument from "../../contract/experience-host-api.openapi.json" with { type: "json" };
import hostFieldPolicy from "../../contract/host-field-policy.json" with { type: "json" };
import { createContractValidator, findForbiddenToken } from "./contract-validator.ts";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asObject(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

export const EXPERIENCE_HOST_CONTRACT_DOCUMENT = hostContractDocument as unknown as JsonObject;
export const EXPERIENCE_HOST_FIELD_POLICY = hostFieldPolicy;
export const EXPERIENCE_HOST_DTO_MARKER = "x-niho-experience-host-dto";

/** ホスト契約の schema で応答・値を検証する（公開契約と同じ検証器）。 */
export function createHostContractValidator(document: JsonObject = EXPERIENCE_HOST_CONTRACT_DOCUMENT) {
  return createContractValidator(document);
}

const HTTP_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);
const COMPOSITION_KEYWORDS = ["allOf", "anyOf", "oneOf", "$ref"];

type ComponentRef = { kind: string; name: string };

/** 値の中の `#/components/<kind>/<name>`（`…/properties/x` のような深い参照は根の名前）を集める。 */
function componentRefs(value: unknown): ComponentRef[] {
  const refs: ComponentRef[] = [];
  JSON.stringify(value ?? null).replace(/"#\/components\/([A-Za-z]+)\/([A-Za-z0-9_.-]+)/g, (_match, kind: string, name: string) => {
    refs.push({ kind, name });
    return "";
  });
  return refs;
}

function isBearerOnly(security: unknown, schemeName: string): boolean {
  if (!Array.isArray(security) || security.length !== 1) return false;
  const [requirement] = security;
  if (!isObject(requirement)) return false;
  const keys = Object.keys(requirement);
  return keys.length === 1 && keys[0] === schemeName && Array.isArray(requirement[schemeName]) && requirement[schemeName].length === 0;
}

/** schema の中の object の節（inline の入れ子を含む）を、場所の名前と一緒に辿る。 */
function forEachObjectNode(schema: unknown, path: string, visit: (node: JsonObject, path: string) => void): void {
  if (Array.isArray(schema)) {
    schema.forEach((item, index) => forEachObjectNode(item, `${path}[${index}]`, visit));
    return;
  }
  if (!isObject(schema)) return;
  if (schema.type === "object" || isObject(schema.properties)) visit(schema, path);
  for (const [key, value] of Object.entries(schema)) {
    if (key.startsWith("x-") || key === "example" || key === "examples" || key === "enum" || key === "description") continue;
    if (key === "properties" && isObject(value)) {
      for (const [name, child] of Object.entries(value)) forEachObjectNode(child, `${path}.${name}`, visit);
      continue;
    }
    forEachObjectNode(value, path, visit);
  }
}

/** ホスト契約が規則を満たしているか。違反の説明を返す（空なら OK）。 */
export function auditHostContractDocument(document: JsonObject = EXPERIENCE_HOST_CONTRACT_DOCUMENT): string[] {
  const violations: string[] = [];
  const policy = hostFieldPolicy;
  const exactPaths = policy.exactPaths as Record<string, string[]>;
  const components = asObject(document.components);
  const schemas = asObject(components.schemas);
  const openSchemas = new Set(Object.keys(policy.openSchemas));

  const schemes = asObject(components.securitySchemes);
  const schemeNames = Object.keys(schemes);
  if (schemeNames.length !== 1 || schemeNames[0] !== policy.securityScheme) {
    violations.push(`securitySchemes は ${policy.securityScheme} だけにします（今: ${schemeNames.join(", ") || "なし"}）`);
  }
  const scheme = asObject(schemes[policy.securityScheme]);
  if (scheme.type !== "http" || scheme.scheme !== "bearer") violations.push(`${policy.securityScheme}: type: http・scheme: bearer が必要です`);
  if (document.security !== undefined) violations.push("文書全体の security は置かず、operation ごとに Bearer を書きます");

  const requestRoots: ComponentRef[] = [];
  const responseRoots: ComponentRef[] = [];
  const parameterNames: Array<{ context: string; name: string }> = [];
  const operationIds = new Set<string>();

  const collectParameters = (context: string, parameters: unknown) => {
    if (!Array.isArray(parameters)) return;
    for (const parameter of parameters) {
      const resolved = isObject(parameter) && typeof parameter.$ref === "string"
        ? asObject(asObject(components.parameters)[parameter.$ref.replace("#/components/parameters/", "")])
        : asObject(parameter);
      if (typeof resolved.name === "string") parameterNames.push({ context, name: resolved.name });
      requestRoots.push(...componentRefs(resolved.schema));
    }
  };

  for (const [path, pathItem] of Object.entries(asObject(document.paths))) {
    const allowedMethods = exactPaths[path];
    const underPrefix = policy.pathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    if (!allowedMethods && !underPrefix) violations.push(`${path}: ホスト API の範囲（${[...policy.pathPrefixes, ...Object.keys(exactPaths)].join("・")}）の外です`);
    if (!isObject(pathItem)) continue;
    collectParameters(path, pathItem.parameters);
    for (const [method, value] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || !isObject(value)) continue;
      const context = `${method.toUpperCase()} ${path}`;
      if (allowedMethods && !allowedMethods.includes(method)) violations.push(`${context}: この path で使える method は ${allowedMethods.join(", ").toUpperCase()} だけです`);
      if (typeof value.operationId !== "string") violations.push(`${context}: operationId が必要です`);
      else if (operationIds.has(value.operationId)) violations.push(`${context}: operationId ${value.operationId} が重複しています`);
      else operationIds.add(value.operationId);
      if (!isBearerOnly(value.security, policy.securityScheme)) violations.push(`${context}: security は [{ ${policy.securityScheme}: [] }] だけにします`);
      collectParameters(context, value.parameters);
      requestRoots.push(...componentRefs(value.requestBody));
      for (const response of Object.values(asObject(value.responses))) {
        const refs = componentRefs(response);
        for (const ref of refs) {
          if (ref.kind === "responses") responseRoots.push(...componentRefs(asObject(components.responses)[ref.name]));
          else responseRoots.push(ref);
        }
      }
    }
  }

  const closureOf = (roots: ComponentRef[]): Set<string> => {
    const closure = new Set<string>();
    const visit = (name: string) => {
      if (closure.has(name)) return;
      closure.add(name);
      if (!(name in schemas)) {
        violations.push(`#/components/schemas/${name}: 参照先の schema がありません`);
        return;
      }
      for (const ref of componentRefs(schemas[name])) if (ref.kind === "schemas") visit(ref.name);
    };
    roots.filter((ref) => ref.kind === "schemas").forEach((ref) => visit(ref.name));
    return closure;
  };
  const requestClosure = closureOf(requestRoots);
  const responseClosure = closureOf(responseRoots);
  const closure = new Set([...requestClosure, ...responseClosure]);

  for (const name of openSchemas) {
    if (!(name in schemas)) violations.push(`host-field-policy.json の openSchemas の ${name} が契約にありません`);
  }

  for (const [name, schema] of Object.entries(schemas)) {
    if (!closure.has(name)) {
      violations.push(`${name}: どの操作からも辿れない schema です（書き出しの範囲を確かめる）`);
      continue;
    }
    if (!isObject(schema)) continue;
    if (schema[EXPERIENCE_HOST_DTO_MARKER] !== true) violations.push(`${name}: ${EXPERIENCE_HOST_DTO_MARKER}: true が必要です`);
    const open = openSchemas.has(name);
    const responseOnly = !requestClosure.has(name);
    forEachObjectNode(schema, name, (node, path) => {
      const properties = isObject(node.properties) ? Object.keys(node.properties) : [];
      const wrapper = properties.length === 0 && COMPOSITION_KEYWORDS.some((keyword) => keyword in node);
      if (!open && !wrapper && node.additionalProperties !== false) violations.push(`${path}: additionalProperties: false が必要です`);
      if (responseOnly && properties.length > 0) {
        const required = Array.isArray(node.required) ? (node.required as string[]) : [];
        const missing = properties.filter((property) => !required.includes(property));
        if (missing.length > 0) violations.push(`${path}: 応答の項目は常に返す（required に ${missing.join(", ")} が無い）`);
      }
      for (const property of properties) {
        const violation = forbiddenNameViolation(property);
        if (violation) violations.push(`${path}.${property}: ${violation}`);
      }
    });
  }

  for (const { context, name } of parameterNames) {
    const violation = forbiddenNameViolation(name);
    if (violation) violations.push(`${context} の引数 ${name}: ${violation}`);
  }
  return violations;
}

function forbiddenNameViolation(name: string): string | null {
  if (hostFieldPolicy.forbiddenPropertyNames.some((forbidden) => forbidden.toLowerCase() === name.toLowerCase())) {
    return "ホスト API に入れてはいけない名前です";
  }
  const token = findForbiddenToken(name, hostFieldPolicy.forbiddenNameTokens);
  return token ? `ホスト API に入れてはいけない語（${token}）を含みます` : null;
}
