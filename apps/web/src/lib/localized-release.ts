import type { SelectedExperienceDetailResponse } from "@niho-experience/api-client";

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
