import NextImage from "next/image";
import Link from "next/link";
import type { ImagePrimitiveProps, PresentationPrimitivesV1, VideoPrimitiveProps } from "@niho/experience-presentation/v1";
import { AmbientVideo } from "./AmbientVideo";
import { PresentationGalleryV1 } from "./PresentationGalleryV1";

function PresentationImage({ src, alt, className, sizes, priority, style, srcSet: _srcSet }: ImagePrimitiveProps) {
  void _srcSet; // Next/Image derives its own srcset; the default portable image primitive uses this value.
  return <NextImage src={src} alt={alt} fill unoptimized sizes={sizes} priority={priority} className={className} style={style} />;
}

function PresentationVideo({ src, poster, className }: VideoPrimitiveProps) {
  return <AmbientVideo video={{ src, poster }} className={className} />;
}

export const PRESENTATION_PRIMITIVES_V1: PresentationPrimitivesV1 = {
  Link,
  Image: PresentationImage,
  Video: PresentationVideo,
  Gallery: PresentationGalleryV1,
};
