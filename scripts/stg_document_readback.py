#!/usr/bin/env python3
"""Fail-closed readback for the no-traffic stg published-document candidate."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

MAX_DOCUMENT_BYTES = 512 * 1024
MAX_HTML_BYTES = 2 * 1024 * 1024
EXPECTED_HOST_URL = "https://app-stg.niho.life/experiences/provider"
DOCUMENT_PATH = "/api/public/experiences/pages/home/en"
REVISION_PATTERN = re.compile(r"^niho-experience-preview-[a-z0-9-]+$")


class ReadbackError(RuntimeError):
    """A public invariant failed without retaining response content."""


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):  # noqa: ANN001
        return None


@dataclass(frozen=True)
class HttpResult:
    status: int
    headers: object
    body: bytes


@dataclass(frozen=True)
class ReadbackResult:
    document_revision: int
    text_nodes: int
    matched_text_nodes: int
    matched_text_sha256: str
    statuses: dict[str, int]


class BodyHTML(HTMLParser):
    _VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self, target_scope: str | None = None) -> None:
        super().__init__(convert_charrefs=True)
        self.target_scope = target_scope
        self.target_scope_seen = False
        self.body_depth = 0
        self.suppressed_depth = 0
        self.text: list[str] = []
        self.links: list[str] = []
        self.elements: list[tuple[str, bool, bool, str | None]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        opens_body = tag == "body"
        if opens_body:
            self.body_depth += 1
        opens_suppressed = bool(self.body_depth and tag in {"script", "style"})
        if opens_suppressed:
            self.suppressed_depth += 1
        scope = next((value for name, value in attrs if name.lower() == "data-nw-scope"), None)
        if scope == self.target_scope and self.target_scope is not None:
            self.target_scope_seen = True
        if self.body_depth and not self.suppressed_depth and tag == "a":
            href = next((value for name, value in attrs if name.lower() == "href"), None)
            if href is not None:
                self.links.append(href)
        if tag not in self._VOID_TAGS:
            self.elements.append((tag, opens_body, opens_suppressed, scope))

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        matching = next((index for index in range(len(self.elements) - 1, -1, -1) if self.elements[index][0] == tag), None)
        if matching is None:
            return
        for _, opens_body, opens_suppressed, _ in reversed(self.elements[matching:]):
            if opens_suppressed and self.suppressed_depth:
                self.suppressed_depth -= 1
            if opens_body and self.body_depth:
                self.body_depth -= 1
        del self.elements[matching:]

    def handle_data(self, data: str) -> None:
        active_scope = next((scope for _, _, _, scope in reversed(self.elements) if scope is not None), None)
        if self.body_depth and not self.suppressed_depth and (self.target_scope is None or active_scope == self.target_scope):
            self.text.append(data)


def _validated_origin(value: str, label: str) -> str:
    parsed = urlsplit(value)
    local_http = parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost"}
    if (
        (parsed.scheme != "https" and not local_http)
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        raise ReadbackError(f"invalid {label}")
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))


def _request(url: str, *, accept: str, max_bytes: int, retries: int, timeout: float) -> HttpResult:
    opener = build_opener(ProxyHandler({}), _NoRedirect())
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = Request(url, headers={"Accept": accept, "User-Agent": "niho-experience-stg-readback/1"}, method="GET")
            try:
                response = opener.open(request, timeout=timeout)
            except HTTPError as error:
                response = error
            with response:
                status = int(response.status)
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > max_bytes:
                    raise ReadbackError("response exceeds size limit")
                body = response.read(max_bytes + 1)
                if len(body) > max_bytes:
                    raise ReadbackError("response exceeds size limit")
                result = HttpResult(status=status, headers=response.headers, body=body)
            if status < 500 and status != 429:
                return result
            last_error = ReadbackError(f"transient HTTP status {status}")
        except (OSError, URLError, ValueError) as error:
            last_error = error
        if attempt + 1 < retries:
            time.sleep(min(2**attempt, 4))
    raise ReadbackError("request failed") from last_error


def _normalise_text(value: str) -> str:
    return " ".join(value.split())


def _safe_text_nodes(nodes: object) -> Iterable[str]:
    if not isinstance(nodes, list):
        raise ReadbackError("document body is invalid")
    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get("type"), str):
            raise ReadbackError("document node is invalid")
        if node["type"] == "text":
            text = node.get("text")
            if not isinstance(text, str):
                raise ReadbackError("document text node is invalid")
            normalised = _normalise_text(text)
            if normalised:
                if len(normalised) > 10_000 or any(ord(character) < 32 for character in normalised):
                    raise ReadbackError("document text node is unsafe")
                yield normalised
        elif node["type"] == "element":
            yield from _safe_text_nodes(node.get("children"))


def _has_no_store(headers: object) -> bool:
    value = headers.get("cache-control", "")  # type: ignore[attr-defined]
    return "no-store" in {part.strip().lower() for part in value.split(",")}


def _parse_html(body: bytes, target_scope: str | None = None) -> BodyHTML:
    try:
        source = body.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ReadbackError("HTML is not UTF-8") from error
    parser = BodyHTML(target_scope)
    try:
        parser.feed(source)
        parser.close()
    except Exception as error:
        raise ReadbackError("HTML parsing failed") from error
    return parser


def _page_scope(site_id: str, page_id: str, locale: str, revision: int) -> str:
    values = (site_id, page_id, locale, str(revision))
    return "nw-" + "-".join(f"{len(value)}-{value}" for value in values)


def run_readback(
    candidate_url: str,
    api_origin: str,
    revision: str,
    *,
    retries: int = 5,
    timeout: float = 15,
) -> ReadbackResult:
    candidate = _validated_origin(candidate_url, "candidate URL")
    api = _validated_origin(api_origin, "API origin")
    if not REVISION_PATTERN.fullmatch(revision):
        raise ReadbackError("invalid candidate revision")
    if retries < 1:
        raise ReadbackError("retries must be positive")

    statuses: dict[str, int] = {}
    document_response = _request(
        api + DOCUMENT_PATH,
        accept="application/json",
        max_bytes=MAX_DOCUMENT_BYTES,
        retries=retries,
        timeout=timeout,
    )
    statuses["document"] = document_response.status
    if document_response.status != 200:
        raise ReadbackError("published home document did not return 200")
    if not _has_no_store(document_response.headers):
        raise ReadbackError("published home document is not no-store")
    content_type = document_response.headers.get("content-type", "").lower()
    if not re.match(r"^application/json(?:\s*;|$)", content_type):
        raise ReadbackError("published home document is not JSON")
    try:
        document = json.loads(document_response.body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ReadbackError("published home document is invalid JSON") from error
    if not isinstance(document, dict) or (
        document.get("siteId"), document.get("pageId"), document.get("locale")
    ) != ("experience", "home", "en"):
        raise ReadbackError("published home document identity mismatch")
    document_revision = document.get("revision")
    if not isinstance(document_revision, int) or isinstance(document_revision, bool) or document_revision < 1:
        raise ReadbackError("published home document revision is invalid")
    texts = list(_safe_text_nodes(document.get("body")))
    if not texts:
        raise ReadbackError("published home document has no safe text nodes")

    home_response = _request(candidate + "/", accept="text/html", max_bytes=MAX_HTML_BYTES, retries=retries, timeout=timeout)
    statuses["home"] = home_response.status
    if home_response.status != 200:
        raise ReadbackError("candidate home did not return 200")
    scope = _page_scope("experience", "home", "en", document_revision)
    home = _parse_html(home_response.body, scope)
    if not home.target_scope_seen:
        raise ReadbackError("published home scope is not present in rendered body")
    visible_text = _normalise_text(" ".join(home.text))
    cursor = 0
    for text in texts:
        position = visible_text.find(text, cursor)
        if position < 0:
            raise ReadbackError("published home text is incomplete in rendered scope")
        cursor = position + len(text)

    for path, name in (("/experiences", "experiences"), ("/host", "host")):
        response = _request(candidate + path, accept="text/html", max_bytes=MAX_HTML_BYTES, retries=retries, timeout=timeout)
        statuses[name] = response.status
        if response.status != 200:
            raise ReadbackError(f"candidate {name} did not return 200")
        if name == "host" and EXPECTED_HOST_URL not in _parse_html(response.body).links:
            raise ReadbackError("candidate host link mismatch")

    robots_response = _request(candidate + "/robots.txt", accept="text/plain", max_bytes=64 * 1024, retries=retries, timeout=timeout)
    statuses["robots"] = robots_response.status
    if robots_response.status != 200:
        raise ReadbackError("candidate robots.txt did not return 200")
    try:
        robots = robots_response.body.decode("utf-8")
    except UnicodeDecodeError as error:
        raise ReadbackError("candidate robots.txt is not UTF-8") from error
    if not any(line.strip().lower() == "disallow: /" for line in robots.splitlines()):
        raise ReadbackError("candidate robots.txt does not block indexing")

    for path, name in (("/preview/states", "preview_states"), ("/preview/checkout", "preview_checkout")):
        response = _request(candidate + path, accept="text/html", max_bytes=64 * 1024, retries=retries, timeout=timeout)
        statuses[name] = response.status
        if response.status != 404:
            raise ReadbackError(f"candidate {name} is exposed")

    return ReadbackResult(
        document_revision=document_revision,
        text_nodes=len(texts),
        matched_text_nodes=len(texts),
        matched_text_sha256=hashlib.sha256(json.dumps(texts, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest(),
        statuses=statuses,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate-url", required=True)
    parser.add_argument("--api-origin", default="https://app-stg.niho.life")
    parser.add_argument("--revision", required=True)
    args = parser.parse_args()
    try:
        result = run_readback(args.candidate_url, args.api_origin, args.revision)
    except ReadbackError as error:
        print(f"readback_failed={error}", file=sys.stderr)
        return 1
    statuses = ",".join(f"{name}:{status}" for name, status in sorted(result.statuses.items()))
    print(
        f"revision={args.revision} document_revision={result.document_revision} "
        f"status={statuses} text_nodes={result.text_nodes} matched_text_nodes={result.matched_text_nodes} "
        f"text_sha256={result.matched_text_sha256}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
