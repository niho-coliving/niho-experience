import type { ReactNode } from "react";
import type { PageDocument, PublicPropValue } from "@niho/web/core";
import { PageRenderer, type BlockRegistry } from "@niho/web/react";
import { DOCUMENT_BLOCKS, documentComponents, type DocumentBlock, type PageId } from "@/lib/page-document-contract";
import { reportDocumentFailure } from "@/lib/fetch-page-document";

export type BlockProps = Record<string, PublicPropValue>;
export type DocumentSlots = Partial<Record<DocumentBlock, (props: BlockProps) => ReactNode>>;
export const blockText = (props: BlockProps, name: string, fallback: string): string => typeof props[name] === "string" && props[name].trim() ? props[name] : fallback;

/** Server Component。既存の業務表示をclosureで接続し、文書propsと実データを混ぜない。 */
export function PageDocumentContent({ document, pageId, slots, fallback }: {
  document: PageDocument | null; pageId: PageId; slots: DocumentSlots; fallback: ReactNode;
}): ReactNode {
  if (!document) return fallback;
  try {
    const components = documentComponents(document.body);
    if (components.some((node) => !slots[node.block as DocumentBlock])) throw new Error("Block unavailable in this page context");
    const blocks: BlockRegistry = Object.fromEntries(Object.entries(slots).map(([name, slot]) => [name, {
      ...DOCUMENT_BLOCKS[name as DocumentBlock], component: (props: BlockProps) => <>{slot(props)}</>
    }]));
    return PageRenderer({ document, blocks });
  } catch { reportDocumentFailure({ pageId, reason: "context" }); return fallback; }
}
