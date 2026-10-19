import "@fontsource-variable/fraunces";
import "@fontsource-variable/nunito";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AnalyticsSetup } from "@/components/Analytics";
import { PreviewBanner, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { config, isPreview } from "@/lib/config";

// Every page reads environment settings (indexing, API mode, host sign-up) at
// request time, so the same build can run as preview or production.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(config.siteUrl),
    title: { default: "Meet the people of Kamakura | NIHO Experience", template: "%s | NIHO Experience" },
    description: "Small experiences hosted by people who live in Kamakura: cook, craft, walk and share a table. Book as a guest, no account needed.",
    robots: config.indexingAllowed ? undefined : { index: false, follow: false },
    openGraph: { siteName: "NIHO Experience", type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbf8f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <AnalyticsSetup mode={isPreview ? "debug" : "off"} />
        {isPreview ? <PreviewBanner catalog={config.mockCatalog} /> : null}
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
