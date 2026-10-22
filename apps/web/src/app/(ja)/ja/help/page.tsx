import type { Metadata } from "next";
import { HelpViewV1 } from "@niho/experience-presentation/v1";
import { PageDocumentContent } from "@/components/PageDocument";
import { JapaneseUnavailable } from "@/components/JapaneseUnavailable";
import { config } from "@/lib/config";
import { safeNihoHelpUrl } from "@/lib/safe-url";
import { assertSameJapaneseRelease, getJapaneseCopy, getJapanesePage, japaneseRenderableDocument } from "@/lib/localized-content";
import { japaneseStaticMetadata } from "@/lib/locale-metadata";

const supportEmail = "info@niho.life";
const emailHref = `mailto:${supportEmail}?subject=NIHO%20Experience`;

export async function generateMetadata(): Promise<Metadata> {
  try { return await japaneseStaticMetadata("help"); }
  catch { return { title: "Japanese help unavailable", robots: { index: false, follow: false } }; }
}

export default async function JapaneseHelpPage() {
  let data;
  try {
    const [copy, page] = await Promise.all([getJapaneseCopy(), getJapanesePage("help")]);
    assertSameJapaneseRelease(copy.releaseId, page);
    data = { copy, document: japaneseRenderableDocument(page) };
  } catch { return <JapaneseUnavailable />; }
  const helpUrl = safeNihoHelpUrl(config.nihoBookingHelpUrl, config.nihoWebOrigin);
  const content = <HelpViewV1 copy={data.copy.copy} model={{ primaryHref: helpUrl ?? emailHref, primaryLabelKey: helpUrl ? "help.niho" : "help.email", emailHref, emailLabel: supportEmail }} />;
  return <PageDocumentContent document={data.document} pageId="help" fallback={<JapaneseUnavailable />} slots={{ HelpContent: () => content }} />;
}
