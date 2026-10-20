import type { ThemeKey } from "./themes";

/**
 * Decorative photos and videos the site itself owns (not listing photos from the API).
 *
 * SAMPLE_MEDIA: these are provisional free stock files, shown with a "Sample photo" tag
 * until NIHO's own photos and videos are shot. Replace the files (and set this to false)
 * before the production launch; sources are listed in public/sample/CREDITS.md
 * (docs/release-acceptance.md). People in these files are not NIHO hosts or guests.
 */
export const SAMPLE_MEDIA = true;

export type SiteVideo = { src: string; poster: string };
export type SitePhoto = { src: string; alt: string; position?: string };
export type Postcard = SitePhoto & { place: string; rotate: number };

const photo = (file: string) => `/sample/photos/${file}`;
const video = (name: string): SiteVideo => ({ src: `/sample/video/${name}.mp4`, poster: `/sample/video/${name}.jpg` });

export const HERO_PHOTO: SitePhoto = {
  src: photo("dinner-long-table.jpg"),
  alt: "People sharing dinner around a long table",
  position: "62% 45%",
};

export const BANNER_VIDEO: SiteVideo = video("banner-roast");

/** Short vertical clips per theme. Only themes with a listed experience are shown. */
export const STRIP_VIDEOS: Record<ThemeKey, SiteVideo> = {
  cook: video("strip-cook"),
  roast: video("strip-roast"),
  sit: video("strip-sit"),
  mend: video("strip-mend"),
  write: video("strip-write"),
};

export const POSTCARDS: Postcard[] = [
  { src: photo("kamakura-crossing.jpg"), alt: "", place: "Kamakura-Kōkōmae", rotate: -3, position: "30% 50%" },
  { src: photo("enoden-crossing.jpg"), alt: "", place: "The Enoden line", rotate: 2 },
  { src: photo("daibutsu.jpg"), alt: "", place: "The Great Buddha", rotate: -1.5, position: "40% 50%" },
  { src: photo("shichirigahama-fuji.jpg"), alt: "", place: "Shichirigahama", rotate: 3, position: "55% 50%" },
  { src: photo("bamboo.jpg"), alt: "", place: "Hōkokuji bamboo", rotate: -2.5 },
];

export const HOST_BAND_VIDEO: SiteVideo = video("coast-tram");

/** Every file referenced above, for the test that keeps them in public/sample and CREDITS.md. */
export function siteMediaFiles(): string[] {
  const videos = [BANNER_VIDEO, HOST_BAND_VIDEO, ...Object.values(STRIP_VIDEOS)].flatMap((item) => [item.src, item.poster]);
  return [HERO_PHOTO.src, ...POSTCARDS.map((card) => card.src), ...videos];
}
