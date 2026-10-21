import { STATIC_COPY_REGISTRY_GENERATED_V1 as registry } from "./generated.js";

export const STATIC_COPY_SCHEMA_VERSION_V1 = registry.schemaVersion;
export const STATIC_COPY_REGISTRY_V1 = registry.definitions;
export type StaticCopyKeyV1 = keyof typeof STATIC_COPY_REGISTRY_V1;
export type RichStaticCopyKeyV1 = {
  [Key in StaticCopyKeyV1]: (typeof STATIC_COPY_REGISTRY_V1)[Key] extends { readonly markers: readonly [string, ...string[]] } ? Key : never;
}[StaticCopyKeyV1];
export type PlainStaticCopyKeyV1 = Exclude<StaticCopyKeyV1, RichStaticCopyKeyV1>;
export type StaticCopyValuesV1 = Readonly<Record<StaticCopyKeyV1, string>>;
export type RichTextSegmentV1 = Readonly<{ text: string; emphasis: boolean }>;

const TOKEN = /\{(\/?)([A-Za-z][A-Za-z0-9]*)\}/g;

function definitionMarkers(key: StaticCopyKeyV1): readonly string[] {
  const definition = STATIC_COPY_REGISTRY_V1[key] as { markers?: readonly string[] };
  return definition.markers ?? [];
}

function validateMessage(key: StaticCopyKeyV1, value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length > 2_000 || /[<>]/.test(value)) throw new Error(`Invalid v1 static copy value: ${key}`);
  const expectedPlaceholders = [...STATIC_COPY_REGISTRY_V1[key].placeholders].sort();
  const expectedMarkers = [...definitionMarkers(key)].sort();
  const placeholders: string[] = [];
  const openedMarkers: string[] = [];
  const closedMarkers: string[] = [];
  const stack: string[] = [];
  for (const match of value.matchAll(TOKEN)) {
    const closing = match[1] === "/";
    const name = match[2]!;
    if (expectedMarkers.includes(name)) {
      if (closing) {
        if (stack.pop() !== name) throw new Error(`Invalid v1 static copy marker order: ${key}`);
        closedMarkers.push(name);
      } else {
        if (stack.length) throw new Error(`Nested v1 static copy markers are not supported: ${key}`);
        stack.push(name);
        openedMarkers.push(name);
      }
    } else if (closing) {
      throw new Error(`Unknown v1 static copy marker: ${key}.${name}`);
    } else {
      placeholders.push(name);
    }
  }
  if (stack.length || JSON.stringify(openedMarkers.sort()) !== JSON.stringify(expectedMarkers) || JSON.stringify(closedMarkers.sort()) !== JSON.stringify(expectedMarkers) || JSON.stringify(placeholders.sort()) !== JSON.stringify(expectedPlaceholders)) {
    throw new Error(`Invalid v1 static copy tokens: ${key}`);
  }
}

export function defaultStaticCopyValuesV1(): StaticCopyValuesV1 {
  return Object.fromEntries(Object.entries(STATIC_COPY_REGISTRY_V1).map(([key, definition]) => [key, definition.default])) as StaticCopyValuesV1;
}

export function assertStaticCopyValuesV1(value: unknown): asserts value is StaticCopyValuesV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid v1 static copy values");
  const actual = Object.keys(value).sort();
  const expected = Object.keys(STATIC_COPY_REGISTRY_V1).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Unknown or incomplete v1 static copy registry");
  for (const key of expected as StaticCopyKeyV1[]) validateMessage(key, (value as Record<string, unknown>)[key]);
}

function interpolate(key: StaticCopyKeyV1, value: string, interpolation: Readonly<Record<string, string | number>>): string {
  const markers = definitionMarkers(key);
  return value.replace(TOKEN, (match, closing: string, name: string) => {
    if (markers.includes(name)) return match;
    const replacement = interpolation[name];
    if (closing || replacement === undefined) throw new Error(`Missing v1 static copy placeholder: ${key}.${name}`);
    return String(replacement);
  });
}

export type StaticCopyAccessorV1 = Readonly<{
  values: StaticCopyValuesV1;
  text: (key: PlainStaticCopyKeyV1, interpolation?: Readonly<Record<string, string | number>>) => string;
  rich: (key: StaticCopyKeyV1, interpolation?: Readonly<Record<string, string | number>>) => readonly RichTextSegmentV1[];
}>;

export function createStaticCopyV1(values: StaticCopyValuesV1 = defaultStaticCopyValuesV1()): StaticCopyAccessorV1 {
  assertStaticCopyValuesV1(values);
  const frozenValues = Object.freeze({ ...values });
  return {
    values: frozenValues,
    text(key, interpolation = {}) {
      if (definitionMarkers(key).length) throw new Error(`Rich v1 static copy must be rendered as segments: ${key}`);
      return interpolate(key, frozenValues[key], interpolation);
    },
    rich(key, interpolation = {}) {
      const markers = definitionMarkers(key);
      const template = frozenValues[key];
      if (!markers.length) return Object.freeze([{ text: interpolate(key, template, interpolation), emphasis: false }]);
      const segments: RichTextSegmentV1[] = [];
      let emphasis = false;
      let cursor = 0;
      for (const match of template.matchAll(TOKEN)) {
        if (match.index! > cursor) segments.push(Object.freeze({ text: template.slice(cursor, match.index), emphasis }));
        const name = match[2]!;
        if (markers.includes(name)) emphasis = match[1] !== "/";
        else {
          const replacement = interpolation[name];
          if (replacement === undefined) throw new Error(`Missing v1 static copy placeholder: ${key}.${name}`);
          segments.push(Object.freeze({ text: String(replacement), emphasis }));
        }
        cursor = match.index! + match[0].length;
      }
      if (cursor < template.length) segments.push(Object.freeze({ text: template.slice(cursor), emphasis }));
      return Object.freeze(segments);
    },
  };
}

export const EN_STATIC_COPY_V1 = createStaticCopyV1();
