import type { Metadata } from "next";
import { HelpViewV1 } from "@niho/experience-presentation/v1";
import { config } from "@/lib/config";
import { safeNihoHelpUrl } from "@/lib/safe-url";
import { englishAlternates } from "@/lib/locale-metadata";
import { getEnglishStaticCopy } from "@/lib/presentation-source";
import { getPublishedPageDocument, getPublishedPageMetadata } from "@/lib/page-documents";
import { PageDocumentContent } from "@/components/PageDocument";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageMetadata("help");
  return { title: page.title ?? "Booking help", description: page.description, robots: { index: false, follow: true }, alternates: await englishAlternates("/help", false) };
}

/** NIHO's existing public support address. No booking or customer data is put in the email link. */
const supportEmail = "info@niho.life";
const emailHref = `mailto:${supportEmail}?subject=NIHO%20Experience`;

export default async function HelpPage() {
  const helpUrl = safeNihoHelpUrl(config.nihoBookingHelpUrl, config.nihoWebOrigin);
  const [copy, document] = await Promise.all([getEnglishStaticCopy(), getPublishedPageDocument("help")]);
  const content = <HelpViewV1 copy={copy} model={{ primaryHref: helpUrl ?? emailHref, primaryLabelKey: helpUrl ? "help.niho" : "help.email", emailHref, emailLabel: supportEmail }} />;
  return <PageDocumentContent document={document} pageId="help" fallback={content} slots={{ HelpContent: () => content }} />;
}
