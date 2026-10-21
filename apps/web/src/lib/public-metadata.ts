import type { Metadata } from "next";

export const SITE_DESCRIPTION = "Discover small experiences in Kamakura, offered by independent hosts and local businesses. Book as a guest, no account needed.";
export const EXPERIENCE_LIST_TITLE = "Kamakura Experiences";
export const EXPERIENCE_LIST_DESCRIPTION = "Discover small experiences in Kamakura, offered by independent hosts and local businesses. Prices are in Japanese yen, times are in JST, and no account is needed to book.";

/** No share image until the public contract includes approval for that use. */
export function publicMetadata(title: string, description: string, canonical: string): Metadata {
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "NIHO Experience", type: "website", locale: "en_US", images: [] },
    twitter: { card: "summary", title, description, images: [] },
  };
}
