// fixture の仮素材の SVG を mock-assets/ に書き出す（Next.js 等で静的配信したいとき用）。
import { writeFile } from "node:fs/promises";

import { FIXTURE_IMAGE_SPECS } from "../src/fixtures/experiences.ts";
import { placeholderSvg } from "../src/mock/placeholder-image.ts";

for (const spec of Object.values(FIXTURE_IMAGE_SPECS).flat()) {
  await writeFile(new URL(`../mock-assets/${spec.name}.svg`, import.meta.url), placeholderSvg(spec), "utf8");
}
console.log("wrote mock-assets/*.svg");
