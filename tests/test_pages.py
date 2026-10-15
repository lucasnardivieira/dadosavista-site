"""Every local link, script, stylesheet and image referenced by a page must exist."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
PAGES = [p for p in ROOT.rglob("*.html") if not {"_shots", "tools", "tests"} & set(p.parts)]


class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs: list[str] = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value:
                self.refs.append(value)


def resolve(page: Path, ref: str) -> Path | None:
    url = urlparse(ref)
    if url.scheme or url.netloc or ref.startswith(("#", "mailto:")):
        return None
    base = ROOT if url.path.startswith("/") else page.parent
    target = (base / url.path.lstrip("/")).resolve()
    return target / "index.html" if target.is_dir() or url.path.endswith("/") else target


def test_pages_found():
    names = {p.relative_to(ROOT).as_posix() for p in PAGES}
    assert {"index.html", "calculadora/index.html", "agendado/index.html", "404.html", "privacidade/index.html"} <= names


def test_local_references_exist():
    missing = []
    for page in PAGES:
        parser = Refs()
        parser.feed(page.read_text(encoding="utf-8"))
        for ref in parser.refs:
            target = resolve(page, ref)
            if target is not None and not target.exists():
                missing.append(f"{page.relative_to(ROOT)} -> {ref}")
    assert missing == []
