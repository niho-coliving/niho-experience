"""Read-only gates for the dedicated synthetic staging booking candidate."""

import argparse
import json
import sys
from urllib.request import Request, urlopen

API_ORIGIN = "https://app-stg.niho.life"
FIXTURE_SLUG = "stg-synthetic-booking-acceptance"
CANDIDATE_ORIGIN = "https://stg-booking---niho-experience-preview-aotuusf7xq-an.a.run.app"


def check_fixture(detail: dict, availability: dict) -> None:
    experience = detail.get("experience", {})
    if (
        experience.get("slug") != FIXTURE_SLUG
        or experience.get("title") != "STG Synthetic Booking Acceptance"
        or experience.get("contentLanguage") != "EN"
        or experience.get("booking", {}).get("checkoutAvailable") is not True
    ):
        raise ValueError("the approved synthetic staging fixture must accept checkout")
    offers = experience.get("offers", [])
    if len(offers) != 1:
        raise ValueError("the synthetic fixture must have exactly one offer")
    offer = offers[0]
    if (
        offer.get("name") != "Synthetic test session"
        or offer.get("pricing", {}).get("currency") != "JPY"
        or offer.get("pricing", {}).get("adultPriceYen") != 100
        or offer.get("capacity") != 2
        or offer.get("maxPartySize") != 2
    ):
        raise ValueError("the synthetic fixture must retain its reviewed price and capacity")
    if not any(
        occurrence.get("offerId") == offer.get("id")
        and occurrence.get("bookable") is True
        and occurrence.get("seatsLeft") == 2
        for occurrence in availability.get("occurrences", [])
    ):
        raise ValueError("the synthetic fixture needs available dates")


def check_origin(headers) -> None:
    if (
        headers.get("Access-Control-Allow-Origin") != CANDIDATE_ORIGIN
        or headers.get("Access-Control-Allow-Credentials", "").lower() == "true"
    ):
        raise ValueError("NIHO staging must allow the exact candidate origin without credentials")


def check_cors(headers) -> None:
    check_origin(headers)
    methods = {value.strip().upper() for value in headers.get("Access-Control-Allow-Methods", "").split(",")}
    allowed_headers = {value.strip().lower() for value in headers.get("Access-Control-Allow-Headers", "").split(",")}
    if (
        "POST" not in methods
        or "content-type" not in allowed_headers
    ):
        raise ValueError("NIHO staging must allow only the exact booking candidate origin without credentials")


def preflight() -> dict:
    endpoint = f"{API_ORIGIN}/api/public/experiences/{FIXTURE_SLUG}"
    with urlopen(endpoint, timeout=20) as response:
        detail = json.load(response)
    with urlopen(Request(f"{endpoint}/availability", headers={"Origin": CANDIDATE_ORIGIN}), timeout=20) as response:
        availability = json.load(response)
        check_origin(response.headers)
        if "no-store" not in response.headers.get("Cache-Control", ""):
            raise ValueError("availability must not be cached")
    check_fixture(detail, availability)
    request = Request(
        f"{endpoint}/checkout",
        method="OPTIONS",
        headers={
            "Origin": CANDIDATE_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    with urlopen(request, timeout=20) as response:
        check_cors(response.headers)
    return {"fixture": FIXTURE_SLUG, "api_origin": API_ORIGIN, "candidate_origin": CANDIDATE_ORIGIN, "cors": "passed"}


if __name__ == "__main__":
    argparse.ArgumentParser(description=__doc__).parse_args()
    try:
        print(json.dumps(preflight()))
    except Exception as error:
        # Never include response bodies, guest inputs or checkout URLs in logs.
        print(f"Stg booking preflight failed ({type(error).__name__}). Check the synthetic fixture and exact-origin CORS configuration.", file=sys.stderr)
        sys.exit(1)
