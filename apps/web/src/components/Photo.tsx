import NextImage from "next/image";
import type { PublicImage } from "@niho-experience/api-client";

/** Small, quiet tag on provisional photos so they are never mistaken for the real place or people. */
export function SampleTag({ className = "bottom-2.5 left-2.5" }: { className?: string }) {
  return <span className={`pointer-events-none absolute z-[1] rounded-full bg-ink/70 px-2 py-0.5 text-xs font-bold text-white ${className}`}>Sample photo</span>;
}

/**
 * Fixed-ratio photo (no layout shift). `sampleTag` is for large photos only (card covers, hero, one per gallery block);
 * small thumbnails never get it.
 */
export function Photo({
  image,
  alt,
  sizes,
  priority = false,
  className = "",
  rounded = "rounded-[var(--radius-card)]",
  aspect = "aspect-[4/3]",
  sampleTag = false,
  imgClassName = "",
}: {
  image: PublicImage | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
  aspect?: string;
  sampleTag?: boolean;
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
      {sampleTag && image ? <SampleTag /> : null}
    </div>
  );
}
