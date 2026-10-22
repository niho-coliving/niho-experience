import type { PageDocument } from "@niho/web/core";
import type { SelectedExperienceDetailResponse } from "@niho-experience/api-client";
import type { PresentationProvenance } from "./presentation-identity";

export class JapaneseReleaseUnavailable extends Error {
  constructor(public readonly reason: "disabled" | "missing" | "invalid" | "mismatch" | "unsupported-renderer") {
    super(`Japanese release unavailable: ${reason}`);
  }
}

export function assertSameJapaneseRelease(releaseId: string, ...members: readonly { releaseId: string }[]): void {
  if (!members.every((member) => member.releaseId === releaseId)) throw new JapaneseReleaseUnavailable("mismatch");
}

export function japaneseBookingAllowed(detail: Pick<SelectedExperienceDetailResponse, "localization">): boolean {
  return detail.localization.bookingReady && detail.localization.unavailableCopyKey === null;
}

/** Authored Japanese documents need no locale-specific frozen asset sidecar. */
export function japaneseRenderableDocument(member: { presentation: PresentationProvenance; document: PageDocument }): PageDocument {
  if (member.presentation.renderingMode !== "authored") throw new JapaneseReleaseUnavailable("unsupported-renderer");
  return member.document;
}
