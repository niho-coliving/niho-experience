import type { ReactNode } from "react";
import type { PageDocument } from "@niho/web/core";
import { splitChromeDocument } from "@/lib/page-document-contract";
import { SiteHeader, SiteFooter, type PreviewCatalog } from "./SiteChrome";
import { PageDocumentContent, blockText, type DocumentSlots } from "./PageDocument";
import { PresentationRootV1 } from "@niho/experience-presentation/v1";

/** `preview` adds the preview line at the bottom of the footer (previews only), with or without a published chrome document. */
export function DocumentChrome({ document, children, preview = null }: { document: PageDocument | null; children?: ReactNode; preview?: PreviewCatalog | null }) {
  const parts = document ? splitChromeDocument(document) : null;
  const slots: DocumentSlots = {
    SiteHeader: (props) => <SiteHeader brandLabel={blockText(props, "brandLabel", "")} exploreLabel={blockText(props, "exploreLabel", "Experiences")} hostLabel={blockText(props, "hostLabel", "")} />,
    SiteFooter: (props) => <SiteFooter description={typeof props.description === "string" ? props.description : undefined} copyright={blockText(props, "copyright", "")} preview={preview} />
  };
  return <PresentationRootV1 className="flex min-h-dvh flex-1 flex-col">
    <PageDocumentContent document={parts?.header ?? null} pageId="chrome" slots={slots} fallback={<SiteHeader />} />
    <main id="main" className="flex-1">{children}</main>
    <PageDocumentContent document={parts?.footer ?? null} pageId="chrome" slots={slots} fallback={<SiteFooter preview={preview} />} />
  </PresentationRootV1>;
}
