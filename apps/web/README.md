# Dariise Web

The Dariise dashboard: a Next.js App Router application for managing feature
flags, environments, targeting, and rollouts.

## Stack

- Next.js (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4 via `@tailwindcss/postcss`
- shadcn/ui primitives
- JetBrains Mono (primary) and Geist (secondary) via `next/font`

## Development

`apps/web` is a workspace package, so dependencies are installed once from the
repository root:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

The dashboard runs at <http://localhost:3000>.

From the repository root:

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run `tsc --noEmit` |

Commands can also be scoped with `pnpm --filter web <script>`.

Only one `next dev` server can run per project; Next.js refuses to start a
second one and points at the existing server instead.

## Routes

| Route | Screen | Layout |
| --- | --- | --- |
| `/` | Sign in | `(auth)` |
| `/sign-up` | Create account | `(auth)` |
| `/forgot-password` | Reset password | `(auth)` |
| `/create-workspace` | Create workspace | `(auth)` |
| `/overview` | Dashboard overview | `(app)` |
| `/flags` | Feature flags | `(app)` |
| `/flags/new` | Create a flag | `(app)` |
| `/flags/[key]` | Flag detail — Configuration | `(app)` |
| `/flags/[key]/targeting` | Flag detail — Targeting | `(app)` |
| `/flags/[key]/history` | Flag detail — History | `(app)` |
| `/flags/[key]/dependencies` | Flag detail — Dependencies | `(app)` |

Both groups are route groups, so their names never appear in a URL.
`app/layout.tsx` remains the only root layout.

`(auth)` shares a two-column brand/form shell. `(app)` shares the application
shell — fixed sidebar, topbar, and a scrolling content area — and is rendered per
request so the dashboard figures and relative timestamps stay current.

The flag detail tabs are `<Link>`s rather than tab state, so each one is a real,
addressable route. Configuration is the bare `/flags/[key]` route, matching the
default tab. An unknown key calls `notFound()`.

## Layout

```text
app/(auth)/             # Sign in, sign up, reset, create workspace
app/(app)/              # Dashboard: overview, flags, flag detail and its tabs
app/layout.tsx          # Root layout: fonts, metadata, globals.css
app/globals.css         # Design tokens (see below)
components/app/         # Sidebar, topbar, nav config, dashboard cards, table
components/app/flags/   # Flag headers, tabs, create form, tab panels
components/auth/        # Auth shell, shared fields, and the four forms
components/ui/          # shadcn/ui primitives
components/logo.tsx     # brand mark
lib/api.ts              # typed client for the Dariise API
lib/auth-stub.ts        # temporary auth stand-in (no backend yet)
lib/dashboard-data.ts   # temporary dashboard fixtures (no backend yet)
lib/env.ts              # runtime configuration
lib/flag-detail-data.ts # temporary per-flag detail records
lib/flag-stub.ts        # temporary flag create/publish stand-in
lib/format.ts           # relative time and number formatters
lib/types.ts            # domain types shared with the API
lib/validation.ts       # dependency-free form validators
```

## Sidebar navigation

`components/app/nav-config.ts` lists every section from the design, but only an
entry with an `href` is a real link. Entries without one render as
non-interactive and marked **Soon** — nothing in the sidebar leads to a route
that does not exist. To light one up, build the screen and add its `href`.

## Design tokens

Every colour and font in the app resolves to a CSS custom property declared in
`app/globals.css`, grouped as:

- **auth-only** — `--auth-*`, used exclusively by the authentication screens
- **shared** — `--primary`, `--foreground`, `--background`, `--card`, `--muted`,
  `--border`, `--danger-ink`, `--info-ink`, and friends
- **app-only** — `--primary-ink`, `--ok-ink`, `--warn-ink`, `--slate-ink`,
  `--purple-ink`
- **navigation** — `--nav-*`, for the sidebar

Each group has light values in `:root` and dark values in `.dark`. The full app
palette is declared even where a screen does not use it yet, so the dashboard can
be built without changing the theme. Tokens marked `derived` in the file are the
few that shadcn primitives require but the design spec does not define; they are
taken from the documented scale.

Use the tokens rather than raw colours — `bg-auth-panel`, `text-danger-ink`,
`bg-info-ink/5` — so light and dark stay in step.

## Adding UI components

`components.json` is configured for the shadcn CLI with the `radix` base:

```bash
pnpm dlx shadcn@latest add <component>
```

## Configuration

Configuration is read in `lib/env.ts`. Only variables prefixed with
`NEXT_PUBLIC_` reach the browser.

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the Dariise API. Required for production builds. |

## Notes

- Server Components are the default. Each page is a Server Component that renders
  small `"use client"` pieces — the auth forms, the sidebar (for `usePathname`),
  and the flags table (for search and filtering).
- `lib/api.ts` is a library only — no page calls it yet.
- `lib/auth-stub.ts` fakes the round-trip to the API so the forms' pending and
  success states are real. Nothing is persisted, no session exists, and no route
  is protected. It is the single swap point once `apps/api` lands.
- `lib/dashboard-data.ts` holds the dashboard fixtures, shaped like the API
  responses. `getDashboardData(now)` takes the current instant so relative
  timestamps are derived rather than stored, which keeps server output and
  hydration in agreement. It is the second swap point once `apps/api` lands.
- `lib/flag-detail-data.ts` holds the per-flag detail records. Only
  `checkout-v2` is transcribed in full; every other flag derives a plain record
  from its summary row so no table row leads to an empty page.
- `lib/flag-stub.ts` stands in for the flag write endpoints. Creating and
  publishing acknowledge locally and persist nothing — a reload discards them.
- The topbar's search, environment switcher, notifications and theme toggle are
  presentational and marked as coming soon, matching the sidebar rule.
- Interactive controls without an implementation — `Edit Flag`, `Auto segment`,
  `Add user`, `Archive Flag`, version diffing — are disabled with a title rather
  than pretending to work.
