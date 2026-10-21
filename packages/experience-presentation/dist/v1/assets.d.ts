import { ASSET_SOURCE_GENERATED_V1 as assetsSource } from "./generated.js";
import type { DisplayImageV1, DisplayVideoV1 } from "./types.js";
export declare const ASSET_SCHEMA_VERSION_V1: 1;
export type AssetIdV1 = keyof typeof assetsSource.assets;
export type ImageAssetV1 = Readonly<{
    kind: "image";
    src: string;
    srcset?: string;
    alt: string;
    position?: string;
    sha256: string;
}>;
export type VideoAssetV1 = Readonly<{
    kind: "video";
    src: string;
    poster: string;
    sha256: string;
    posterSha256: string;
}>;
export type DecorativeAssetV1 = ImageAssetV1 | VideoAssetV1;
export type AssetBindingsV1 = Readonly<Record<AssetIdV1, DecorativeAssetV1>>;
export declare function defaultAssetBindingsV1(): AssetBindingsV1;
export declare function assertAssetBindingsV1(value: unknown): asserts value is AssetBindingsV1;
export declare function createAssetBindingsV1(value?: AssetBindingsV1): AssetBindingsV1;
export declare function displayImageAssetV1(asset: ImageAssetV1): DisplayImageV1;
export declare function displayVideoAssetV1(asset: VideoAssetV1): DisplayVideoV1;
