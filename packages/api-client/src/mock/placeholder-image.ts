import type { PublicImage } from "../types.ts";

/**
 * 仮素材の画像（SVG の data URI）。合成 fixture の写真と、pilot fixture のうち仮写真を当てない画像（集合場所の外観・ロゴ）に使う。
 * 画面に「Sample」と描くので実物と誤認させない。
 * 写真の扱い（オーナー判断 2026-10-20）：pilot のプレビューは、出典を残した無料素材の仮写真（apps/web/public/sample/、CREDITS.md）を
 * 「Sample photo」表示付きで使ってよい（fixtures/pilot-experiences.ts）。実在の会員・提供者の写真としては使わない。
 * `imageBaseUrl` を渡すと `mock-assets/` の同名 SVG を配信する前提の URL にする（Next.js の画像最適化を通したい場合）。
 */
export type PlaceholderImageOptions = { imageBaseUrl?: string };

export type PlaceholderImageSpec = { name: string; label: string; hue: number };

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function placeholderSvg(spec: PlaceholderImageSpec): string {
  const background = `hsl(${spec.hue} 45% 82%)`;
  const ink = `hsl(${spec.hue} 35% 28%)`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">',
    `<rect width="1024" height="768" fill="${background}"/>`,
    `<text x="512" y="370" font-family="sans-serif" font-size="48" text-anchor="middle" fill="${ink}">${escapeXml(spec.label)}</text>`,
    `<text x="512" y="440" font-family="sans-serif" font-size="28" text-anchor="middle" fill="${ink}">Sample image</text>`,
    "</svg>",
  ].join("");
}

export function placeholderImage(spec: PlaceholderImageSpec, options: PlaceholderImageOptions = {}): PublicImage {
  if (options.imageBaseUrl) {
    return { url: `${options.imageBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(spec.name)}.svg` };
  }
  return { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg(spec))}` };
}
