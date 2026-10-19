import type { NextConfig } from "next";

const indexingAllowed = process.env.SITE_INDEXING === "allow";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps booking URLs out of the Referer sent to Stripe or other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      // Next.js inlines its bootstrap script. A nonce-based policy is planned with #12/#15.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join("; "),
  },
  ...(indexingAllowed ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];

/** Pages that carry booking input or personal results: never cached, never indexed. */
const privatePageHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@niho-experience/api-client"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/experiences/:slug/book", headers: privatePageHeaders },
      { source: "/booking/:path*", headers: privatePageHeaders },
      { source: "/preview/:path*", headers: privatePageHeaders },
    ];
  },
};

export default nextConfig;
