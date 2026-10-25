"""Tests for assets/teste.js (quiz score, band, tips, lead fields), run in V8 via mini-racer.

Run: uv run --no-project --with pytest --with mini-racer pytest -q tests
"""

import json
from pathlib import Path

import pytest
from py_mini_racer import MiniRacer

TESTE_JS = (Path(__file__).resolve().parents[1] / "assets" / "teste.js").read_text(encoding="utf-8")
KEYS = ["lucro", "dados", "margem", "receber", "tempo"]


@pytest.fixture(scope="module")
def js():
    ctx = MiniRacer()
    ctx.eval(TESTE_JS)

    def call(expr: str):
        return json.loads(ctx.eval(f"JSON.stringify({expr})"))

    return call


def answers(*points):
    return dict(zip(KEYS, points))


def test_every_question_has_three_options_worth_2_1_0(js):
    questions = js("DavTeste.QUESTIONS")
    assert [q["key"] for q in questions] == KEYS
    for q in questions:
        assert [points for _, points in q["options"]] == [2, 1, 0]


def test_every_weak_answer_has_a_tip(js):
    tips = js("DavTeste.TIPS")
    for key in KEYS:
        assert set(tips[key]) == {"0", "1"}


def test_score_sums_points_and_needs_every_answer(js):
    assert js(f"DavTeste.score({json.dumps(answers(2, 1, 0, 1, 2))})") == 6
    assert js(f"DavTeste.score({json.dumps({'lucro': 2})})") is None
    assert js(f"DavTeste.score({json.dumps(answers(2, 2, 2, 2, 3))})") is None


@pytest.mark.parametrize(
    ("total", "name"),
    [(0, "Números no escuro"), (3, "Números no escuro"), (4, "Números pela metade"),
     (6, "Números pela metade"), (7, "Quase à vista"), (8, "Quase à vista"),
     (9, "Números à vista"), (10, "Números à vista")],
)
def test_band_limits(js, total, name):
    assert js(f"DavTeste.band({total}).name") == name


def test_tips_put_zeros_first_then_question_order(js):
    # dados=1, margem=0, receber=0, tempo=1: the zeros (margem, receber) first, then dados.
    tips = js(f"DavTeste.tips({json.dumps(answers(2, 1, 0, 0, 1))})")
    expected = js("[DavTeste.TIPS.margem[0], DavTeste.TIPS.receber[0], DavTeste.TIPS.dados[1]]")
    assert tips == expected


def test_strong_answers_get_next_steps(js):
    assert js(f"DavTeste.tips({json.dumps(answers(2, 2, 2, 2, 2))})") == js("DavTeste.NEXT_STEPS")
    tips = js(f"DavTeste.tips({json.dumps(answers(2, 2, 2, 2, 1))})")
    assert tips == js("[DavTeste.TIPS.tempo[1], DavTeste.NEXT_STEPS[0], DavTeste.NEXT_STEPS[1]]")


def test_lead_fields(js):
    fields = js(f"DavTeste.leadFields({json.dumps(answers(2, 1, 0, 1, 2))})")
    assert fields == {
        "origem": "teste",
        "nota": "6",
        "respostas": "lucro 2, dados 1, margem 0, receber 1, tempo 2",
    }
