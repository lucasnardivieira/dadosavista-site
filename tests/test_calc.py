"""Tests for assets/calc.js, run in V8 via mini-racer.

Run: uv run --no-project --with pytest --with mini-racer pytest -q tests
"""

import json
from pathlib import Path

import pytest
from py_mini_racer import MiniRacer

CALC_JS = (Path(__file__).resolve().parents[1] / "assets" / "calc.js").read_text(encoding="utf-8")

ML = {"commissionPct": 0.14, "fixedFee": 6.75, "fixedFeeBelow": 79, "paymentPct": 0}
NUVEM = {"commissionPct": 0, "fixedFee": 0, "fixedFeeBelow": 0, "paymentPct": 0.0499}


@pytest.fixture(scope="module")
def js():
    ctx = MiniRacer()
    ctx.eval(CALC_JS)

    def call(fn: str, *args):
        return json.loads(ctx.eval(f"JSON.stringify(DavCalc.{fn}(...{json.dumps(list(args))}))"))

    return call


def test_mercado_livre_cheap_item_loses_money(js):
    # Same case as data-template's hand-calculated order A-1, per unit:
    # 39.90 - 20 - 5.586 (14%) - 6.75 (fixed, < R$ 79) - 11.00 shipping - 2.394 (6%) = -5.83
    item = {"price": 39.90, "cost": 20, "shipping": 11, "adsPerSale": 0, "taxPct": 0.06, **ML}
    result = js("breakdown", item)
    assert result["profit"] == pytest.approx(-5.83, abs=1e-9)
    assert result["costs"]["fixedFee"] == 6.75


def test_own_store_item_matches_data_template(js):
    # data-template order B-1: 129.90 - 50 - 6.48201 (4.99%) - 7.794 (6%) = 65.62399
    item = {"price": 129.90, "cost": 50, "shipping": 0, "adsPerSale": 0, "taxPct": 0.06, **NUVEM}
    assert js("breakdown", item)["profit"] == pytest.approx(65.62399, abs=1e-9)


def test_fixed_fee_disappears_above_threshold(js):
    item = {"price": 79, "cost": 20, "shipping": 0, "adsPerSale": 0, "taxPct": 0, **ML}
    assert js("breakdown", item)["costs"]["fixedFee"] == 0


def test_minimum_price_hits_target_margin(js):
    item = {"price": 0, "cost": 30, "shipping": 12, "adsPerSale": 3, "taxPct": 0.06, **NUVEM}
    price = js("minimumPrice", item, 0.15)
    margin = js("breakdown", {**item, "price": price})["marginPct"]
    assert margin >= 0.15
    assert js("breakdown", {**item, "price": price - 0.01})["marginPct"] < 0.15


def test_minimum_price_includes_fee_below_threshold(js):
    # Percentages: 14% + 6% + 30% target = 50%. Without the fee 30 / 0.5 = R$ 60, but that is
    # below R$ 79, where the R$ 6.75 fee applies; with it 36.75 / 0.5 = R$ 73.50, still below 79.
    item = {"price": 0, "cost": 30, "shipping": 0, "adsPerSale": 0, "taxPct": 0.06, **ML}
    price = js("minimumPrice", item, 0.30)
    assert price == pytest.approx(73.50)
    assert js("breakdown", {**item, "price": price})["marginPct"] >= 0.30


def test_minimum_price_is_threshold_when_fee_version_crosses_it(js):
    item = {"price": 0, "cost": 38, "shipping": 0, "adsPerSale": 0, "taxPct": 0.06, **ML}
    # without fee: 38 / 0.5 = 76 (< 79) ; with fee: 44.75 / 0.5 = 89.5 (>= 79) -> R$ 79
    assert js("minimumPrice", item, 0.30) == 79


def test_minimum_price_impossible_returns_null(js):
    item = {"price": 0, "cost": 10, "shipping": 0, "adsPerSale": 0, "taxPct": 0.5, **ML}
    assert js("minimumPrice", item, 0.40) is None


@pytest.mark.parametrize(
    ("text", "expected"),
    [("39,90", 39.9), ("R$ 1.234,56", 1234.56), ("1234.56", 1234.56), ("", 0), ("abc", 0)],
)
def test_parse_brl(js, text, expected):
    assert js("parseBRL", text) == pytest.approx(expected)
