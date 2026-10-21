import { type ComponentType, type CSSProperties, type ReactNode } from "react";
export type LinkPrimitiveProps = {
    href: string;
    children?: ReactNode;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: "page";
    rel?: string;
    target?: string;
    title?: string;
};
export type ImagePrimitiveProps = {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
    srcSet?: string;
    priority?: boolean;
    style?: CSSProperties;
};
export type VideoPrimitiveProps = {
    src: string;
    poster: string;
    className?: string;
};
export type PresentationPrimitivesV1 = Readonly<{
    Link: ComponentType<LinkPrimitiveProps>;
    Image: ComponentType<ImagePrimitiveProps>;
    Video?: ComponentType<VideoPrimitiveProps>;
    Gallery?: ComponentType<{
        model: DetailGalleryModelV1;
    }>;
}>;
export type DisplayImageV1 = Readonly<{
    src: string;
    alt: string;
    srcset?: string;
    position?: string;
}>;
export type DisplayVideoV1 = Readonly<{
    src: string;
    poster: string;
}>;
export type GalleryPhotoV1 = Readonly<{
    image: DisplayImageV1;
    alt: string;
}>;
export type DetailGalleryModelV1 = Readonly<{
    title: string;
    backHref: string;
    photos: readonly GalleryPhotoV1[];
}>;
export type FaceV1 = Readonly<{
    name: string;
    initial: string;
    image: DisplayImageV1 | null;
}>;
export declare const DefaultLinkV1: ({ href, children, ...props }: LinkPrimitiveProps) => import("react").DetailedReactHTMLElement<{
    className?: string;
    "aria-label"?: string;
    "aria-current"?: "page";
    rel?: string;
    target?: string;
    title?: string;
    href: string;
}, HTMLElement>;
export declare const DefaultImageV1: ({ priority: _priority, sizes, ...props }: ImagePrimitiveProps) => import("react").DetailedReactHTMLElement<{
    sizes: string | undefined;
    src: string;
    alt: string;
    className?: string;
    srcSet?: string;
    style?: CSSProperties;
}, HTMLElement>;
export declare const DefaultVideoV1: ({ src, poster, className }: VideoPrimitiveProps) => import("react").DetailedReactHTMLElement<{
    src: string;
    poster: string;
    className: string | undefined;
    muted: boolean;
    loop: boolean;
    playsInline: boolean;
    preload: string;
    "aria-hidden": true;
    tabIndex: number;
    disablePictureInPicture: boolean;
}, HTMLElement>;
export declare const DEFAULT_PRIMITIVES_V1: PresentationPrimitivesV1;
export declare function primitivesV1(value?: Partial<PresentationPrimitivesV1>): PresentationPrimitivesV1;
