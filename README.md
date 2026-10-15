# site

Static site for **Dados à Vista**: the sales page and the free "Calculadora de margem real" used
as the lead magnet in ads. Plain HTML, CSS and JS; no build step.

```
site/
├── index.html             # sales page: dashboards + monthly follow-up, 2 niches, 2 packages
├── calculadora/index.html # margin calculator (lead magnet)
├── agendado/index.html    # Cal.com redirect after booking
├── 404.html               # served by GitHub Pages for missing URLs (absolute paths)
├── assets/
│   ├── calc.js          # margin math (pure functions, tested)
│   ├── calculadora.js   # calculator page wiring + Tally lead gate
│   ├── site.js          # sales pages: booking links + company details from config.js
│   ├── config.js        # public settings: Tally form id, booking URL, company details
│   ├── style.css        # brand tokens (:root) and styles shared by every page
│   ├── fonts/           # self-hosted Inter + Plus Jakarta Sans (woff2, latin subset, OFL)
│   ├── logo.svg, logo-escuro.svg       # wordmark lockups (built in dadosavista-docs › marca/_tools)
│   ├── favicon.svg, favicon-32.png, apple-touch-icon.png, icon-512.png
│   └── og.png           # social preview (source: tools/og-image.html)
├── tools/
│   ├── og-image.html    # renders og.png with headless Firefox
│   └── subset_fonts.py  # rebuilds assets/fonts/ from the Google Fonts variable TTFs
└── tests/
    ├── test_calc.py     # runs calc.js in V8 via mini-racer
    └── test_pages.py    # every local link/asset referenced by a page exists
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

## Test

```bash
uv run --no-project --with pytest --with mini-racer pytest -q tests
```

The test cases reuse the hand-calculated orders from `data-template`, so the calculator and the
dashboard pipeline compute margins the same way.

## Configuration (`assets/config.js`)

- `tallyFormId`: id of the Tally lead form. While empty, "Liberar análise completa" unlocks
  without a form (useful for testing). The form receives hidden fields `origem`, `canal`, `preco`;
  create them in Tally with those exact names.
- `calUrl`: booking link for the free 30-minute diagnosis. In Cal.com, set the event's redirect
  after booking to `https://dadosavista.com.br/agendado/`.
- `companyName`, `cnpj`, `email`, `linkedinUrl`: shown on the sales page and footer; each element
  stays hidden while its value is empty.

## Content notes

- The dashboard on the sales page is an HTML mock built from the fictional store's real numbers
  (`data-template`, last 12 months). Replace it with the Looker Studio screenshots and video once
  recorded. The "Quem faz" avatar is a placeholder for `assets/lucas.jpg`.
- Product (decided 2026-10-15): dashboards for small businesses plus a monthly follow-up
  (maintenance, summary email, 30-min insights call). Niches: online stores and Bling users.
  Prices are always "a partir de"; keep them in sync with `docs/comercial/pacotes-e-objecoes.md`
  in the docs repo. The margin calculator is the lead magnet for the e-commerce niche.
- Still to do: `/privacidade`, the cookie banner (before the Meta pixel), passing UTMs to Tally,
  self-hosting the Inter font.

## Notes

- Channel fees in `calc.js` are approximate and labelled as such on the page; sellers can edit
  them. Review them before each ad campaign.
- The unlock state lives in `localStorage` (per browser, best effort); the page works without it.
- This repository is **public** (it is served as-is by GitHub Pages). Never commit secrets:
  `config.js` only holds public IDs (Tally form, booking link, later the Meta pixel).

## Deploy (GitHub Pages)

1. Settings › Pages › Source: *Deploy from a branch*, branch `main`, folder `/` (root).
2. Once `dadosavista.com.br` is registered: add a `CNAME` file containing `dadosavista.com.br`,
   then in Cloudflare DNS create, **DNS only (grey cloud)**:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` `www` → `lucasnardivieira.github.io`
3. Back in Settings › Pages, set the custom domain and tick *Enforce HTTPS* once the certificate is issued.

`.nojekyll` makes Pages serve the files untouched (no Jekyll processing).

## Cost and teardown

- Cost: GitHub Pages and Cloudflare DNS are free; the only cost is the domain (~R$ 40/year).
- Teardown: Settings › Pages › *Unpublish site*, delete the DNS records in Cloudflare, and archive or
  delete the repository; the domain can be left to expire.
