import NextImage from "next/image";
import type { PublicImageForSite } from "@/lib/experience-types";

/**
 * Fixed-ratio photo (no layout shift). Provisional photos carry no tag (owner decision 2026-10-20):
 * previews say so once, at the bottom of the footer.
 */
export function Photo({
  image,
  alt,
  sizes,
  priority = false,
  className = "",
  rounded = "rounded-[var(--radius-card)]",
  aspect = "aspect-[4/3]",
  imgClassName = "",
}: {
  image: PublicImageForSite | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
  aspect?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-sand ${aspect} ${rounded} ${className}`}>
      {image ? (
        <NextImage src={image.url} alt={alt} fill sizes={sizes} priority={priority} unoptimized className={`object-cover ${imgClassName}`} />
      ) : alt ? (
        <span className="flex h-full items-center justify-center text-sm text-muted" role="img" aria-label={alt}>
          Image coming soon
        </span>
      ) : null}
    </div>
  );
}
