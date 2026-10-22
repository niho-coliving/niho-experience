import "server-only";
import { NO_JOURNEY_EXTRAS, usableConditions, type JourneyDetailExtras } from "@niho-experience/api-client";
import { config } from "./config";

/**
 * The guest-journey data that the NIHO contract does not carry yet (Epic #103): participation conditions and whether
 * questions to the host are open. Only the mock serves it; with a real API this is empty and the screens show none of the
 * new parts. When NIHO's contract lands, read and validate it here so the screens keep using `JourneyDetailExtras`.
 */
export async function getJourneyExtras(slug: string): Promise<JourneyDetailExtras> {
  if (config.journeyApi !== "mock") return NO_JOURNEY_EXTRAS;
  const { journeyExtrasFor } = await import("@niho-experience/api-client/mock");
  const extras = journeyExtrasFor(slug);
  return { enabled: extras.enabled, conditions: usableConditions(extras.conditions), questionsOpen: extras.questionsOpen };
}
