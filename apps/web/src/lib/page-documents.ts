import "server-only";
import { cache } from "react";
import { config } from "./config";
import { fetchPageDocument } from "./fetch-page-document";
import type { PageId } from "./page-document-contract";

// React request memoizationのみ。公開停止・rollbackをNext Data Cacheに残さない。
export const getPublishedPageDocument = cache((pageId: PageId) => config.apiMode === "mock"
  ? Promise.resolve(null)
  : fetchPageDocument(pageId, { origin: config.nihoWebOrigin }));
