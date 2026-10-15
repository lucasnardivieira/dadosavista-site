"""Build the self-hosted web fonts in assets/fonts/ from the Google Fonts variable TTFs.

Sources (SIL OFL 1.1): https://github.com/google/fonts/tree/main/ofl/inter and
https://github.com/google/fonts/tree/main/ofl/plusjakartasans

    uv run --no-project --with fonttools --with brotli python -I tools/subset_fonts.py \
        "<dir>/Inter[opsz,wght].ttf" "<dir>/PlusJakartaSans[wght].ttf"
"""

import io
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

OUT = Path(__file__).resolve().parents[1] / "assets" / "fonts"
# Latin + Latin-1 (all Portuguese accents), punctuation, currency, arrows, ▲ ▼
UNICODES = "U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+25B2,U+25BC"


def build(src: str, axes: dict, out_name: str) -> None:
    # Round-trip through bytes: subsetting a freshly instanced font trips on lazy gvar data
    buffer = io.BytesIO()
    instantiateVariableFont(TTFont(src), axes).save(buffer)
    buffer.seek(0)
    font = TTFont(buffer)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features += ["tnum"]  # default text features + tabular figures for money columns
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
    subsetter.subset(font)
    path = OUT / out_name
    font.save(path)
    print(f"wrote {path.name}: {path.stat().st_size / 1024:.0f} KiB")


if __name__ == "__main__":
    inter, jakarta = sys.argv[1:3]
    OUT.mkdir(parents=True, exist_ok=True)
    build(inter, {"opsz": 14, "wght": (400, 700)}, "inter.woff2")
    build(jakarta, {"wght": (700, 800)}, "plus-jakarta-sans.woff2")
