# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-06-09T05:36:57.533Z
> Files: 35 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `CLAUDE.md` — OpenWolf (~57 tok)
- `estrutura_pastas.txt` (~32 tok)
- `modelo_relatorio_extraido.txt` (~2531 tok)
- `README.md` — Project documentation (~871 tok)
- `relatorio_parcial_soundcon_implementacoes.md` — 1 INTRODUÇÃO (~1662 tok)
- `relatorio_parcial_task_pitch_shift.md` — RELATÓRIO PARCIAL DE ATIVIDADES (~1390 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## backend/

- `.gitignore` — Git ignore rules (~15 tok)
- `audio-processing.js` — ALLOWED_FORMATS: parsePitchCents, validateOutputFormat, calculatePitchRatio + 3 more (~824 tok)
- `package-lock.json` — npm lock file (~26960 tok)
- `package.json` — Node.js package manifest (~137 tok)
- `server.js` — API routes: POST, GET (5 endpoints) (~2131 tok)

## backend/db/

- `database.sqlite3` (~0 tok)
- `db.js` — sqlite3: ensureLogColumn (~324 tok)

## backend/test/

- `audio-convert-route.test.js` — test: createToneFile, requestConvert (~992 tok)
- `audio-processing.test.js` — Declares test (~564 tok)

## frontend/

- `.gitignore` — Git ignore rules (~87 tok)
- `eslint.config.js` — ESLint flat configuration (~225 tok)
- `index.html` — frontend (~103 tok)
- `package-lock.json` — npm lock file (~28088 tok)
- `package.json` — Node.js package manifest (~214 tok)
- `vite.config.js` — Vite build configuration (~48 tok)

## frontend/src/

- `App.css` — root { (~14 tok)
- `App.jsx` — App (~190 tok)
- `index.css` — Styles: 14 vars (~295 tok)
- `main.jsx` (~99 tok)

## frontend/src/components/

- `AppLayout.jsx` — navItems — uses useNavigate (~428 tok)

## frontend/src/pages/

- `cadastro.jsx` — Cadastro — renders form — uses useNavigate, useState (~1049 tok)
- `convert.jsx` — formatOptions — renders form — uses useState, useMemo (~1333 tok)
- `dashboard.css` — Styles: 77 rules, 2 media queries (~2197 tok)
- `home.jsx` — Home — uses useNavigate (~250 tok)
- `login.jsx` — Login — renders form — uses useNavigate, useState (~822 tok)
- `pitch.jsx` — qualityInfo — renders form — uses useState, useMemo (~1529 tok)
- `user.jsx` — UserPage — renders form — uses useState (~904 tok)
