# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

二游消费记录 (Gacha Spend Tracker) — a personal single-user web app to log gacha-game top-ups. Records are entered in a foreign currency (JPY/TWD/KRW…) and converted to MYR using the mid-market rate on the order date. There is no custom backend: Supabase provides the database, auth, and row-level security.

Note: the folder is `PurchaseRecord`, but the npm package / repo / deploy path is `gacha-spend-tracker`.

## Commands

```bash
npm run dev       # vite dev server on fixed port 5173 (strictPort)
npm run build     # tsc -b + vite build → dist/, then postbuild copies index.html→404.html
npm run preview   # serve the built dist/
npm run lint      # oxlint (not eslint)
```

There is no test suite. Lint runs via **oxlint** with `react`/`typescript`/`oxc` plugins; the only custom rules are `react/rules-of-hooks` (error) and `react/only-export-components` (warn).

### Running without a database
Open `http://localhost:5173/?demo=1` — `?demo=1` sets `DEMO` (see [src/lib/demoMode.ts](src/lib/demoMode.ts)), which loads `DEMO_PURCHASES` and routes all create/edit/delete through local React state instead of Supabase. There is no admin route in demo mode.

## Deployment

Deployed to **GitHub Pages** at a sub-path, which drives several non-obvious constraints — get these wrong and you get a blank page or 404'd assets:

- `vite.config.ts` sets `base: '/gacha-spend-tracker/'` and `main.tsx` sets `<BrowserRouter basename="/gacha-spend-tracker">`. These must stay in sync.
- **Any static asset path must be prefixed with `import.meta.env.BASE_URL`**, never a hard-coded leading `/`. Hard-coded `/games/foo.webp` 404s under the sub-path. `resolveGameLogo()` in [src/lib/games.ts](src/lib/games.ts) exists precisely to re-resolve legacy absolute paths against `BASE_URL` (idempotently).
- Client-side routing on a static host: `scripts/copy-404.mjs` (the `postbuild` step) copies `index.html` to `404.html` so deep-link refreshes fall back to the SPA.
- Env vars `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are baked in at build time. The anon key is public by design — real data isolation is enforced by Supabase RLS, not by hiding the key.

## Architecture

**Data flow.** [src/App.tsx](src/App.tsx) is the top-level state owner. On an authenticated session it `Promise.all`-loads purchases, games, products, and settings, then passes them down to `Dashboard` and `AdminPage` (both under `src/pages/`). Mutations happen through the `lib/*.ts` data modules and callers call `refresh()` to reload; App exposes narrower `refreshGamesAndProducts()` / `refreshSettings()` for partial reloads.

**`lib/` is the data + logic layer** (keep DB and business logic out of components):
- `supabase.ts` — the single client. It's constructed even when unconfigured (placeholder URL/key) so imports never crash; `isSupabaseConfigured` gates real use at the UI layer.
- `purchases.ts` / `games.ts` / `products.ts` / `settings.ts` — CRUD per table, each returning typed rows and throwing on Supabase error.
- `rates.ts` — historical mid-rate lookup from the fawazahmed0 currency-api (jsDelivr primary, Cloudflare Pages mirror fallback). Walks **back up to 7 days** from the order date to handle weekends/missing data; MYR→MYR is hard-coded to 1; total failure throws so the UI can ask the user to fill MYR manually.
- `currency.ts` — `BASE_CURRENCY = 'MYR'`, the currency dropdown list, symbol/flag maps (flags bundled locally via `flag-icons`), and formatters.
- `migrate.ts` — `importGamesAndProductsFromPurchases()`: one-off, idempotent backfill of the games/products admin lists from existing purchase history (dedupes by name).
- `games.ts` logo resolution — three sources, in this precedence: full `http(s)` URL (Supabase Storage upload) → static file re-resolved against `BASE_URL` → name-based static map (`GAME_ICONS`, files in `public/games/`). Static icons are **never persisted to the DB** (`logo_url` stays null); they're resolved at render time so paths don't get frozen to a deploy location.

**Domain model** ([src/types.ts](src/types.ts), schema in [supabase/schema.sql](supabase/schema.sql)):
- `purchases` — the core ledger. `rate_source` is `'auto'` (mid-rate) or `'manual'` (user overrode MYR to match the actual Wise charge). `myr = cost * rate` but is user-overridable.
- `games` / `products` — admin presets; picking a product in the purchase form auto-fills currency and price. `products.game_id` FKs `games`.
- `settings` — currently only a custom light-mode background image + its vertical position.
- All four tables have per-row RLS keyed on `auth.uid() = user_id`.

**Supabase manual setup** (not in SQL): two **public** Storage buckets, `game-logos` and `backgrounds`, must be created by hand in the console before their RLS policies (in `schema.sql`) apply. Upload path convention is `{user_id}/...` — the first path segment must equal the uid, which the insert/update/delete policies enforce.

## UI conventions

- UI is fully on **antd v6**. Theme wiring lives in [src/components/AntdProvider.tsx](src/components/AntdProvider.tsx): it maps the app's light/dark state (`useTheme`) to antd's `defaultAlgorithm`/`darkAlgorithm` and injects project tokens from `lib/theme.ts` (purple palette, not antd default blue). The tree is wrapped in antd's `<App>` so `Modal.confirm`/`message` inherit theme context.
- Generate IDs with `uuid()` from [src/lib/id.ts](src/lib/id.ts), **not** `crypto.randomUUID()` — the latter is unavailable in non-secure contexts (e.g. custom http dev domains), which was a real blank-screen bug.
- `dev` server allows the custom host `buybuy.local` (see `vite.config.ts` `allowedHosts`).

## Data import (one-off, Python)

`scripts/import_excel.py <supabase_user_uid> [xlsx_path]` reads an Excel export, looks up each row's historical rate, and emits `scripts/import.sql` to paste into the Supabase SQL editor. Requires `pip install -r scripts/requirements.txt`. Rows whose rate can't be fetched get MYR 0 and are fixed manually in-app afterward.
