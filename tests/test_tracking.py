"""Tests for the pure helpers in assets/tracking.js (UTMs and consent), run in V8 via mini-racer."""

import json
from pathlib import Path

import pytest
from py_mini_racer import MiniRacer

TRACKING_JS = (Path(__file__).resolve().parents[1] / "assets" / "tracking.js").read_text(
    encoding="utf-8"
)

# mini-racer has no URLSearchParams; a small stand-in covering what parseUtms uses.
URLSEARCHPARAMS = """
globalThis.URLSearchParams = class {
  constructor(q) {
    this.m = {};
    (q || "").replace(/^\\?/, "").split("&").filter(Boolean).forEach((kv) => {
      const [k, v = ""] = kv.split("=");
      this.m[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\\+/g, " "));
    });
  }
  get(k) { return k in this.m ? this.m[k] : null; }
};
"""


@pytest.fixture(scope="module")
def js():
    ctx = MiniRacer()
    ctx.eval(URLSEARCHPARAMS)
    ctx.eval(TRACKING_JS)

    def call(fn: str, *args):
        return json.loads(ctx.eval(f"JSON.stringify(DavTracking.{fn}(...{json.dumps(list(args))}))"))

    return call


def test_parse_utms_keeps_only_known_keys(js):
    got = js("parseUtms", "?utm_source=meta&utm_campaign=bf&gclid=x&utm_medium=")
    assert got == {"utm_source": "meta", "utm_campaign": "bf"}


def test_fresh_utms_replace_stored_but_empty_url_keeps_them(js):
    stored = {"utm_source": "meta"}
    assert js("mergeUtms", stored, {}) == stored
    assert js("mergeUtms", stored, {"utm_source": "linkedin"}) == {"utm_source": "linkedin"}


def test_utm_fields_always_has_every_key(js):
    got = js("utmFields", {"utm_source": "meta"})
    assert got == {"utm_source": "meta", "utm_medium": "", "utm_campaign": "", "utm_content": ""}


@pytest.mark.parametrize(
    ("pixel", "choice", "expected"),
    [("", None, False), ("123", None, True), ("123", "granted", False), ("123", "denied", False)],
)
def test_banner_only_when_pixel_and_no_choice(js, pixel, choice, expected):
    assert js("needsBanner", pixel, choice) is expected
