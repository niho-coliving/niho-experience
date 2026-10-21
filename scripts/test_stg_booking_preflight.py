"""Synthetic tests; no staging access, credentials or payment requests."""

import copy
import unittest

from stg_booking_preflight import CANDIDATE_ORIGIN, FIXTURE_SLUG, check_cors, check_fixture, check_no_store, check_origin


class StgBookingPreflightTest(unittest.TestCase):
    def setUp(self):
        self.detail = {"experience": {
            "slug": FIXTURE_SLUG,
            "title": "STG Synthetic Booking Acceptance",
            "contentLanguage": "EN",
            "booking": {"checkoutAvailable": True},
            "offers": [{"id": "synthetic-offer", "name": "Synthetic test session",
                        "pricing": {"currency": "JPY", "adultPriceYen": 100}, "capacity": 2, "maxPartySize": 2}],
        }}
        self.availability = {"occurrences": [{"offerId": "synthetic-offer", "date": "2050-11-03", "bookable": True, "seatsLeft": 2}]}
        self.headers = {
            "Access-Control-Allow-Origin": CANDIDATE_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }

    def test_reviewed_fixture_and_exact_origin(self):
        check_fixture(self.detail, self.availability)
        check_cors(self.headers)

    def test_other_or_paused_experience_is_rejected(self):
        for key, value in (("slug", "real-product"), ("title", "Another product"), ("contentLanguage", "JA"), ("booking", {"checkoutAvailable": False})):
            with self.subTest(key=key):
                detail = copy.deepcopy(self.detail)
                detail["experience"][key] = value
                with self.assertRaises(ValueError):
                    check_fixture(detail, self.availability)

    def test_price_currency_capacity_changes_are_rejected(self):
        for changes in ({"pricing": {"currency": "JPY", "adultPriceYen": 101}}, {"pricing": {"currency": "USD", "adultPriceYen": 100}}, {"capacity": 3}, {"maxPartySize": 3}):
            with self.subTest(changes=changes):
                detail = copy.deepcopy(self.detail)
                detail["experience"]["offers"][0].update(changes)
                with self.assertRaises(ValueError):
                    check_fixture(detail, self.availability)

    def test_missing_or_additional_offers_are_rejected(self):
        for offers in ([], self.detail["experience"]["offers"] * 2):
            with self.subTest(offers=len(offers)):
                detail = copy.deepcopy(self.detail)
                detail["experience"]["offers"] = offers
                with self.assertRaises(ValueError):
                    check_fixture(detail, self.availability)

    def test_empty_full_closed_or_unrelated_dates_are_rejected(self):
        for occurrences in ([], [{"offerId": "synthetic-offer", "bookable": True, "seatsLeft": 0}], [{"offerId": "synthetic-offer", "bookable": False, "seatsLeft": 2}], [{"offerId": "another-offer", "bookable": True, "seatsLeft": 2}]):
            with self.subTest(occurrences=occurrences):
                with self.assertRaises(ValueError):
                    check_fixture(self.detail, {"occurrences": occurrences})

    def test_missing_wildcard_other_origin_and_credentials_are_rejected(self):
        for changes in ({"Access-Control-Allow-Origin": ""}, {"Access-Control-Allow-Origin": "*"}, {"Access-Control-Allow-Origin": "https://example.com"}, {"Access-Control-Allow-Credentials": "true"}):
            with self.subTest(changes=changes):
                with self.assertRaises(ValueError):
                    check_origin(self.headers | changes)

    def test_missing_malformed_and_impossible_dates_are_rejected(self):
        for value in (None, "", "20501103", "2050-1-3", "2050-02-30", "2050-11-03T00:00:00Z"):
            with self.subTest(value=value):
                availability = copy.deepcopy(self.availability)
                availability["occurrences"][0]["date"] = value
                with self.assertRaises(ValueError):
                    check_fixture(self.detail, availability)

    def test_cache_control_requires_exact_case_insensitive_directive(self):
        for value in ("no-store", "private, NO-STORE, max-age=0"):
            check_no_store({"Cache-Control": value})
        for value in ("", "public, max-age=600, x-no-store", "no-store=false"):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    check_no_store({"Cache-Control": value})

    def test_post_and_content_type_must_be_allowed(self):
        for changes in ({"Access-Control-Allow-Methods": "GET"}, {"Access-Control-Allow-Headers": ""}):
            with self.subTest(changes=changes):
                with self.assertRaises(ValueError):
                    check_cors(self.headers | changes)


if __name__ == "__main__":
    unittest.main()
