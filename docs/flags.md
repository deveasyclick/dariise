# Flags

A flag is a named switch that lives inside exactly one environment. This document covers its
anatomy, addressing, variations, targeting rules, individual targets, percentage rollout,
promotion, versions, dependencies and archiving; the evaluation algorithm, the approval
workflow and the role matrix belong to `docs/evaluation.md`, `docs/change-requests.md` and
`docs/authorization.md`.

## A flag's anatomy

The flag row is the flag: identity and configuration together. A flag exists in one
environment, so it has exactly one configuration and there is no separate configuration table
(`docs/architecture.md §2`).

| Column in `flags`       | Wire field          | Meaning                                                                     |
| ----------------------- | ------------------- | --------------------------------------------------------------------------- |
| `id`, `project_id`      | `id`, `projectId`   | Primary key and the owning project.                                         |
| `environment_id`        | —                   | The one environment; the wire sends `environmentKey` and `environmentName`.  |
| `key`                   | `key`               | Unique within the environment; no update path exposes it.                    |
| `name`                  | `name`              | Display name, 1–80 characters.                                              |
| `description`           | `description`       | Nullable, at most 280 characters.                                           |
| `type`                  | `type`              | `boolean`, `string`, `number` or `json`; defaults to `boolean`.              |
| `tags`                  | `tags`              | Non-empty strings; empty by default.                                        |
| `owner`                 | `owner`             | Nullable free text, not a foreign key.                                      |
| `status`                | `status`            | `active` or `archived`; defaults to `active`.                                |
| `enabled`               | `enabled`           | Whether it serves here; defaults to `false`.                                |
| `off_variation_key`, `default_variation_key` | `offVariation`, `defaultVariation` | Served when off (default `off`) and by default (default `on`). |
| `rollout_percentage`, `bucket_by` | `rolloutPercentage`, `bucketBy` | Integer 0–100, default `0`, and the subject attribute to bucket on, default `userId`. |
| `created_at`, `updated_at` | `createdAt`, `updatedAt` | ISO timestamps on the wire.                                           |

Creation takes `environmentKey`, `key`, `name`, optional `description`, `tags` and `owner`, an
optional `type` and an optional `values` pair. A flag starts with the variations `on` and `off`,
whose values come from `values` or from the API's `defaultVariations(type)` seeds; a value that
does not match the declared type is refused at creation and on every later configuration write.
All four types are selectable in the create form, and the configuration tab renders a value
control chosen by the declared type. A boolean flag's two values are the two booleans and
nothing more is asked for; another type is asked for its on and off values. The type cannot be
changed after creation. `updated_at` moves on an identity update, a configuration publish and an
archive, not when rules or targets are replaced.

## A flag lives inside one environment

`environment_id` is `NOT NULL` and the key is unique per environment through the index
`flag_environment_key_idx` on `(environment_id, key)`, so the same key may name different flags
in different environments. The canonical address is
`/v1/projects/:projectKey/environments/:environmentKey/flags/:flagKey`, the only one complete
without query parameters.

`GET /v1/projects/:projectKey/flags` lists one environment and requires `environmentKey` as a
query parameter. `GET /v1/flags` is the workspace-wide list across every project in the
session's workspace, optionally narrowed by `projectKey`, `environmentKey`, `status` and
`search`, with each row carrying its `projectKey` so the screen renders outside a project.
`GET /v1/flags/:flagKey` resolves a key when the project is not known: `projectKey` and
`environmentKey` are required query parameters, a missing one is a 400, and the answer is the
canonical detail.

## The flag route inventory

`FLAG` below is `/v1/projects/:projectKey/environments/:environmentKey/flags/:flagKey`.

| Method   | Path                              | What it does                                                                  | Minimum project role       |
| -------- | --------------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `GET`    | `/v1/flags`                       | Workspace-wide list across every project in the workspace.                     | none — session's workspace |
| `GET`    | `/v1/flags/:flagKey`              | Resolve one flag from `projectKey` and `environmentKey` query parameters.      | `viewer`                   |
| `GET`    | `/v1/projects/:projectKey/flags`  | List the environment named by the `environmentKey` query parameter.            | `viewer`                   |
| `POST`   | `/v1/projects/:projectKey/flags`  | Create in the environment named by the body's `environmentKey`; answers 201.   | `engineer`                 |
| `GET`    | `FLAG`                            | The canonical read: identity plus configuration.                              | `viewer`                   |
| `PATCH`  | `FLAG`                            | Update identity: `name`, `description`, `tags`, `owner`.                      | `engineer`                 |
| `DELETE` | `FLAG`                            | Archive the flag.                                                             | `engineer`                 |
| `PATCH`  | `FLAG/config`                     | Publish `enabled`, `variations`, `offVariation`, `defaultVariation`, `rolloutPercentage` and `bucketBy`. | `engineer`  |
| `GET`    | `FLAG/rules`                      | Read the ordered targeting rules.                                             | `viewer`                   |
| `PUT`    | `FLAG/rules`                      | Replace the whole targeting rule set.                                         | `engineer`                 |
| `GET`    | `FLAG/targets`                    | Read the individual targets.                                                  | `viewer`                   |
| `PUT`    | `FLAG/targets`                    | Replace the whole individual target set.                                      | `engineer`                 |
| `GET`    | `FLAG/dependencies`               | Read the dependency graph around the flag.                                    | `viewer`                   |
| `GET`    | `FLAG/versions`                   | Read the configuration history, paginated.                                    | `viewer`                   |
| `POST`   | `FLAG/promote`                    | Copy the flag whole into another environment of the project; answers 201.      | `engineer`                 |

Every route runs behind the session middleware and resolves the workspace first, so a caller
with no workspace answers 404. The minimum role is what the service method passes to the project
access gate (`docs/authorization.md`). A write aimed at a protected environment answers 409
`approval_required` instead of writing; `docs/change-requests.md` owns what follows.

## Variations

A variation is one value the flag can serve. Variations are rows in `flag_variations` keyed by
`flag_id`, so they belong to the flag and therefore to its environment, with a `key` unique
within the flag (`flag_variation_flag_key_idx`), a `name`, a `value` (`jsonb`, its legal shapes
decided by the flag's `type`), a nullable `description`, and a `priority`. Creation inserts
exactly two: `on` at priority 0 and `off` at priority 1, named "On" and "Off". The wire variation
is `{ key, name, value, description }`: priority is not on the wire, but reads are ordered by it,
and a configuration publish replaces the whole set with `priority` taken from the array index.

`offVariation` and `defaultVariation` name variation keys of this flag in this environment. A
publish refuses a key that is not among the submitted variations, and a rule's `variation` and a
target's `variationKey` are checked against the flag's variations the same way.

## Targeting rules

Rules live in `targeting_rules` keyed by `flag_id`, their conditions in `targeting_conditions`
keyed by `rule_id`. A rule has `priority`, an optional `description`, the `variation_key` it
serves, `segment_keys` (a text array), `rollout_percentage` and `bucket_by`; a condition has
`attribute`, `attribute_type`, `operator`, `values` (a `jsonb` array) and `priority`. Rules are
ordered by priority and the conditions inside one rule are AND-ed. A rule may reference segments
by key, and a publish refuses a key that is not a segment of the project; how a segment then
contributes to matching is `docs/evaluation.md`.

A rule may carry its own rollout, `rollout.percentage` (0–100) and `rollout.bucketBy`, which
gates the rule itself: it applies only when the subject's bucket is below the percentage, so 0
means the rule never applies and 100 means it always does. The rule's `bucketBy` overrides the
flag's for that check and falls back to the flag's when the rule carries none. A rule that
stored no bucketing attribute reads back as `bucketBy: "userId"`, and one published without a
rollout reads back as `rollout: null`.

`GET FLAG/rules` returns the rules in priority order with their conditions. `PUT FLAG/rules`
replaces the whole set: the existing rules and conditions are deleted and the submitted array is
inserted in order, with priority as the array index and each condition's priority as its index
in the rule. The publish is refused for an unknown variation or an unknown segment.

## Individual targets

An individual target overrides one user in one environment: rows in `flag_individual_targets`
with `flag_id`, `user_id` and `variation_key`, unique per `(flag_id, user_id)`. The service
checks that `variationKey` names a variation of the flag but does not reject duplicate `userId`
values itself — the unique index is the only guard. `GET FLAG/targets` returns
`[{ userId, variationKey }]`, and `PUT FLAG/targets` replaces the whole set. The evaluation
engine looks for a target whose `userId` equals the subject id after the archived and disabled
checks and before any targeting rule, reporting the reason `targeting_rule` when it serves one;
the full order is `docs/evaluation.md`.

## Percentage rollout at the flag level

`rolloutPercentage` is an integer 0–100 and `bucketBy` names the subject attribute to bucket on,
falling back to the subject id when that attribute is absent. When the percentage is strictly
between 0 and 100 the engine buckets the subject and serves the default variation below the
threshold and the off variation at or above it, with the reason `percentage_rollout`. At 100 and
at 0 that branch is skipped and the default variation is served with the reason
`default_variation`. The hash is defined in `docs/evaluation.md`; the consequence of the 0 case
is recorded in `docs/architecture.md §5`.

## Promotion

`POST FLAG/promote` takes `{ "to": "<environment key>" }` and copies the flag whole into that
environment of the same project, answering 201 with the new flag read in the target. The copy
carries identity, configuration, every variation with its priority, every targeting rule with
its conditions and rollout, and every individual target. All ids are new, and the two flags are
independent from that moment: promotion is how a change reaches production, not a link between
environments.

It is refused when the target is the source environment (400 `invalid_request`), the target
environment is archived (409 `conflict`), the target environment is protected (409
`approval_required`), or a flag with that key already exists in the target (409 `conflict`). The
source flag's status is not checked, so an archived flag is copied as archived. Promotion writes
the audit action `flag.promoted` with `environmentId` set to the target, the new flag id as
`target` and `changes` of `{ key, from, to }`, and version 1 described as
`Promoted from <source environment name>`.

## Versions and history

`flag_versions` records `project_id`, `flag_id`, `version`, `description`, `author`, `snapshot`
(`jsonb`) and `created_at`, unique per `(flag_id, version)`, with `nextVersion` one past the
highest version the flag already has.

| Event                   | Description in the row                              | Snapshot                                |
| ----------------------- | --------------------------------------------------- | --------------------------------------- |
| Flag created            | `Flag created`                                      | environment, key, type, tags            |
| Configuration published | `Configuration published to <environment name>`      | environment, enabled, serve, variations |
| Rules published         | `Targeting rules published to <environment name>`    | environment, rules                      |
| Targets published       | `Individual targets published to <environment name>` | environment, targets                    |
| Flag copied             | `Promoted from <name>` or `Copied from <name>`       | environment, key, type                  |

An identity update and an archive write an audit row but no version row.
`GET FLAG/versions?limit&cursor` returns `{ data, nextCursor }`, newest first, with the cursor being
the last version number of the page. Each entry is `{ version, description, author, serve,
createdAt }`, where `author` is a user id and `serve` is the default variation the publish
served, read out of the snapshot; it is null for versions whose snapshot recorded none, which is
every create and copy row.

## Dependencies

`flag_dependencies` holds one row per edge, scoped to the project rather than an environment:
`project_id`, `key`, `requires`, an optional `referenced_in`, unique per
`(project_id, key, requires)`. `requires` is meant to be evaluated before `key`.
`GET FLAG/dependencies` reads the rows where the flag is either side of the edge and returns a
`FlagDependencyGraph` of `upstream` and `downstream` key arrays, a `summary` of `{ upstream,
downstream, circular, maxDepth }`, and an `evaluationOrder` of `{ key, status, isSelf }` nodes
with the flag marked `isSelf`. Node status is resolved by key across the whole project, so a key
used in several environments collapses to whichever row the query returned last.

Nothing in the API writes a `flag_dependencies` row: outside the test suite there is no insert,
no route and no service path that creates one, so the graph is empty unless rows exist.
Evaluation does not read the table at all — a dependency is not enforced when a variation is
decided, so a flag that is switched off has no effect on the flag that requires it.

## Archiving

`DELETE FLAG` is the only delete-like operation. It sets `status` to `archived` and `updated_at`,
returns `{ key, status: "archived" }`, and writes the audit action `flag.archived` with `changes`
of `{ status: "archived", environment }`. Everything stays: the row, its variations, rules,
targets and versions all remain and no cascade delete runs. An archived flag evaluates as the off
variation with the reason `flag_archived` (`docs/evaluation.md`). Archived flags appear in list
responses unless the caller filters by `status`, nothing refuses a write to an archived flag, and
a second archive behaves exactly like the first. There is no hard delete: no route or repository
method removes a flag row.

## Creating an environment from a copy source

Creating an environment can populate it from another one. The request carries
`initialFlagStatus`, either `all-off` — the default, leaving the new environment with no flags —
or `copy-source`, where `copyFrom` names the source and is required; `all-off` refuses a
`copyFrom`. The route belongs to the environments module.

The copy runs inside the same transaction that inserts the environment, through the copy
primitive the flags service exposes to the environments module, so an environment is never
half-populated. Every flag of the source is copied whole, each copy getting version 1 described
as `Copied from <source environment name>`. The copied flags have no audit rows of their own:
`environment.created` records the copy once, with `changes` of `{ key, name, initialFlagStatus,
copyFrom, copiedFlags }`, project-level and naming no environment. A source that does not exist
fails before anything is written.

## Condition operators

A condition stores its `operator` as free text beside its `attribute` and `values`. The set the
dashboard offers is `equals`, `not_equals`, `contains`, `not_contains`, `in`, `not_in`,
`greater_than`, `greater_than_or_equal`, `less_than`, `less_than_or_equal` and
`matches_regex`; anything outside it matches nothing.

How an operator decides a match — string coercion, what a missing attribute does, and how an
invalid pattern is handled — is engine behaviour and lives in `docs/evaluation.md`.

## Status

**Exists.** The fifteen routes above; the `flags`, `flag_variations`, `targeting_rules`,
`targeting_conditions`, `flag_individual_targets`, `flag_versions` and `flag_dependencies`
tables; create, canonical and workspace-wide read, identity update, configuration publish, rule
and target replacement, promotion, versions, archiving and the resolve endpoint. Protected
environments refuse a direct write with 409 `approval_required`.

**Partial.** Flag dependencies: the table and the read endpoint exist, but nothing in the API
writes a row and evaluation never reads the table. The dashboard's archive control is rendered
disabled as a placeholder while `DELETE FLAG` works. A rule that carries a percentage but no
stored bucketing attribute reads back as bucketing by `userId` while evaluation falls back to the
flag's `bucketBy`. Archived flags remain writable, and the dependency graph resolves node status
by project-wide key.

**Not built.** Hard delete — archiving is the only delete-like operation. Dependency enforcement
at evaluation time. Any flag configuration cache: reads reach PostgreSQL on every request
(`docs/architecture.md §8.1`).

## Where it lives

- `apps/api/src/modules/flags/flags.routes.ts` — the route table and its mounting.
- `apps/api/src/modules/flags/flags.controller.ts` — request validation, actor context, status codes.
- `apps/api/src/modules/flags/flags.service.ts` — roles, promotion, versions, audit and environment copies.
- `apps/api/src/modules/flags/flags.repository.ts` — queries and the one copy primitive.
- `apps/api/src/modules/flags/flags.dependencies.ts` — dependency graph assembly.
- `apps/api/src/modules/flags/flags.mapper.ts` — wire shapes for list, detail, rules, targets and versions.
- `apps/api/src/modules/flags/flags.types.ts` — module types, including `FlagRow`.
- `packages/contracts/src/flag.ts` — the flag wire contract, type check and default values.
- `packages/contracts/src/environment.ts` — the copy-source input for environment creation.
- `packages/contracts/src/audit-log.ts` — the audit action vocabulary.
- `apps/api/src/db/schema/flags.ts` — the `flags` table and its unique key index.
- `apps/api/src/db/schema/flag-variations.ts` — the `flag_variations` table.
- `apps/api/src/db/schema/targeting-rules.ts` — the `targeting_rules` table.
- `apps/api/src/db/schema/targeting-conditions.ts` — the `targeting_conditions` table.
- `apps/api/src/db/schema/flag-individual-targets.ts` — the `flag_individual_targets` table.
- `apps/api/src/db/schema/flag-versions.ts` — the `flag_versions` table.
- `apps/api/src/db/schema/flag-dependencies.ts` — the `flag_dependencies` table.
- `apps/api/src/modules/evaluation/evaluation.engine.ts` — the operator matching this section defers to.
- `apps/api/src/modules/environments/environments.service.ts` — environment creation and the copy transaction.
- `apps/web/components/app/flags/create-flag-form.tsx` — the create flow.
- `apps/web/components/app/flags/flag-configuration.tsx` — the configuration tab.
- `apps/web/components/app/flags/variation-value-input.tsx` — the value control chosen by flag type.
