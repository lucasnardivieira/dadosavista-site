# site — instructions for Claude

Static site for Dados à Vista (https://dadosavista.com.br): sales page, margin calculator, privacy
page. Plain HTML/CSS/JS, no build step; every push to `main` publishes via GitHub Pages in ~1 minute.
Structure, config and deploy: [README.md](README.md).

## Rules

- **This repository is public.** Never commit secrets, client data, or internal business notes
  (decisions, costs, leads). `assets/config.js` holds only public IDs (Tally form, Cal.com link, pixel).
- Copy that states plans, prices or promises must match the docs repo
  (`../docs/decisoes.md` › Em vigor and `../comercial/pacotes-e-objecoes.md`). Prices are always
  "a partir de"; "atualização automática todo dia" only where it is true (Mercado Livre, Google Sheets).
- Brand: tokens live in `assets/style.css` › `:root`; read `../marca/README.md` before design work.
- Never push without Lucas's explicit OK for that push.

## Check before handing over

```bash
uv run --no-project --with pytest --with mini-racer pytest -q tests   # no node on this machine
python3 -m http.server 8000                                            # serve, then screenshot
```

Screenshots (Firefox is a snap: profile and output must be under a non-hidden home folder; use the
gitignored `_shots/`, and serve over http, not `file://`, or fonts may be blocked):

```bash
firefox --headless --no-remote --profile _shots/prof --window-size=390,1400 \
  --screenshot _shots/home-390.png http://127.0.0.1:8000/
```

Check 390 px (phone) and 1280 px (desktop). `_shots/` is scratch: delete old captures when done.
