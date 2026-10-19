import NextImage from "next/image";
import type { Image } from "@niho-experience/api-client";

/**
 * Renders an experience photo. Placeholder art is labelled on screen as well
 * as in the alt text so a sample is never mistaken for the real place.
 */
export function Photo({
  image,
  sizes,
  priority = false,
  className = "",
  rounded = "rounded-[var(--radius-card)]",
  aspect = "aspect-[4/3]",
  label = true,
}: {
  image: Image;
  sizes: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
  aspect?: string;
  /** Off for thumbnails, portraits and cards that already carry a "Sample" badge. */
  label?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-sand ${aspect} ${rounded} ${className}`}>
      <NextImage
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={image.url.endsWith(".svg")}
        className="object-cover"
      />
      {image.placeholder && label ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-bold text-white" aria-hidden>
          Sample image
        </span>
      ) : null}
    </div>
  );
}
