import { COPY_REGISTRY_GENERATED_V1 as registry } from "./generated.js";
export const COPY_SCHEMA_VERSION_V1 = registry.schemaVersion;
export const COPY_REGISTRY_V1 = registry.definitions;
const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/g;
const sortedPlaceholders = (value) => [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
export function defaultCopyValuesV1() {
    return Object.fromEntries(Object.entries(COPY_REGISTRY_V1).map(([key, definition]) => [key, definition.default]));
}
export function assertCopyValuesV1(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Invalid v1 copy values");
    const actual = Object.keys(value).sort();
    const expected = Object.keys(COPY_REGISTRY_V1).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error("Unknown or incomplete v1 copy registry");
    for (const key of expected) {
        const text = value[key];
        const placeholders = [...COPY_REGISTRY_V1[key].placeholders].sort();
        if (typeof text !== "string" || text.length > 2_000 || /[<>]/.test(text) || JSON.stringify(sortedPlaceholders(text)) !== JSON.stringify(placeholders)) {
            throw new Error(`Invalid v1 copy value: ${key}`);
        }
    }
}
export function createCopyV1(values = defaultCopyValuesV1()) {
    assertCopyValuesV1(values);
    const frozenValues = Object.freeze({ ...values });
    return {
        values: frozenValues,
        text(key, interpolation = {}) {
            return frozenValues[key].replace(PLACEHOLDER, (_match, placeholder) => {
                const replacement = interpolation[placeholder];
                if (replacement === undefined)
                    throw new Error(`Missing v1 copy placeholder: ${key}.${placeholder}`);
                return String(replacement);
            });
        },
    };
}
export const EN_COPY_V1 = createCopyV1();
