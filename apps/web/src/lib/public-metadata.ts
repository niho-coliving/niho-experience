import type { Metadata } from "next";

export const SITE_DESCRIPTION = "Small experiences hosted by people who live in Kamakura: cook, craft, walk and share a table. Book as a guest, no account needed.";

/** No share image until the public contract includes approval for that use. */
export function publicMetadata(title: string, description: string, canonical: string): Metadata {
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "NIHO Experience", type: "website", locale: "en_US", images: [] },
    twitter: { card: "summary", title, description, images: [] },
  };
}
