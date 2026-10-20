import { expect, test } from "@playwright/test";

// Server-rendered HTML as a crawler sees it, without running JavaScript.
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop"));

const dinner = "/experiences/home-cooked-dinner-with-locals";

test("public pages share their canonical URL without carrying queries or unapproved images", async ({ request }) => {
  for (const path of ["/", "/experiences", "/host"]) {
    const html = await (await request.get(`${path}?utm_source=sample&token=private`)).text();
    // Next serializes an origin's root URL without the trailing slash.
    const canonical = `http://localhost:3000${path === "/" ? "" : path}`;
    expect(html).toContain(`<link rel="canonical" href="${canonical}"`);
    expect(html).toContain(`<meta property="og:url" content="${canonical}"`);
    expect(html).toContain('<meta property="og:locale" content="en_US"');
    expect(html).toContain('<meta name="twitter:card" content="summary"');
    expect(html).not.toContain('<meta property="og:image"');
    expect(html).not.toContain('<meta name="twitter:image"');
    expect(html).not.toContain('hreflang=');
  }
});

test("experience facts and links are in the initial HTML", async ({ request }) => {
  const html = await (await request.get(dinner)).text();
  for (const fact of [
    "<h1",
    "Home-cooked dinner with locals in a shared living room",
    "Komorebi Living (sample)",
    "2 hr 30 min",
    "English &amp; Japanese",
    "¥6,500",
    "Sold by",
    'href="/experiences"',
  ]) {
    expect(html, fact).toContain(fact);
  }
  expect(html).toContain('<link rel="canonical" href="https://experiences.niho.example/experiences/home-cooked-dinner-with-locals"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  // Mock preview data is never described as a live TouristTrip.
  expect(html).not.toContain('"@type":"TouristTrip"');
  expect(html).not.toContain('<meta property="og:image"');
});

test("list links reach every experience without JavaScript", async ({ request }) => {
  const html = await (await request.get("/experiences")).text();
  for (const slug of [
    "home-cooked-dinner-with-locals",
    "indigo-dyeing-with-an-artisan",
    "seaside-cycling-and-market-breakfast",
    "evening-pottery-session",
  ]) {
    expect(html).toContain(`href="/experiences/${slug}"`);
  }
  expect(html).toContain('<link rel="canonical" href="http://localhost:3000/experiences"');
  expect(html).toContain("Kamakura Experiences with Local Hosts");
});

test("legacy filter query URLs point to the main list and stay out of the index", async ({ request }) => {
  const html = await (await request.get("/experiences?theme=craft")).text();
  expect(html).toContain('<link rel="canonical" href="http://localhost:3000/experiences"');
  expect(html).toMatch(/<meta name="robots" content="noindex, (?:follow|nofollow)"/);
});

test("search result URLs are canonicalized and stay out of the index", async ({ request }) => {
  const html = await (await request.get("/experiences?q=pottery")).text();
  expect(html).toContain('<link rel="canonical" href="http://localhost:3000/experiences"');
  expect(html).toMatch(/<meta name="robots" content="noindex, (?:follow|nofollow)"/);
});

test("date and party-size filter URLs are canonicalized and stay out of the index", async ({ request }) => {
  for (const path of ["/experiences?date=2026-10-24", "/experiences?guests=2"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain('<link rel="canonical" href="http://localhost:3000/experiences"');
    expect(html, path).toMatch(/<meta name="robots" content="noindex, follow"/);
  }
});

test("preview builds are never indexable", async ({ request }) => {
  for (const path of ["/", "/host", dinner]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  }
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("<loc>");
});
