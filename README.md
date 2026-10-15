# site

Static site for **Dados à Vista**: the sales page (coming next) and the free
"Calculadora de margem real" used as the lead magnet in ads. Plain HTML, CSS and JS; no build step.

```
site/
├── assets/
│   ├── calc.js          # margin math (pure functions, tested)
│   ├── calculadora.js   # calculator page wiring + Tally lead gate
│   ├── config.js        # public settings: Tally form id, booking URL
│   └── style.css        # brand styles shared by every page
├── calculadora/index.html
└── tests/test_calc.py   # runs calc.js in V8 via mini-racer
```

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000/calculadora/
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
- `calUrl`: booking link for the free 30-minute diagnosis.

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
