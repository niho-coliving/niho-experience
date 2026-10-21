import "../../globals.css";
// Same stylesheet as the traveler root: it carries the @font-face rules for
// Fraunces / Nunito (the presentation rules themselves are scoped to .nexp-v1).
import "@niho/experience-presentation/v1/styles.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";

// The host console (#86) has its own root: Japanese, no analytics, no site chrome,
// never indexed. Moving between it and the traveler site reloads the whole page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "ホスト | NIHO Experience", template: "%s | NIHO Experience ホスト" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function HostRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-dvh flex-col bg-canvas">
        <Script src="/host-history-guard.js" strategy="beforeInteractive" />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          本文へ移動
        </a>
        {children}
      </body>
    </html>
  );
}
