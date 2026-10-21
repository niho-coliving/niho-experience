import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!config.indexingAllowed) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/experiences/*/book", "/booking/", "/preview/", "/host/"] },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
