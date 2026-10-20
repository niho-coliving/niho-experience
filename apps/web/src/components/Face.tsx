import NextImage from "next/image";
import type { Face } from "@/lib/card-model";

/**
 * A host's face, or their initial in a leaf circle when there is no photo. Decorative:
 * the host's name is always written next to it.
 */
export function FaceBadge({ face, className = "size-10 rounded-full text-base", sizes = "64px" }: { face: Face; className?: string; sizes?: string }) {
  if (face.image) {
    return (
      <span aria-hidden className={`block overflow-hidden bg-sand ${className}`}>
        <span className="relative block size-full">
          <NextImage src={face.image.url} alt="" fill sizes={sizes} unoptimized className="object-cover" />
        </span>
      </span>
    );
  }
  return (
    <span aria-hidden className={`grid place-items-center bg-leaf-pale font-extrabold text-moss ${className}`}>
      {face.initial}
    </span>
  );
}
