"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { PublicImage } from "@niho-experience/api-client";
import { HandIcon } from "./HandIcon";
import { Photo, SampleTag } from "./Photo";

const photoAlt = (title: string, index: number, count: number) => (index === 0 ? title : `${title}, photo ${index + 1} of ${count}`);

/** Phones: full-width swipe gallery with a position counter and a way back to the list. */
export function MobileGallery({ photos, title, preview }: { photos: PublicImage[]; title: string; preview: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;
  return (
    <div className="relative lg:hidden">
      <div
        ref={track}
        tabIndex={0}
        role="region"
        aria-label={`Photos of ${title}`}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(Math.min(count - 1, Math.round(element.scrollLeft / Math.max(1, element.clientWidth))));
        }}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
      >
        {count ? (
          photos.map((photo, i) => (
            <div key={`${photo.url}-${i}`} className="relative aspect-square w-full shrink-0 snap-start bg-sand sm:aspect-[16/10]">
              <NextImage src={photo.url} alt={photoAlt(title, i, count)} fill priority={i === 0} sizes="100vw" unoptimized className="object-cover" />
            </div>
          ))
        ) : (
          <div className="aspect-[16/10] w-full bg-sand" />
        )}
      </div>
      <Link
        href="/experiences"
        aria-label="All experiences"
        className="absolute top-3.5 left-3.5 grid size-11 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgb(0_0_0/0.15)]"
      >
        <HandIcon name="back" className="size-5 [stroke-width:2.2]" />
      </Link>
      {count > 1 ? (
        <span aria-hidden className="absolute right-3.5 bottom-3.5 rounded-full bg-ink/75 px-2.5 py-0.5 text-[0.8125rem] font-extrabold text-white">
          {index + 1} / {count}
        </span>
      ) : null}
      {preview && count ? <SampleTag className="bottom-3.5 left-3.5" /> : null}
    </div>
  );
}

/** Desktop: opens every photo in a modal dialog (Esc or the close button returns focus to this button). */
export function AllPhotosButton({ photos, title, preview }: { photos: PublicImage[]; title: string; preview: boolean }) {
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
              <Photo image={photo} alt={photoAlt(title, i, photos.length)} sizes="(min-width: 40rem) 500px, 100vw" rounded="rounded-2xl" sampleTag={preview && i === 0} />
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
