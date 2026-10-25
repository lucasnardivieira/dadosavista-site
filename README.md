# site

Static site for **Dados à Vista**: the sales page and the free quiz "Seus números estão à vista?"
(`/teste/`), the lead magnet in ads and on Instagram. Plain HTML, CSS and JS; no build step.

```
site/
├── index.html             # sales page: painel + monthly follow-up, any business type, 3 plans
├── teste/index.html       # 5-question quiz, Tally lead gate, score + 3 tips (lead magnet)
├── calculadora/index.html # redirect to /teste/ keeping UTMs (the margin calculator was retired on 2026-10-25)
├── agendado/index.html    # Cal.com redirect page (unused: the redirect needs a paid Cal.com plan)
├── privacidade/index.html # privacy policy (LGPD), linked from every footer and the Tally form
├── 404.html               # served by GitHub Pages for missing URLs (absolute paths)
├── assets/
│   ├── teste.js         # quiz questions, score, bands and tips (pure functions, tested)
│   ├── teste-pagina.js  # quiz page wiring + Tally lead gate
│   ├── site.js          # sales pages: booking links + company details from config.js
│   ├── tracking.js      # UTM capture, cookie banner, Meta pixel only after consent
│   ├── config.js        # public settings: Tally form id, booking URL, company details
│   ├── style.css        # brand tokens (:root) and styles shared by every page
│   ├── fonts/           # self-hosted Inter + Plus Jakarta Sans (woff2, latin subset, OFL)
│   ├── logo.svg, logo-escuro.svg       # wordmark lockups (built in dadosavista-docs › marca/_tools)
│   ├── favicon.svg, favicon-32.png, apple-touch-icon.png, icon-512.png
│   ├── mascote-de-pe.svg, mascote-espiando.svg, mascote-404.svg  # quero-quero mascot
│   ├── logos/           # monochrome brand glyphs for the "Integra com" and technology strips (simple-icons 16.35.0, CC0;
│   │                    #   trademarks belong to their owners; systems without an icon use initials)
│   └── og.png           # social preview (source: tools/og-image.html)
├── tools/
│   ├── og-image.html    # renders og.png with headless Firefox
│   └── subset_fonts.py  # rebuilds assets/fonts/ from the Google Fonts variable TTFs
└── tests/
    ├── test_teste.py    # runs teste.js in V8 via mini-racer
    ├── test_pages.py    # every local link/asset referenced by a page exists
    └── test_tracking.py # UTM and consent helpers
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

## Test

```bash
uv run --no-project --with pytest --with mini-racer pytest -q tests
```

## Configuration (`assets/config.js`)

- `tallyFormId`: id of the Tally lead form. While empty, "Ver meu resultado" shows the result
  without a form (useful for testing). The form receives hidden fields `origem` (`teste`), `nota`
  (0–10), `respostas` and the UTMs; create them in Tally with those exact names.
- `calUrl`: booking link for the free 30-minute initial meeting (`cal.com/dados-a-vista/reuniao-inicial`).
  Redirecting to `/agendado/` after booking needs a paid Cal.com plan, so the page is unused for now.
- `metaPixelId`: Meta pixel id. While empty there is no pixel and no cookie banner (nothing to
  consent to). Once set, the banner appears; the pixel loads only after "Aceitar" and sends
  PageView, Lead (Tally form sent) and Schedule (`/agendado`, which only fires if that redirect is ever enabled; the free alternative is embedding
  the Cal.com calendar and listening to its booking event).
- `companyName`, `cnpj`, `email`, `instagramUrl`: shown on the sales page and footer; each element
  stays hidden while its value is empty.

## Content notes

- The hero and the quiz result show a real capture of the demo painel (`assets/painel-visao-geral.webp`,
  fictional store, with the "dados de exemplo" note). The demo itself is not linked from the site.
- Product: a painel for small businesses of any kind plus a monthly follow-up, in three plans (Básico,
  Essencial, Completo). Prices are always "a partir de"; keep them in sync with
  `comercial/pacotes-e-objecoes.md` in the docs repo. The quiz is the lead magnet for every
  business type.
- Privacy page, cookie banner and UTM capture: done (2026-10-15). The privacy text is a plain-
  language draft owned by Lucas.

## Notes

- Quiz answers and the unlock state live in `localStorage` (`dav_teste`, per browser, best effort);
  the page works without it. If Tally fails to load, the result is shown anyway.
- This repository is **public** (it is served as-is by GitHub Pages). Never commit secrets:
  `config.js` only holds public IDs (Tally form, booking link, later the Meta pixel).

## Deploy (GitHub Pages)

Live at **https://dadosavista.com.br** since 2026-10-15 (`www` redirects to it). How it was set up:

1. Settings › Pages › Source: *Deploy from a branch*, branch `main`, folder `/` (root).
2. Add a `CNAME` file containing `dadosavista.com.br`,
   then in Cloudflare DNS create, **DNS only (grey cloud)**:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `lucasnardivieira.github.io`
3. Back in Settings › Pages, set the custom domain and tick *Enforce HTTPS* once the certificate is issued.

`.nojekyll` makes Pages serve the files untouched (no Jekyll processing).

## Cost and teardown

- Cost: GitHub Pages and Cloudflare DNS are free; the only cost is the domain (~R$ 40/year).
- Teardown: Settings › Pages › *Unpublish site*, delete the DNS records in Cloudflare, and archive or
  delete the repository; the domain can be left to expire.
