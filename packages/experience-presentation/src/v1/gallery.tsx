import type { Ref } from "react";
import { HandIcon, PhotoV1 } from "./components.js";
import { EN_STATIC_COPY_V1, type StaticCopyAccessorV1 } from "./static-copy.js";
import { primitivesV1, type DetailGalleryModelV1, type PresentationPrimitivesV1 } from "./types.js";

export function MobileGalleryViewV1({ model, index = 0, onPositionChange, primitives, copy = EN_STATIC_COPY_V1 }: { model: DetailGalleryModelV1; index?: number; onPositionChange?: (index: number) => void; primitives?: Partial<PresentationPrimitivesV1>; copy?: StaticCopyAccessorV1 }) {
  const { Link, Image } = primitivesV1(primitives);
  return <div className="relative lg:hidden">
    <div tabIndex={0} role="region" aria-label={copy.text("detail.photosOf", { title: model.title })} onScroll={onPositionChange ? (event) => { const element = event.currentTarget; onPositionChange(Math.min(model.photos.length - 1, Math.round(element.scrollLeft / Math.max(1, element.clientWidth)))); } : undefined} className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto">
      {model.photos.length ? model.photos.map((photo, photoIndex) => <div key={`${photo.image.src}-${photoIndex}`} className="relative aspect-square w-full shrink-0 snap-start bg-sand sm:aspect-[16/10]"><Image src={photo.image.src} srcSet={photo.image.srcset} alt={photo.alt} priority={photoIndex === 0} sizes="100vw" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: photo.image.position }} /></div>) : <div className="aspect-[16/10] w-full bg-sand" />}
    </div>
    <Link href={model.backHref} aria-label={copy.text("chrome.allExperiences")} className="absolute top-3.5 left-3.5 grid size-11 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgb(0_0_0/0.15)]"><HandIcon name="back" className="size-5 [stroke-width:2.2]" /></Link>
    {model.photos.length > 1 ? <span aria-hidden className="absolute right-3.5 bottom-3.5 rounded-full bg-ink/75 px-2.5 py-0.5 text-[0.8125rem] font-extrabold text-white">{index + 1} / {model.photos.length}</span> : null}
  </div>;
}

export function DesktopGalleryViewV1({ model, dialogRef, dialogOpen, onOpen, onClose, primitives, copy = EN_STATIC_COPY_V1 }: { model: DetailGalleryModelV1; dialogRef?: Ref<HTMLDialogElement>; dialogOpen?: boolean; onOpen?: () => void; onClose?: () => void; primitives?: Partial<PresentationPrimitivesV1>; copy?: StaticCopyAccessorV1 }) {
  if (!model.photos.length) return null;
  const [cover, ...rest] = model.photos;
  const small = rest.slice(0, 4);
  const columns = small.length >= 3 ? "grid-cols-[2fr_1fr_1fr]" : small.length ? "grid-cols-[2fr_1fr]" : "grid-cols-1";
  return <><div className={`relative mt-7 hidden h-[466px] grid-rows-2 gap-1.5 overflow-hidden rounded-3xl lg:grid ${columns}`} role="group" aria-label={copy.text("detail.photos")}>
    <PhotoV1 image={cover!.image} alt={cover!.alt} priority primitives={primitives} aspect="" rounded="" className="row-span-2 h-full" sizes="(min-width: 64rem) 780px, 100vw" />
    {small.map((photo, index) => <PhotoV1 key={`${photo.image.src}-${index}`} image={photo.image} alt={photo.alt} primitives={primitives} aspect="" rounded="" className={`h-full min-h-0 ${small.length === 1 ? "row-span-2" : small.length === 3 && index === 2 ? "col-span-2" : ""}`} sizes="(min-width: 64rem) 300px, 50vw" />)}
    {model.photos.length > 1 ? <button type="button" onClick={onOpen} className="absolute right-4 bottom-4 z-[1] rounded-full bg-white px-4 py-2 text-sm font-extrabold text-ink shadow-[0_2px_10px_rgb(0_0_0/0.15)] hover:bg-sand">{copy.text("detail.showAllPhotos", { count: model.photos.length })}</button> : null}
  </div>{model.photos.length > 1 ? <dialog ref={dialogRef} open={dialogOpen || undefined} aria-labelledby="all-photos-heading-v1" onClick={onClose ? (event) => { if (event.target === event.currentTarget) onClose(); } : undefined} className="m-auto max-h-[90dvh] w-[min(64rem,calc(100vw_-_2rem))] overflow-y-auto rounded-3xl bg-white p-0 text-ink backdrop:bg-black/60">
    <div className="sticky top-0 z-[2] flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-4"><h2 id="all-photos-heading-v1" className="text-2xl">{copy.text("detail.allPhotos")}</h2><button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-extrabold shadow-[inset_0_0_0_1.5px_var(--color-ink)] hover:bg-sand">{copy.text("common.close")}</button></div>
    <ul className="grid gap-2 p-6 sm:grid-cols-2">{model.photos.map((photo, index) => <li key={`${photo.image.src}-${index}`}><PhotoV1 image={photo.image} alt={photo.alt} primitives={primitives} sizes="(min-width: 40rem) 500px, 100vw" rounded="rounded-2xl" /></li>)}</ul>
  </dialog> : null}</>;
}

export function DetailGalleryV1({ model, primitives, copy = EN_STATIC_COPY_V1, previewDialogOpen = false }: { model: DetailGalleryModelV1; primitives?: Partial<PresentationPrimitivesV1>; copy?: StaticCopyAccessorV1; previewDialogOpen?: boolean }) {
  return <><MobileGalleryViewV1 model={model} primitives={primitives} copy={copy} /><DesktopGalleryViewV1 model={model} dialogOpen={previewDialogOpen} primitives={primitives} copy={copy} /></>;
}
