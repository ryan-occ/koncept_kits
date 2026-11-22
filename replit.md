# Vanguard Draft

Single-user car body-kit studio. **Draw first, render once:**

1. **Build** — pick car, kit style, parts (carbon or body colour), rear aero, paint, wheels. Autosaves.
2. **Drawings** — 4 orthographic AI line drawings (side, front, rear, top) at *low* image quality.
   The side view is drawn first and the other three are matched to it. Tick views, write notes, redraw.
3. **Approve** — locks the drawings to the exact build config. Changing the build afterwards marks
   them out of date and blocks renders/export until new drawings are approved.
4. **Renders** — *high*-quality photos made from the approved drawings: side/front edit the matching
   drawing in place; 3/4 angles use the drawings as geometry references.
5. **Export** — production ZIP: approved drawings, renders, spec sheet PDF, BOM CSV, part specs,
   dimensioned per-part PDF/SVG sheets.

## Run on Replit

1. Import this folder as a Replit app (Node.js). `.replit` runs `npm run dev` on port 5000.
2. Add a **PostgreSQL** database in Replit — it sets `DATABASE_URL`. Tables are created on start.
3. Add the secret **`OPENAI_API_KEY`**. Without it the app runs in mock mode (placeholder images, no cost).
4. Deploy: Autoscale; build `npm ci && npm run build`, run `npm start` (already in `.replit`).

## Settings (Secrets / env)

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | — | Required for real images |
| `DATABASE_URL` | — | Postgres; without it builds live in memory and vanish on restart |
| `IMAGE_MODEL` | `gpt-image-2.5-sunburst` | Same model the Vanguard-Concept app uses |
| `TEXT_MODEL` | `gpt-6-luna` | Used once per export for part dimensions |
| `DRAWING_QUALITY` | `low` | `low` / `medium` / `high` — raise if drawings lose the car's identity |
| `RENDER_QUALITY` | `high` | Render image quality |
| `DAILY_IMAGE_LIMIT` | `60` | Hard cap on images per UTC day |
| `AI_MODE` | — | Set to `mock` to force placeholder images |

## Layout

- `server/` — Express API (`routes.ts`), workflow + jobs (`studio.ts`), OpenAI wrapper (`ai.ts`),
  storage (`store.ts`: Postgres or in-memory), prompts (`domain/prompts.ts`), export (`export/`).
- `shared/` — build config schema (`types.ts`), catalog and car/kit rules ported from Vanguard-Concept.
- `client/` — React UI (Vite). In dev, Vite runs inside the Express process on the same port.

## Commands

- `npm run dev` · `npm test` · `npm run typecheck` · `npm run build` · `npm start`
