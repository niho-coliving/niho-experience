import type { Metadata } from "next";
import { HelpViewV1 } from "@niho/experience-presentation/v1";
import { config } from "@/lib/config";
import { safeNihoHelpUrl } from "@/lib/safe-url";

export const metadata: Metadata = { title: "Booking help", robots: { index: false, follow: true } };

/** NIHO's existing public support address. No booking or customer data is put in the email link. */
const supportEmail = "info@niho.life";
const emailHref = `mailto:${supportEmail}?subject=NIHO%20Experience`;

export default function HelpPage() {
  const helpUrl = safeNihoHelpUrl(config.nihoBookingHelpUrl, config.nihoWebOrigin);
  return <HelpViewV1 model={{ primaryHref: helpUrl ?? emailHref, primaryLabelKey: helpUrl ? "help.niho" : "help.email", emailHref, emailLabel: supportEmail }} />;
}
