/** 選別された公開OpenAPIのschema検証。Node/SSR用。テストとconsumerで同じ定義を使う。 */
import { Ajv, type ErrorObject, type ValidateFunction } from "ajv";
import addFormatsModule from "ajv-formats";
import contractDocument from "../contract/experience-public-api.openapi.json" with { type: "json" };

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);

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
    // `allOf` / `$ref` などの合成は null にも効くので、型の和ではなく anyOf で null を足す（OpenAPI 3.0 の nullable は全体に効く）
    const composed = ["allOf", "anyOf", "oneOf", "$ref"].some((keyword) => keyword in converted);
    if (typeof converted.type === "string" && !composed) {
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

export function createPublicSchemaValidator(document: JsonObject = contractDocument as unknown as JsonObject) {
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

  return (schemaName: string, value: unknown): ValidationResult => {
    const validate = validatorFor(schemaName);
    return validate(value) ? { ok: true } : { ok: false, errors: formatErrors(validate.errors) };
  };
}
