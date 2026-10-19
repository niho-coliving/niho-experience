import { expect, test } from "@playwright/test";

// Server-rendered HTML as a crawler sees it, without running JavaScript.
// The viewport does not matter here, so one project is enough.
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop"));

test("experience facts and links are in the initial HTML", async ({ request }) => {
  const html = await (await request.get("/experiences/neighborhood-dinner-table")).text();
  for (const fact of [
    "<h1",
    "Home-style dinner at a neighborhood table",
    "Mika",
    "2 hr 30 min",
    "English, Japanese",
    "¥6,800",
    "Free cancellation up to 3 days before",
    "Sold by",
    'href="/experiences"',
  ]) {
    expect(html, fact).toContain(fact);
  }
  expect(html).toContain('<link rel="canonical" href="http://localhost:3000/experiences/neighborhood-dinner-table"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  // Sample listings never get product markup.
  expect(html).not.toContain('"@type":"TouristTrip"');
});

test("list links reach every experience without JavaScript", async ({ request }) => {
  const html = await (await request.get("/experiences")).text();
  for (const slug of ["neighborhood-dinner-table", "morning-hill-walk-and-tea", "lacquer-carving-workshop"]) {
    expect(html).toContain(`href="/experiences/${slug}"`);
  }
  expect(html).toContain('<link rel="canonical" href="http://localhost:3000/experiences"');
});

test("filtered lists point to the main list and stay out of the index", async ({ request }) => {
  const html = await (await request.get("/experiences?theme=craft")).text();
  expect(html).toContain('<link rel="canonical" href="http://localhost:3000/experiences"');
  expect(html).toMatch(/<meta name="robots" content="noindex/);
});

test("preview builds are never indexable", async ({ request }) => {
  for (const path of ["/", "/host", "/experiences/neighborhood-dinner-table"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  }
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("<loc>");
});
