import NextImage from "next/image";
import type { PublicImage, PublicImageV11 } from "@niho-experience/api-client";

export function Photo({ image, alt, sizes, priority = false, className = "", rounded = "rounded-[var(--radius-card)]", aspect = "aspect-[4/3]", preview = false }: {
  image: PublicImage | PublicImageV11 | null; alt: string; sizes: string; priority?: boolean; className?: string; rounded?: string; aspect?: string; preview?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-sand ${aspect} ${rounded} ${className}`}>
      {image ? <NextImage src={image.url} alt={alt} fill sizes={sizes} priority={priority} unoptimized className="object-cover" /> :
        <span className="flex h-full items-center justify-center text-sm text-muted" role="img" aria-label={alt}>Image coming soon</span>}
      {preview ? <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-bold text-white">Sample image</span> : null}
    </div>
  );
}
