"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { DesktopGalleryViewV1, MobileGalleryViewV1, type DetailGalleryModelV1, type ImagePrimitiveProps, type PresentationPrimitivesV1 } from "@niho/experience-presentation/v1";

function GalleryImage({ src, alt, className, sizes, priority, style, srcSet: _srcSet }: ImagePrimitiveProps) {
  void _srcSet;
  return <NextImage src={src} alt={alt} fill unoptimized sizes={sizes} priority={priority} className={className} style={style} />;
}

const GALLERY_PRIMITIVES_V1: PresentationPrimitivesV1 = { Link, Image: GalleryImage };

/** Client-only behavior adapter; all gallery structure remains in the frozen package views. */
export function PresentationGalleryV1({ model }: { model: DetailGalleryModelV1 }) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  return <><MobileGalleryViewV1 model={model} index={index} onPositionChange={setIndex} primitives={GALLERY_PRIMITIVES_V1} /><DesktopGalleryViewV1 model={model} dialogRef={dialog} onOpen={() => dialog.current?.showModal()} onClose={() => dialog.current?.close()} primitives={GALLERY_PRIMITIVES_V1} /></>;
}
