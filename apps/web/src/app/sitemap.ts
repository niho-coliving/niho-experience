import type { MetadataRoute } from "next";
import { listExperiencesForSite } from "@/lib/api";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!config.indexingAllowed || config.apiMode === "mock") return [];
  const result = await listExperiencesForSite("kamakura");
  const items = result.ok ? result.data.experiences : [];
  return [{ url: `${config.siteUrl}/` }, { url: `${config.siteUrl}/experiences` }, { url: `${config.siteUrl}/host` }, ...items.map((item) => ({ url: `${config.siteUrl}/experiences/${item.slug}`, lastModified: item.updatedAt }))];
}
