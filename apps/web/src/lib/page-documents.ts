import "server-only";
import { cache } from "react";
import { config } from "./config";
import { fetchPageDocument } from "./fetch-page-document";
import type { PageId } from "./page-document-contract";
import { getPresentationPage } from "./presentation-source";

// React request memoizationのみ。公開停止・rollbackをNext Data Cacheに残さない。
export const getPublishedPageDocument = cache(async (pageId: PageId) => {
  if (config.presentationSourceDisplayEnabled) {
    const page = await getPresentationPage(pageId);
    // Authored documents remain authored documents. A code-default page must be
    // rendered by this exact pinned consumer rather than treated as editable body.
    return page.provenance.renderingMode === "authored" ? page.document : null;
  }
  return config.apiMode === "mock" ? null : fetchPageDocument(pageId, { origin: config.nihoWebOrigin });
});

export const getPublishedPageMetadata = cache(async (pageId: PageId): Promise<{ title?: string; description?: string }> => {
  if (config.presentationSourceDisplayEnabled) {
    const page = await getPresentationPage(pageId);
    return { title: page.title, description: page.meta.description };
  }
  const document = await getPublishedPageDocument(pageId);
  return { title: document?.title };
});
