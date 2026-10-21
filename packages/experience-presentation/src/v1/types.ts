import { createElement, type ComponentType, type CSSProperties, type ReactNode } from "react";

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
  Gallery?: ComponentType<{ model: DetailGalleryModelV1 }>;
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

export type GalleryPhotoV1 = Readonly<{ image: DisplayImageV1; alt: string }>;
export type DetailGalleryModelV1 = Readonly<{ title: string; backHref: string; photos: readonly GalleryPhotoV1[] }>;

export type FaceV1 = Readonly<{
  name: string;
  initial: string;
  image: DisplayImageV1 | null;
}>;

export const DefaultLinkV1 = ({ href, children, ...props }: LinkPrimitiveProps) => createElement("a", { href, ...props }, children);
export const DefaultImageV1 = ({ priority: _priority, sizes, ...props }: ImagePrimitiveProps) => createElement("img", { ...props, sizes });
export const DefaultVideoV1 = ({ src, poster, className }: VideoPrimitiveProps) => createElement("video", {
  src, poster, className, muted: true, loop: true, playsInline: true, preload: "metadata", "aria-hidden": true, tabIndex: -1, disablePictureInPicture: true,
});

export const DEFAULT_PRIMITIVES_V1: PresentationPrimitivesV1 = {
  Link: DefaultLinkV1,
  Image: DefaultImageV1,
  Video: DefaultVideoV1,
};

export function primitivesV1(value?: Partial<PresentationPrimitivesV1>): PresentationPrimitivesV1 {
  return { ...DEFAULT_PRIMITIVES_V1, ...value };
}
