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
                         │       FastAPI        │
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

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

### Data

- PostgreSQL
- Redis

### Testing

- pytest
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
│   │   │   ├── (app)/          # dashboard: overview and feature flags
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── globals.css     # design tokens
│   │   ├── components/
│   │   │   ├── app/            # sidebar, topbar, dashboard cards, flags table
│   │   │   │   └── flags/      # flag headers, tabs, create form, tab panels
│   │   │   ├── auth/           # auth shell, shared fields, forms
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   └── logo.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # typed Dariise API client
│   │   │   ├── auth-stub.ts    # temporary stand-in until apps/api exists
│   │   │   ├── dashboard-data.ts   # temporary dashboard fixtures
│   │   │   ├── flag-detail-data.ts # temporary per-flag detail records
│   │   │   ├── flag-stub.ts    # temporary flag create/publish stand-in
│   │   │   ├── env.ts          # runtime configuration
│   │   │   ├── format.ts       # relative time and number formatters
│   │   │   ├── types.ts        # domain types shared with the API
│   │   │   └── validation.ts   # dependency-free form validators
│   │   └── public/
│   │
│   └── api/
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   ├── repositories/
│       │   └── evaluation/
│       │
│       └── tests/
│
├── packages/
│   └── sdk/
│
├── migrations/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 24+
- pnpm 10+
- Python 3.12+
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

Create a virtual environment:

```bash
cd apps/api

python -m venv .venv
```

Activate it:

**macOS/Linux**

```bash
source .venv/bin/activate
```

**Windows**

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

Run migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
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
pnpm build        # production build of apps/web
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
```

---

## Environment Variables

Backend (`apps/api/.env`):

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dariise

REDIS_URL=redis://localhost:6379

SECRET_KEY=your-secret-key

CORS_ORIGINS=http://localhost:3000
```

Frontend (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

See `apps/web/.env.example`. Only `NEXT_PUBLIC_` variables are exposed to the
browser.

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
- [ ] Authentication — sign in, create account, reset password, and create workspace screens are built; the API and session handling are not
- [ ] Projects
- [ ] Environments
- [ ] Feature flag CRUD — create, detail, targeting, history and dependency screens are built against fixtures; writes are not persisted
- [ ] Boolean flags — the create flow and configuration screens model Boolean flags; other types are selectable but not yet configurable
- [ ] Dashboard — overview and feature flag screens are built against fixtures; not yet wired to the API
- [ ] Audit logs

### Phase 2 — Targeting

- [ ] User attributes
- [ ] Targeting rules
- [ ] Percentage rollouts
- [ ] Segments
- [ ] Deterministic user bucketing

### Phase 3 — SDK & Performance

- [ ] JavaScript/TypeScript SDK
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
- [ ] Usage analytics
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