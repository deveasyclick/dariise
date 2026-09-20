# Dariise

> Feature management and progressive delivery for modern applications.

Dariise is a developer-focused feature management platform for safely controlling application features without requiring a new deployment.

It allows teams to create feature flags, manage them across environments, target specific users, gradually roll out features, and track configuration changes from a central dashboard.

---

## Overview

- [Features](#features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Flag Evaluation](#flag-evaluation)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [SDK](#sdk)
- [Reliability](#reliability)
- [Security](#security)
- [Roadmap](#roadmap)
- [Engineering Goals](#engineering-goals)
- [License](#license)

---

## Features

- Feature flag management
- Multiple environments
- Boolean feature flags
- User-based targeting
- Percentage-based rollouts
- Reusable user segments
- Feature flag evaluation API
- Audit logs
- API key management
- SDK integration
- Configuration caching with Redis
- PostgreSQL-backed configuration
- Real-time configuration updates
- Environment-specific flag configuration

## How It Works

Feature flags make it possible to separate **deploying code** from **releasing functionality**.

Instead of:

```text
Build → Deploy → Everyone gets the feature
```

Dariise enables:

```text
Build → Deploy → Gradually release
                    │
                    ├── Internal users
                    ├── Beta users
                    ├── 10%
                    ├── 50%
                    └── 100%
```

This makes it easier to release features safely, test changes with smaller groups of users, and quickly disable functionality without deploying new code.

---

## Architecture

```text
                         ┌──────────────────────┐
                         │       Next.js        │
                         │      Dashboard       │
                         └──────────┬───────────┘
                                    │
                              HTTP / SSE
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Hono 4 on Node.js   │
                         │   modular monolith   │
                         │                      │
                         │  Projects            │
                         │  Environments        │
                         │  Feature Flags       │
                         │  Targeting           │
                         │  Rollouts            │
                         │  Segments            │
                         │  Audit Logs          │
                         └───────┬───────┬──────┘
                                 │       │
                         ┌───────▼───┐ ┌─▼──────┐
                         │ PostgreSQL│ │ Redis  │
                         └───────────┘ └────────┘
```

Customer applications interact with Dariise through an SDK or evaluation API:

```text
┌─────────────────────┐
│ Customer Application│
└──────────┬──────────┘
           │
           ▼
     ┌───────────┐
     │ Dariise SDK │
     └─────┬─────┘
           │
           ▼
     ┌───────────┐
     │  Dariise    │
     │ Evaluation│
     │   Engine  │
     └───────────┘
```

---

## Core Concepts

### Projects

A project represents an application or product managed by a team.

```text
Dariise
└── Projects
    ├── Web App
    ├── Mobile App
    └── API
```

### Environments

Each project can have multiple environments.

```text
Development
Staging
Production
```

A feature can have different configurations in each environment.

For example:

```text
checkout-v2

Development    ON
Staging        ON
Production     OFF
```

### Feature Flags

A feature flag controls whether functionality is available to users.

Example:

```text
checkout-v2
```

```json
{
  "enabled": true
}
```

### Targeting

Flags can be enabled for users based on attributes.

Example:

```text
IF country == "NG"
THEN enable checkout-v2
```

Or:

```text
IF plan == "enterprise"
THEN enable checkout-v2
```

### Percentage Rollouts

Features can be gradually released to users.

```text
checkout-v2

10% → 25% → 50% → 100%
```

Users are deterministically assigned to rollout buckets so that the same user receives a consistent result.

### Segments

Segments allow reusable groups of users to be defined once and referenced by multiple feature flags.

Example:

```text
Beta Users

user.beta == true
```

A feature can then target:

```text
IF user belongs to "Beta Users"
THEN enable
```

---

## Flag Evaluation

The evaluation engine determines whether a feature should be enabled for a particular user.

A simplified evaluation flow:

```text
Request
  │
  ▼
Find flag
  │
  ▼
Validate environment
  │
  ▼
Evaluate targeting rules
  │
  ▼
Evaluate segments
  │
  ▼
Evaluate percentage rollout
  │
  ▼
Return variation
```

Example:

```python
result = evaluator.evaluate(
    flag="checkout-v2",
    environment="production",
    user={
        "id": "user_123",
        "country": "NG",
        "plan": "pro",
    },
)
```

Response:

```json
{
  "flag": "checkout-v2",
  "enabled": true,
  "variation": "on",
  "reason": "targeting_rule"
}
```

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS v4
- shadcn/ui

### Backend

- Node.js
- TypeScript
- Hono 4
- Drizzle ORM
- Better Auth

### Data

- PostgreSQL — the source of truth
- Redis — configuration cache only, never on the critical path

### Testing

- Vitest
- API integration tests

### Infrastructure

- Docker
- Docker Compose

---

## Project Structure

```text
dariise/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (auth)/         # sign in, sign up, reset, create workspace
│   │   │   ├── (getting-started)/ # create project (last onboarding step)
│   │   │   ├── (app)/          # dashboard: overview, flags, segments, environments,
│   │   │   │                   # analytics, audit log
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── globals.css     # design tokens
│   │   ├── components/
│   │   │   ├── app/            # sidebar, topbar, dashboard cards, flags table
│   │   │   │   ├── flags/      # flag headers, tabs, create form, tab panels
│   │   │   │   ├── projects/   # project headers, tabs, cards, actions menu
│   │   │   │   ├── segments/   # segment headers, tabs, list, create form
│   │   │   │   ├── environments/ # environment headers, cards, tabs, keys, coverage
│   │   │   │   ├── api-keys/   # key table, badges, create form, note cards
│   │   │   │   ├── analytics/  # metric cards, evaluation chart, latency, top flags
│   │   │   │   ├── audit-log/  # timeline, change details, filter view
│   │   │   │   ├── sdks/       # SDK picker, connection panel, resources card
│   │   │   │   ├── settings/   # settings cards, section nav, profile, billing
│   │   │   │   └── profile/    # personal profile, password, preferences cards
│   │   │   ├── auth/           # auth shell, step path, shared fields, forms
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── account-menu.tsx # avatar dropdown in the topbar
│   │   │   ├── copy-button.tsx # shared copy-to-clipboard button
│   │   │   ├── health-badge.tsx # health pill shared by environments and projects
│   │   │   ├── settings-card.tsx # card shared by settings and profile
│   │   │   ├── theme-choice.tsx # shared Light/Dark/System control
│   │   │   └── logo.tsx
│   │   ├── lib/
│   │   │   ├── analytics-data.ts # temporary analytics fixtures
│   │   │   ├── api-key-data.ts # temporary API key fixtures, scopes and masking
│   │   │   ├── api-key-stub.ts # temporary key issue stand-in + session store
│   │   │   ├── api.ts          # typed Dariise API client
│   │   │   ├── audit-log-data.ts # temporary audit events with derived labels
│   │   │   ├── auth-stub.ts    # temporary stand-in until apps/api exists
│   │   │   ├── billing-data.ts # temporary plan, usage and invoice fixtures
│   │   │   ├── dashboard-data.ts   # temporary dashboard fixtures
│   │   │   ├── environment-data.ts # temporary environment + flag coverage fixtures
│   │   │   ├── environment-stub.ts # temporary environment create/settings stand-in
│   │   │   ├── flag-detail-data.ts # temporary per-flag detail records
│   │   │   ├── flag-stub.ts    # temporary flag create/publish stand-in
│   │   │   ├── env.ts          # runtime configuration
│   │   │   ├── format.ts       # relative time, date and number formatters
│   │   │   ├── onboarding-data.ts # temporary data-region options for onboarding
│   │   │   ├── profile-data.ts # temporary personal profile fixtures
│   │   │   ├── profile-stub.ts # temporary profile/password/preference stand-in
│   │   │   ├── project-data.ts # temporary projects, environments and flags
│   │   │   ├── project-stub.ts # temporary project create stand-in
│   │   │   ├── sdk-data.ts     # temporary SDK snippets and evaluation scopes
│   │   │   ├── segment-data.ts # temporary segments + sample-audience evaluator
│   │   │   ├── segment-stub.ts # temporary segment create/archive stand-in
│   │   │   ├── settings-data.ts # temporary workspace, security and integration fixtures
│   │   │   ├── types.ts        # domain types shared with the API
│   │   │   ├── validation.ts   # dependency-free form validators
│   │   │   └── workspace-stub.ts # temporary workspace write stand-in
│   │   └── public/
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/       # workspace, projects, project-members,
│       │   │                  # environments, flags, segments, api-keys,
│       │   │                  # audit-log, analytics, evaluation
│       │   │   └── <module>/  # routes, validator, service, repository,
│       │   │                  # mapper, errors, index
│       │   ├── shared/        # config, db, cache, errors, logger, middleware
│       │   ├── auth.ts        # Better Auth instance
│       │   ├── app.ts         # Hono app composition
│       │   └── server.ts      # process entry point
│       │
│       ├── drizzle/           # generated SQL migrations
│       └── tests/
│
├── packages/
│   └── contracts/             # zod schemas + inferred types shared with apps/web
│
├── docs/
│   ├── backend-proposal.md
│   └── adr/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 24+
- pnpm 10+
- PostgreSQL 17+
- Redis 8+
- Docker

### Clone the repository

```bash
git clone https://github.com/your-username/dariise.git

cd dariise
```

### Start infrastructure

```bash
docker compose up -d postgres redis
```

### Backend

`apps/api` is part of the same pnpm workspace, so its dependencies are installed
from the repository root:

```bash
pnpm install
```

Create your environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Run migrations:

```bash
pnpm --filter api db:migrate
```

Start the API:

```bash
pnpm --filter api dev
```

The API will be available at:

```text
http://localhost:4000
```

The OpenAPI document is served at:

```text
http://localhost:4000/v1/openapi.json
```

### Frontend

The web dashboard lives in `apps/web` and is part of a pnpm workspace, so
dependencies are installed once from the repository root:

```bash
pnpm install
```

Create your environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Start the dev server:

```bash
pnpm dev
```

The dashboard will be available at:

```text
http://localhost:3000
```

Other workspace commands:

```bash
pnpm dev          # run the dashboard and the API together
pnpm dev:web      # dashboard only
pnpm dev:api      # API only
pnpm build        # production build of apps/web
pnpm lint         # ESLint (apps/web)
pnpm typecheck    # tsc --noEmit across contracts, api and web
pnpm test         # API tests
pnpm db:generate  # generate a Drizzle migration
pnpm db:migrate   # apply migrations
```

---

## Environment Variables

Backend (`apps/api/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5442/dariise

REDIS_URL=redis://localhost:6389

BETTER_AUTH_SECRET=your-secret-key

BETTER_AUTH_URL=http://localhost:4000

CORS_ORIGINS=http://localhost:3000
```

Frontend (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000

API_INTERNAL_URL=http://localhost:4000
```

See `apps/web/.env.example`. Only `NEXT_PUBLIC_` variables are exposed to the
browser. `API_INTERNAL_URL` is server-only and is used by Server Components, which
call the API directly rather than through the browser.

---

## SDK

The Dariise SDK provides a simple interface for applications to evaluate feature flags.

Example:

```typescript
const enabled = await dariise.isEnabled(
  "checkout-v2",
  {
    userId: "user_123",
    country: "NG",
    plan: "pro"
  }
);

if (enabled) {
  // New checkout
} else {
  // Existing checkout
}
```

The SDK is designed to eventually support:

- Local configuration caching
- Offline evaluation
- Automatic configuration refresh
- Fallback values
- Low-latency evaluation
- Environment isolation

---

## Reliability

Feature flag infrastructure sits in the critical path of application behavior, so the evaluation system should remain reliable even when Dariise is temporarily unavailable.

The SDK is designed around safe defaults:

```text
Application
     │
     ▼
  Dariise SDK
     │
     ├── Cached configuration ──► Evaluate locally
     │
     └── Dariise unavailable
                 │
                 ▼
           Fallback value
```

This prevents a feature management outage from becoming an application outage.

---

## Security

Dariise separates management credentials from application evaluation credentials.

The platform will support:

- Environment-scoped API keys
- Role-based access control
- API key rotation
- Audit logging
- Secure credential storage
- Project isolation
- Environment isolation

Secrets should never be committed to source control.

---

## Roadmap

### Phase 1 — Core

- [x] Project setup
- [ ] Authentication — sign in, create account, reset password, create workspace and create project screens are built as one three-step onboarding flow; the API and session handling are not
- [ ] Projects — the onboarding step and the dashboard's create-project screen both name a project, and the projects list plus each project's Environments, Flags and Members screens are built against fixtures; nothing is saved, renamed, archived or switched
- [ ] Environments — list, create and detail screens (SDK keys, coverage, settings) are built against fixtures; SDK keys are masked sample values and nothing is wired to the API
- [ ] Feature flag CRUD — create, detail, targeting, history and dependency screens are built against fixtures; writes are not persisted
- [ ] Boolean flags — the create flow and configuration screens model Boolean flags; other types are selectable but not yet configurable
- [ ] Dashboard — the overview screen (stat cards, active rollouts, flag health, recent activity, evaluation latency) and the feature flag, segment and environment screens are built against fixtures; not yet wired to the API
- [ ] Audit logs — the audit log screen (filters, day-grouped timeline, change details) is built against fixtures; nothing is recorded or persisted yet
- [ ] API keys — the list and create screens are built against fixtures, with scopes, expiration and a one-time reveal of the issued key; nothing is issued, stored or revoked
- [ ] Settings — the workspace profile, security, integrations and billing screens are built against fixtures; nothing is saved, connected or charged, and the theme control is not wired to the tokens
- [ ] Personal profile — the account, password, preference and notification screens plus the avatar menu are built against fixtures; signing out only returns to the access screens because there is no session

### Phase 2 — Targeting

- [ ] User attributes
- [ ] Targeting rules
- [ ] Percentage rollouts
- [ ] Segments — list, create and detail screens are built against fixtures, with member counts derived by a sample-audience evaluator; not wired to the API
- [ ] Deterministic user bucketing

### Phase 3 — SDK & Performance

- [ ] JavaScript/TypeScript SDK — the SDKs & Integration screen documents install, initialize and evaluate snippets for eight SDKs against fixtures; no SDK package is published yet
- [ ] Python SDK
- [ ] Go SDK
- [ ] Local caching
- [ ] Redis caching
- [ ] Configuration polling
- [ ] Real-time updates
- [ ] Fallback behavior

### Phase 4 — Progressive Delivery

- [ ] Scheduled rollouts
- [ ] Rollout history
- [ ] Feature dependencies
- [ ] Approval workflows
- [ ] Automatic rollback
- [ ] Change notifications

### Phase 5 — Observability

- [ ] Flag evaluation metrics
- [ ] Evaluation latency
- [ ] Error tracking
- [ ] Usage analytics — the analytics screen (evaluation volume, SDK latency, per-environment split, top flags) is built against fixtures; no metrics are collected yet
- [ ] OpenTelemetry integration

---

## Engineering Goals

Dariise is being built with a focus on the engineering challenges behind feature management systems rather than simply providing a CRUD dashboard.

Key areas include:

- Low-latency flag evaluation
- Deterministic percentage rollouts
- Configuration consistency
- Caching and invalidation
- Safe fallback behavior
- Environment isolation
- API authentication
- Configuration versioning
- Auditability
- Horizontal scalability
- Reliable SDK behavior

---

## License

MIT