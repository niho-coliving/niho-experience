"use client";

import { useRef, useState } from "react";
import { DesktopGalleryViewV1, MobileGalleryViewV1, type DetailGalleryModelV1 } from "@niho/experience-presentation/v1";
import type { PublicImageForSite } from "@/lib/experience-types";
import { imageAlt } from "@/lib/experience-copy";
import { PRESENTATION_PRIMITIVES_V1 } from "./PresentationV1";

function galleryModel(photos: PublicImageForSite[], title: string, backHref = "/experiences"): DetailGalleryModelV1 {
  return {
    title,
    backHref,
    photos: photos.map((photo, index) => {
      const alt = imageAlt(photo, index === 0 ? title : `${title}, photo ${index + 1} of ${photos.length}`);
      return { image: { src: photo.url, alt }, alt };
    }),
  };
}

/** Public controller owns swipe position; frozen v1 owns the actual mobile gallery markup. */
export function MobileGallery({ photos, title, backHref = "/experiences" }: { photos: PublicImageForSite[]; title: string; backHref?: string }) {
  const [index, setIndex] = useState(0);
  return <MobileGalleryViewV1 model={galleryModel(photos, title, backHref)} index={index} onPositionChange={setIndex} primitives={PRESENTATION_PRIMITIVES_V1} />;
}

/** Public controller owns dialog effects; frozen v1 owns the mosaic, trigger and canonical dialog. */
export function DesktopGallery({ photos, title }: { photos: PublicImageForSite[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <DesktopGalleryViewV1 model={galleryModel(photos, title)} dialogRef={dialog} onOpen={() => dialog.current?.showModal()} onClose={() => dialog.current?.close()} primitives={PRESENTATION_PRIMITIVES_V1} />;
}
