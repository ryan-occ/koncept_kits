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

1. Click **Run** to start the **Start application** workflow (`npm run dev`) on port 5000.
   Express serves the API and Vite serves the React UI through the same port.
2. This workspace has **PostgreSQL** configured through `DATABASE_URL`. Tables are created on start.
3. `OPENAI_API_KEY` is not configured: the app currently runs in **mock mode**
   (clearly labelled placeholder images, no AI charges). Real image generation requires an
   OpenAI key in Replit Secrets and image/text model names available to that account.
   Restart the workflow after changing secrets or model settings.
4. For a fresh checkout, install dependencies with `npm ci`. The test runner uses Vitest 4
   because the imported Vitest 3 dependency included a package blocked by the package security policy.
5. Publishing configuration is present: Autoscale; build `npm ci && npm run build`, run
   `npm start`. The app has not been published as part of workspace setup.

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
