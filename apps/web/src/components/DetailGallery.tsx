"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { PublicImageForSite } from "@/lib/experience-types";
import { imageAlt } from "@/lib/experience-copy";
import { HandIcon } from "./HandIcon";
import { Photo } from "./Photo";

const photoAlt = (photo: PublicImageForSite, title: string, index: number, count: number) => imageAlt(photo, index === 0 ? title : `${title}, photo ${index + 1} of ${count}`);

/** Phones: full-width swipe gallery with a position counter and a way back to the list. */
export function MobileGallery({ photos, title, backHref = "/experiences" }: { photos: PublicImageForSite[]; title: string; backHref?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const galleryId = useId();
  function showPhoto(next: number) {
    const element = track.current;
    if (!element || !count) return;
    const position = Math.max(0, Math.min(count - 1, next));
    element.scrollTo({ left: position * element.clientWidth, behavior: "instant" });
    setIndex(position);
  }
  return (
    <div className="relative lg:hidden">
      <div
        ref={track}
        id={galleryId}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`Photos of ${title}`}
        aria-describedby={count > 1 ? `${galleryId}-help` : undefined}
        onKeyDown={(event) => {
          const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
          if (next !== null) { event.preventDefault(); showPhoto(next); }
        }}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(Math.max(0, Math.min(count - 1, Math.round(element.scrollLeft / Math.max(1, element.clientWidth)))));
        }}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
      >
        {count ? (
          photos.map((photo, i) => (
            <div key={`${photo.url}-${i}`} className="relative aspect-square w-full shrink-0 snap-start bg-sand sm:aspect-[16/10]">
              <GalleryImage photo={photo} alt={photoAlt(photo, title, i, count)} priority={i === 0} />
            </div>
          ))
        ) : (
          <div role="img" aria-label={`Photos of ${title} are not available`} className="aspect-[16/10] w-full bg-sand" />
        )}
      </div>
      {count > 1 ? <p id={`${galleryId}-help`} className="sr-only">Use the left and right arrow keys to browse photos.</p> : null}
      <Link
        href={backHref}
        aria-label="All experiences"
        className="absolute top-3.5 left-3.5 grid size-11 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgb(0_0_0/0.15)]"
      >
        <HandIcon name="back" className="size-5 [stroke-width:2.2]" />
      </Link>
      {count > 1 ? (
        <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1 rounded-full bg-ink/85 p-1 text-[0.8125rem] font-extrabold text-white">
          <button type="button" aria-label="Previous photo" aria-controls={galleryId} disabled={index === 0} onClick={() => showPhoto(index - 1)} className="grid size-9 place-items-center rounded-full hover:bg-white/20 disabled:opacity-40"><HandIcon name="back" className="size-5" /></button>
          <span role="status" aria-atomic="true" className="min-w-12 text-center"><span className="sr-only">Photo {index + 1} of {count}</span><span aria-hidden>{index + 1} / {count}</span></span>
          <button type="button" aria-label="Next photo" aria-controls={galleryId} disabled={index === count - 1} onClick={() => showPhoto(index + 1)} className="grid size-9 place-items-center rounded-full hover:bg-white/20 disabled:opacity-40"><HandIcon name="back" className="size-5 rotate-180" /></button>
        </div>
      ) : null}
    </div>
  );
}

function GalleryImage({ photo, alt, priority }: { photo: PublicImageForSite; alt: string; priority: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span role="img" aria-label={alt} className="flex h-full items-center justify-center text-sm text-muted">Photo unavailable</span> :
    <NextImage src={photo.url} alt={alt} fill priority={priority} sizes="100vw" unoptimized className="object-cover" onError={() => setFailed(true)} />;
}

/** Desktop: opens every photo in a modal dialog (Esc or the close button returns focus to this button). */
export function AllPhotosButton({ photos, title }: { photos: PublicImageForSite[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="absolute right-4 bottom-4 z-[1] rounded-full bg-white px-4 py-2 text-sm font-extrabold text-ink shadow-[0_2px_10px_rgb(0_0_0/0.15)] hover:bg-sand"
      >
        Show all {photos.length} photos
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="all-photos-heading"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto max-h-[90dvh] w-[min(64rem,calc(100vw_-_2rem))] overflow-y-auto rounded-3xl bg-white p-0 text-ink backdrop:bg-black/60"
      >
        <div className="sticky top-0 z-[2] flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-4">
          <h2 id="all-photos-heading" className="text-2xl">
            All photos
          </h2>
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full px-4 py-2 text-sm font-extrabold shadow-[inset_0_0_0_1.5px_var(--color-ink)] hover:bg-sand">
            Close
          </button>
        </div>
        <ul className="grid gap-2 p-6 sm:grid-cols-2">
          {photos.map((photo, i) => (
            <li key={`${photo.url}-${i}`}>
              <Photo image={photo} alt={photoAlt(photo, title, i, photos.length)} sizes="(min-width: 40rem) 500px, 100vw" rounded="rounded-2xl" />
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
