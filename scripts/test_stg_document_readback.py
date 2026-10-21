#!/usr/bin/env python3

from __future__ import annotations

import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from stg_document_readback import EXPECTED_HOST_URL, ReadbackError, run_readback


class Scenario:
    csp_origin = None
    document_status = 200
    document_page = "home"
    cache_control = "private, no-store"
    script_only = False
    document_texts = ["Published & safe text"]
    rendered_texts = ["Published & safe text"]
    rendered_scope_revision = 7
    header_text = "Common header"
    preview_status = 404
    host_url = EXPECTED_HOST_URL


def document() -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "siteId": "experience",
        "pageId": Scenario.document_page,
        "locale": "en",
        "revision": 7,
        "title": "Synthetic test document",
        "tokens": {},
        "body": [
            {
                "type": "element",
                "id": f"copy-{index}",
                "tag": "p",
                "children": [{"type": "text", "text": text}],
            }
            for index, text in enumerate(Scenario.document_texts)
        ],
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/api/public/experiences/pages/home/en":
            payload = json.dumps(document()).encode()
            self.send_response(Scenario.document_status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", Scenario.cache_control)
        elif self.path == "/":
            scope_values = ("experience", "home", "en", str(Scenario.rendered_scope_revision))
            scope = "nw-" + "-".join(f"{len(value)}-{value}" for value in scope_values)
            rendered = "".join(f"<p>{text.replace('&', '&amp;')}</p>" for text in Scenario.rendered_texts)
            if Scenario.script_only:
                rendered = f"<script>{rendered}</script>"
            payload = (
                f'<!doctype html><html><body><header>{Scenario.header_text}</header>'
                f'<main data-nw-scope="{scope}">{rendered}</main></body></html>'
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            origin = Scenario.csp_origin or f"http://127.0.0.1:{self.server.server_port}"
            self.send_header("Content-Security-Policy", f"default-src 'self'; connect-src 'self' {origin}")
        elif self.path == "/experiences":
            payload = b"<html><body>Experiences</body></html>"
            self.send_response(200)
        elif self.path == "/host":
            payload = f'<html><body><a href="{Scenario.host_url}">Host</a></body></html>'.encode()
            self.send_response(200)
        elif self.path == "/robots.txt":
            payload = b"User-agent: *\nDisallow: /\n"
            self.send_response(200)
        elif self.path in {"/preview/states", "/preview/checkout"}:
            payload = b"preview"
            self.send_response(Scenario.preview_status)
        else:
            payload = b"not found"
            self.send_response(404)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:
        return


class StgDocumentReadbackTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self) -> None:
        Scenario.csp_origin = None
        Scenario.document_status = 200
        Scenario.document_page = "home"
        Scenario.cache_control = "private, no-store"
        Scenario.script_only = False
        Scenario.document_texts = ["Published & safe text"]
        Scenario.rendered_texts = ["Published & safe text"]
        Scenario.rendered_scope_revision = 7
        Scenario.header_text = "Common header"
        Scenario.preview_status = 404
        Scenario.host_url = EXPECTED_HOST_URL

    def readback(self):
        return run_readback(self.origin, self.origin, "niho-experience-preview-test", retries=1, timeout=1)

    def test_success(self) -> None:
        result = self.readback()
        self.assertEqual(result.document_revision, 7)
        self.assertEqual(result.text_nodes, 1)
        self.assertEqual(result.matched_text_nodes, 1)
        self.assertEqual(result.statuses["preview_checkout"], 404)

    def test_csp_must_allow_api_origin(self) -> None:
        Scenario.csp_origin = "https://niho.life"
        with self.assertRaisesRegex(ReadbackError, "CSP does not permit"):
            self.readback()

    def test_document_404_fails(self) -> None:
        Scenario.document_status = 404
        with self.assertRaisesRegex(ReadbackError, "did not return 200"):
            self.readback()

    def test_text_only_in_script_fails(self) -> None:
        Scenario.script_only = True
        with self.assertRaisesRegex(ReadbackError, "rendered scope"):
            self.readback()

    def test_different_revision_scope_fails(self) -> None:
        Scenario.rendered_scope_revision = 8
        with self.assertRaisesRegex(ReadbackError, "scope is not present"):
            self.readback()

    def test_matching_header_text_outside_scope_fails(self) -> None:
        Scenario.document_texts = ["NIHO"]
        Scenario.header_text = "NIHO"
        Scenario.rendered_texts = []
        with self.assertRaisesRegex(ReadbackError, "rendered scope"):
            self.readback()

    def test_every_text_node_must_be_rendered(self) -> None:
        Scenario.document_texts = ["First published paragraph", "Second published paragraph"]
        Scenario.rendered_texts = ["First published paragraph"]
        with self.assertRaisesRegex(ReadbackError, "rendered scope"):
            self.readback()

    def test_different_page_fails(self) -> None:
        Scenario.document_page = "host"
        with self.assertRaisesRegex(ReadbackError, "identity mismatch"):
            self.readback()

    def test_invalid_cache_fails(self) -> None:
        Scenario.cache_control = "public, max-age=60"
        with self.assertRaisesRegex(ReadbackError, "not no-store"):
            self.readback()

    def test_preview_leak_fails(self) -> None:
        Scenario.preview_status = 200
        with self.assertRaisesRegex(ReadbackError, "is exposed"):
            self.readback()

    def test_host_link_mismatch_fails(self) -> None:
        Scenario.host_url = "https://niho.life/experiences/provider"
        with self.assertRaisesRegex(ReadbackError, "host link mismatch"):
            self.readback()


if __name__ == "__main__":
    unittest.main()
