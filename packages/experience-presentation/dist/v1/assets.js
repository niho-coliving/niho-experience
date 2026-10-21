import { ASSET_SOURCE_GENERATED_V1 as assetsSource, GENERATED_ASSET_DIGESTS_V1 } from "./generated.js";
export const ASSET_SCHEMA_VERSION_V1 = assetsSource.schemaVersion;
const SHA256 = /^[a-f0-9]{64}$/;
const safeReference = (value) => {
    if (value.startsWith("/"))
        return !value.startsWith("//") && !/[<>\\\s]/.test(value) && !value.split("/").includes("..");
    try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password && !/[<>\s]/.test(value);
    }
    catch {
        return false;
    }
};
const safeSrcset = (value) => value.length <= 4_000 && value.split(",").every((candidate) => {
    const match = candidate.trim().match(/^(\S+?)(?:\s+(\d+w|\d+(?:\.\d+)?x))?$/);
    return Boolean(match && safeReference(match[1]));
});
const exactKeys = (value, required, optional = []) => {
    const actual = Object.keys(value).sort();
    const allowed = [...required, ...optional];
    return required.every((key) => actual.includes(key)) && actual.every((key) => allowed.includes(key));
};
export function defaultAssetBindingsV1() {
    return Object.fromEntries(Object.entries(assetsSource.assets).map(([id, asset]) => {
        const digest = GENERATED_ASSET_DIGESTS_V1[id];
        if (!digest)
            throw new Error(`Missing generated v1 asset digest: ${id}`);
        return [id, asset.kind === "image" ? { ...asset, sha256: digest.src } : { ...asset, sha256: digest.src, posterSha256: digest.poster }];
    }));
}
export function assertAssetBindingsV1(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Invalid v1 asset bindings");
    const actual = Object.keys(value).sort();
    const expected = Object.keys(assetsSource.assets).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error("Unknown or incomplete v1 asset registry");
    for (const id of expected) {
        const asset = value[id];
        if ((asset.kind !== "image" && asset.kind !== "video") || typeof asset.src !== "string" || !safeReference(asset.src) || typeof asset.sha256 !== "string" || !SHA256.test(asset.sha256)) {
            throw new Error(`Invalid v1 asset binding: ${id}`);
        }
        if (asset.kind === "image" && (!exactKeys(asset, ["kind", "src", "alt", "sha256"], ["srcset", "position"]) || typeof asset.alt !== "string" || asset.alt.length > 500 || (asset.srcset !== undefined && (typeof asset.srcset !== "string" || !safeSrcset(asset.srcset))) || (asset.position !== undefined && (typeof asset.position !== "string" || asset.position.length > 100 || /[<>]/.test(asset.position)))))
            throw new Error(`Invalid v1 image binding: ${id}`);
        if (asset.kind === "video" && (!exactKeys(asset, ["kind", "src", "poster", "sha256", "posterSha256"]) || typeof asset.poster !== "string" || !safeReference(asset.poster) || typeof asset.posterSha256 !== "string" || !SHA256.test(asset.posterSha256))) {
            throw new Error(`Invalid v1 video binding: ${id}`);
        }
    }
}
export function createAssetBindingsV1(value = defaultAssetBindingsV1()) {
    assertAssetBindingsV1(value);
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([id, asset]) => [id, Object.freeze({ ...asset })])));
}
export function displayImageAssetV1(asset) {
    return { src: asset.src, srcset: asset.srcset, alt: asset.alt, position: asset.position };
}
export function displayVideoAssetV1(asset) {
    return { src: asset.src, poster: asset.poster };
}
