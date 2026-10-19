// 合成データの mock（プレビュー・テスト専用）。本番の画面からは読み込まない。
export { createMockExperienceFetch, isMockCheckoutUrl, MOCK_SCENARIOS, type MockExperienceFetchOptions, type MockScenario } from "./mock-fetch.ts";
export { placeholderImage, placeholderSvg } from "./placeholder-image.ts";
export { buildFixtureExperiences, FIXTURE_CONSENT_VERSION, FIXTURE_IMAGE_SPECS } from "../fixtures/experiences.ts";
export { buildMockOccurrences } from "../fixtures/availability.ts";
export { toExperienceSummary } from "../fixtures/catalog.ts";
