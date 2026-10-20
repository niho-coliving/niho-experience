// 公開文書のSSR検証専用。外部サービス・実原稿・資格情報へ接続しない。
import { createServer } from "node:http";
import { createMockExperienceFetch } from "../../../../packages/api-client/src/mock/index.ts";
import { publishedDocument } from "../../src/lib/testing/page-document-fixtures.ts";

const port = Number(process.env.DOCUMENT_API_PORT ?? 3251);
const mockFetch = createMockExperienceFetch({ imageBaseUrl: "http://127.0.0.1:3250" });
const modes = new Map();
createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname === "/__test/reset") { modes.clear(); response.end("ok"); return; }
  if (url.pathname === "/__test/mode") { modes.set(url.searchParams.get("page"), url.searchParams.get("mode")); response.end("ok"); return; }
  const page = /^\/api\/public\/experiences\/pages\/(home|experiences|experience-detail|host|chrome)\/en$/.exec(url.pathname)?.[1];
  let result;
  if (page) {
    const mode = modes.get(page);
    const document = publishedDocument(page);
    if (mode === "missing") result = new Response("not found", { status: 404 });
    else if (mode === "error") result = new Response("private diagnostic must not appear", { status: 503 });
    else if (mode === "invalid") result = Response.json({ ...document, siteId: "wrong-site" });
    else result = Response.json(document, { headers: { "cache-control": "no-store" } });
  } else result = await mockFetch(url);
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(Buffer.from(await result.arrayBuffer()));
}).listen(port, "127.0.0.1");
