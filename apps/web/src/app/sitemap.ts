import type { MetadataRoute } from "next";
import { getApi } from "@/lib/api";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Only canonical, published pages. Empty until indexing is allowed in production (#12). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!config.indexingAllowed) return [];
  const { items } = await getApi().getCatalog({});
  return [
    { url: `${config.siteUrl}/` },
    { url: `${config.siteUrl}/experiences` },
    { url: `${config.siteUrl}/host` },
    ...items.filter((i) => !i.synthetic).map((i) => ({ url: `${config.siteUrl}/experiences/${i.slug}` })),
  ];
}
