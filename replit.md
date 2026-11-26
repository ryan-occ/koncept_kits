# Vanguard Draft

Single-user car body-kit studio. **Draw first, render once:**

1. **Build** — pick car, kit style, parts (carbon or body colour), rear aero, paint, wheels. Autosaves.
2. **Drawings** — 4 orthographic AI line drawings (side, front, rear, top) at *high* image quality (`DRAWING_QUALITY`).
   The side view is drawn first and the other three are matched to it. Tick views, write notes, redraw.
3. **Approve** — locks the drawings to the exact build config. Changing the build afterwards marks
   them out of date and blocks renders/export until new drawings are approved.
4. **Renders** — *high*-quality photos made from the approved drawings: side/front edit the matching
   drawing in place; 3/4 angles use the drawings as geometry references.
5. **Export** — production ZIP: approved drawings, renders, spec sheet PDF, BOM CSV, part specs,
   dimensioned per-part PDF/SVG sheets.

## Vehicle library

The **Vehicle profile** card under the car picker keeps what the app learns about each car, saved in Postgres:

- **Research this car** asks `TEXT_MODEL` (with web search when the model supports it) for the generation,
  model years, exterior size, signature design details and facelift changes, with sources. A few cents per car.
- Researched profiles are drafts: check them, correct them with **Edit**, then **Verify**. Only verified
  profiles are added to drawing prompts. Editing or researching again turns a profile back into a draft.
- **Reference photos** of the stock car (side, front, rear, 3/4) are sent with each car drawing once the
  profile is verified. This is the most reliable way to get rare or new cars right.
- **Add a car not in the list** adds any make, model and year to the menus and researches it.
- **New model years:** once a week (with a database) the app checks NHTSA's free vPIC service for
  new model years of the models it knows, and adds them to the menus (about 5 minutes, US market only).
  New model names are not added automatically, because NHTSA lists engine variants (530i, 540i…) as
  models; add new cars by hand. **Check now** runs it on demand. Profiles over a year old are flagged.

## Run on Replit

1. Click **Run** to start the **Start application** workflow (`npm run dev`) on port 5000.
   Express serves the API and Vite serves the React UI through the same port.
2. This workspace has **PostgreSQL** configured through `DATABASE_URL`. Tables are created on start.
3. `OPENAI_API_KEY` is not configured: the app currently runs in **mock mode**
   (clearly labelled placeholder images, no AI charges). Real image generation requires an
   OpenAI key in Replit Secrets and image/text model names available to that account.
   Restart the workflow after changing secrets or model settings.
4. Set the `PASSCODE` Replit Secret to exactly six digits to enable the page access gate.
   Production startup requires it; the existing `SESSION_SECRET` signs the 12-hour login cookie.
5. For a fresh checkout, install dependencies with `npm ci`. The test runner uses Vitest 4
   because the imported Vitest 3 dependency included a package blocked by the package security policy.
6. Publishing configuration is present: build `npm ci && npm run build`, run `npm start`.
   When publishing, choose **Reserved VM**, not Autoscale: drawing and render jobs run inside the
   server process, and Autoscale can stop or duplicate it between requests, losing jobs in progress.

## Settings (Secrets / env)

| Variable | Default | Purpose |
|---|---|---|
| `PASSCODE` | — | Six-digit page access code; required in production |
| `SESSION_SECRET` | Replit Secret | Signs secure access-session cookies |
| `OPENAI_API_KEY` | — | Required for real images |
| `DATABASE_URL` | — | Postgres; without it builds live in memory and vanish on restart |
| `IMAGE_MODEL` | `gpt-image-2.5-sunburst` | Same model the Vanguard-Concept app uses |
| `TEXT_MODEL` | `gpt-6-luna` | Estimates part dimensions when part drawings are made, and researches vehicle profiles |
| `DRAWING_QUALITY` | `high` | `low` / `medium` / `high`; higher quality can cost more per image |
| `RENDER_QUALITY` | `high` | Render image quality |
| `DAILY_IMAGE_LIMIT` | `60` | Hard cap on images per UTC day |
| `AI_MODE` | — | Set to `mock` to force placeholder images |
| `PAINT_LIBRARY_URL` | — | Koncept Paint's published address (`https://…`), for its paint library |
| `PAINT_LIBRARY_KEY` | — | Same value as Koncept Paint's `PAINT_LIBRARY_KEY` (32+ characters) |

## Koncept Paint library

The **Koncept Paint library** group under **Paint** lists the paints saved in the Koncept Paint app.
Picking one copies its name, colour (and second colour for colour-shift paints) and finish
description into the build, so renders don't depend on Koncept Paint being awake, and changing or
removing the paint there doesn't change existing builds. The finish is added to render prompts
and the spec sheet. The list is cached for a minute; **Refresh library** asks again.

## Layout

- `server/` — Express API (`routes.ts`), workflow + jobs (`studio.ts`), OpenAI wrapper (`ai.ts`),
  storage (`store.ts`: Postgres or in-memory), prompts (`domain/prompts.ts`), export (`export/`),
  vehicle library (`vehicles/`: storage, NHTSA check, AI research, routes).
- `shared/` — build config schema (`types.ts`), catalog and car/kit rules ported from Vanguard-Concept.
- `client/` — React UI (Vite). In dev, Vite runs inside the Express process on the same port.

## Commands

- `npm run dev` · `npm test` · `npm run typecheck` · `npm run build` · `npm start`
