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
| `/segments` | Segments list | `(app)` |
| `/segments/new` | Create a segment | `(app)` |
| `/segments/[key]` | Segment detail — Definition | `(app)` |
| `/segments/[key]/members` | Segment detail — Members | `(app)` |
| `/segments/[key]/flags` | Segment detail — Flags | `(app)` |
| `/environments` | Environments list | `(app)` |
| `/environments/new` | Create an environment | `(app)` |
| `/environments/[key]` | Environment detail — SDK keys | `(app)` |
| `/environments/[key]/coverage` | Environment detail — Coverage | `(app)` |
| `/environments/[key]/settings` | Environment detail — Settings | `(app)` |
| `/api-keys` | API keys list | `(app)` |
| `/api-keys/new` | Create an API key | `(app)` |
| `/analytics` | Analytics | `(app)` |
| `/audit-log` | Audit log | `(app)` |
| `/settings` | Settings — General | `(app)` |
| `/settings/security` | Settings — Security | `(app)` |
| `/settings/integrations` | Settings — Integrations | `(app)` |
| `/settings/billing` | Settings — Billing | `(app)` |
| `/profile` | Personal profile | `(app)` |

Both groups are route groups, so their names never appear in a URL.
`app/layout.tsx` remains the only root layout.

`(auth)` shares a two-column brand/form shell. `(app)` shares the application
shell — fixed sidebar, topbar, and a scrolling content area — and is rendered per
request so the dashboard figures and relative timestamps stay current.

The flag, segment and environment detail tabs are `<Link>`s rather than tab
state, so each one is a real, addressable route. Configuration, Definition and
SDK keys are the bare `/[key]` routes, matching each design's default tab. An
unknown key calls `notFound()`.

The Settings sections follow the same rule: `app/(app)/settings/layout.tsx`
renders the title and the section nav once, and General, Security, Integrations
and Billing are four routes underneath it. `/settings` is General.

## Layout

```text
app/(auth)/             # Sign in, sign up, reset, create workspace
app/(app)/              # Dashboard: overview, flags, segments, environments,
                        # api keys, analytics, audit log, settings
app/layout.tsx          # Root layout: fonts, metadata, globals.css
app/globals.css         # Design tokens (see below)
components/app/         # Sidebar, topbar, nav config, dashboard cards, table
components/app/flags/   # Flag headers, tabs, create form, tab panels
components/app/segments/# Segment headers, tabs, list, create form, tab panels
components/app/environments/ # Environment headers, cards, tabs, keys, coverage
components/app/api-keys/ # Key table, badges, create form and its note cards
components/app/analytics/ # Metric cards, evaluation chart, latency, top flags
components/app/audit-log/ # Timeline, change details and the filter view
components/app/settings/ # Settings cards, section nav, profile, security, billing
components/app/profile/ # Personal profile, password and preference cards
components/app/account-menu.tsx # avatar dropdown in the topbar
components/app/copy-button.tsx # shared copy-to-clipboard button
components/app/settings-card.tsx # card shared by Settings and Profile
components/app/theme-choice.tsx # shared Light/Dark/System control
components/auth/        # Auth shell, shared fields, and the four forms
components/ui/          # shadcn/ui primitives
components/logo.tsx     # brand mark
lib/analytics-data.ts   # temporary analytics fixtures (no backend yet)
lib/api-key-data.ts     # temporary API key fixtures, scopes and masking
lib/api-key-stub.ts     # temporary API key issue stand-in + session store
lib/api.ts              # typed client for the Dariise API
lib/audit-log-data.ts   # temporary audit events and their derived labels
lib/auth-stub.ts        # temporary auth stand-in (no backend yet)
lib/billing-data.ts     # temporary plan, usage and invoice fixtures
lib/dashboard-data.ts   # temporary dashboard fixtures (no backend yet)
lib/environment-data.ts # temporary environment fixtures, coverage and masking
lib/environment-stub.ts # temporary environment create/settings stand-in
lib/env.ts              # runtime configuration
lib/flag-detail-data.ts # temporary per-flag detail records
lib/flag-stub.ts        # temporary flag create/publish stand-in
lib/format.ts           # relative time, date and number formatters
lib/profile-data.ts     # temporary personal profile fixtures
lib/profile-stub.ts     # temporary profile/password/preference stand-in
lib/segment-data.ts     # temporary segments plus the sample-audience evaluator
lib/segment-stub.ts     # temporary segment create/archive stand-in
lib/settings-data.ts    # temporary workspace, security and integration fixtures
lib/types.ts            # domain types shared with the API
lib/validation.ts       # dependency-free form validators
lib/workspace-stub.ts   # temporary workspace write stand-in
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
  the account menu, the flags table (for search and filtering), the audit log view
  (for search, filtering and row selection) and the API key table (for row menus
  and the session's newly issued key).
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
- `lib/segment-data.ts` holds the segment fixtures **and** the evaluator. Member
  counts, the Members tab and the Definition live preview all run the same
  `matchesSegment` function over a curated sample audience, so those numbers
  agree by construction rather than by being copied from the design. It is a
  sample audience, not a customer list.
- `lib/segment-stub.ts` stands in for the segment write endpoints, same rules.
- `lib/environment-data.ts` holds the environment fixtures: three environments,
  their SDK keys, their endpoints and the flag coverage matrix. Endpoints and
  masked keys are derived from each record rather than stored twice, so a URL or
  a mask cannot drift from the environment it belongs to. `maskSdkKey` keeps the
  prefix and four identifier characters, e.g. `ff_prod_a1b2••••••`.
- `lib/environment-stub.ts` stands in for the environment write endpoints —
  creating an environment and saving its settings both acknowledge locally and
  persist nothing.
- `lib/analytics-data.ts` holds the analytics fixtures. Each day's total is the
  sum of its per-environment values and the "Evaluations by Environment" legend
  goes through `sharePercentages`, so the bars and the percentages add up rather
  than being copied from the design. The design's two windows — the 24-hour cards
  and the seven-day chart — are kept as they are; the chart's scale is documented
  in the fixture because the design prints bare numbers.
- `lib/audit-log-data.ts` holds the audit events as `ageHours` offsets, resolved
  against a caller-supplied `now`. Every label a row shows — day heading, clock
  time, absolute time, context line — is produced there, so the client component
  can filter and regroup without re-formatting a date and hydration stays in
  step. The actor name, environment names and the Beta Users member count are
  read from the other fixtures rather than copied, so the audit log cannot
  disagree with the screens they came from.
- `lib/api-key-data.ts` holds the API key fixtures: the credentials, the scope
  list the create form offers and the resolved rows the table renders. The full
  credential exists only here, and masking goes through the environment screens'
  `maskSdkKey` (re-exported as `maskApiKey`), so the two screens cannot disagree
  about how a key is hidden. Environment names and colours are read from
  `environment-data.ts` rather than copied.
- `lib/api-key-stub.ts` stands in for the key-issuing endpoint. It also keeps the
  key it just issued in memory, which is what makes the list's "shown once"
  banner real: `create-api-key-form.tsx` hands the credential over and returns to
  the list, where `api-key-table.tsx` reads it with `useSyncExternalStore`. A
  reload clears it, exactly as the copy promises.
- `components/app/copy-button.tsx` holds the one clipboard implementation. The
  SDK key chips and the API key screens both use it; the menu item that cannot be
  a button calls its `writeToClipboard` helper directly.
- `lib/settings-data.ts` holds the workspace, security and integration fixtures.
  The workspace name is owned here rather than in the chrome: `app/(app)/layout.tsx`
  passes it to the sidebar and topbar, so the General tab and the chip in the
  corner cannot disagree. The workspace URL is a projection of the immutable slug
  rather than a second stored value.
- `lib/billing-data.ts` derives the renewal and invoice dates from a caller-supplied
  `now` (next month, and this month plus the two before it), so the Billing tab
  never goes stale, and reads the environment count from `environment-data.ts` so
  the allowance matches the Environments screen.
- `lib/workspace-stub.ts` stands in for the workspace write endpoints. The
  General tab uses the app's explicit save pattern (dirty → `Save changes` →
  `Saved just now`); the Security tab has no save button in the design, so each
  control applies through the stub on change and the card header acknowledges it
  briefly. Neither persists, and the sidebar keeps the fixture name.
- `lib/profile-data.ts` assembles the personal record instead of duplicating it:
  identity from `dashboard-data.ts`, workspace name and theme from
  `settings-data.ts`, default environment from the environments fixture. Member
  since is a fixed instant rather than an age offset, because it is a fact about
  the account rather than a relative label.
- `lib/profile-stub.ts` stands in for the personal write endpoints (`/v1/me`).
  The Profile and Password cards keep explicit save buttons; Preferences and
  Notifications apply on change with the same transient acknowledgement the
  Security tab uses.
- `components/app/account-menu.tsx` is the avatar dropdown in the topbar. It links
  to Profile, Settings and API keys, and its `Sign out` is the one place the auth
  stub is used outside the access screens: there is no session to end, so it fakes
  the round-trip and returns to `/`.
- The topbar's search, environment switcher, notifications and theme toggle are
  presentational and marked as coming soon, matching the sidebar rule. So is the
  theme control, which is shared by the Appearance and Preferences cards — the
  design tokens ship dark values, but nothing switches them yet.
- Interactive controls without an implementation — `Edit Flag`, `Auto segment`,
  `Add user`, `Archive Flag`, `Edit` on a segment, `Edit environment`,
  `Create key`, `Delete environment`, version diffing, `Export`, `Export CSV`,
  `Revert this change`, `Rename key`, `Rotate key`, `Revoke key`, `Theme`,
  `Delete workspace`, `Manage` (SSO), `Add` (email domains), `Configure` (IP
  allowlist), `Connect`, `Open SDKs & Integration`, `Change plan`, `Update`
  (payment method), invoice downloads and `Change photo` — are disabled with a
  title rather than pretending to work. Creating, archiving, searching, filtering
  the audit log and selecting an audit event, editing rules, revealing and copying
  a key, issuing an API key and copying it, saving environment settings, the
  workspace profile and the personal profile, changing the password, the security,
  preference and notification controls, signing out, and tab navigation do work,
  locally.
