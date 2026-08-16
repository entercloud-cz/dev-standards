---
name: azure-deploy
description: Design and operate an application's Azure deployment — the Bicep infrastructure code, the GitHub Actions workflows for infrastructure and application, and the discipline that keeps a deploy trustworthy. Use when setting up deployment for a new application, creating or changing infrastructure code, adding an Azure resource, writing or editing a deployment workflow, or handling deployment secrets.
paths:
  - "**/*.bicep"
  - "**/*.bicepparam"
  - ".github/workflows/**"
---

# Azure deployment

A deployment is trustworthy when a **new** stamp comes up in one pass, when re-running
changes nothing it should not, and when the two pipelines (infrastructure and
application) cannot undo each other's work. Every rule below exists because its violation
produces the opposite: a deploy that only works the second time, a running application
reset to the template's placeholder, a secret silently regenerated so the app and the
secret store disagree.

**This skill describes the discipline, not one project's setup.** The workload name, the
module list, resource sizing, secret names, cron schedules and environment names are the
PROJECT's — read them from its infrastructure code, parameters file and agent file
(`CLAUDE.md`, `AGENTS.md` or equivalent). Where operations documentation lives is
`docs-flow`'s how-to role; this skill says what the deployment machinery must look like,
not where it is written up.

## The stamp

A **stamp** is one deployable unit of the application: one environment in one region,
deployed from one entry-point template with one parameters file. Everything below scales
by stamp: a new environment or a new region is the same template deployed again with a
different environment name or location — never a copied-and-edited variant of the
infrastructure code. If something cannot be expressed as "the same stamp, different
parameters", it is a design change and starts as a decision record (see `app-design`).

## Layering the infrastructure code

Four tiers, each with one job:

1. **Foundation pre-pass** (subscription scope) — *only* what later tiers depend on to
   receive secrets and roles: typically the resource group, a runtime identity and a
   secret store where the stamp has them, plus the role assignments for the deploying
   principal and the runtime identity. It exists so the main deployment never touches a
   secret store that is not yet writable; a stamp with no such dependency skips it.
2. **Entry point** (subscription scope) — resource groups, the full parameter surface,
   and delegation to the wiring tier. Its header states what a stamp is and how to add
   one.
3. **Wiring** (resource-group scope) — the derived-names map, module instantiation in
   dependency order (where a shared runtime identity exists it comes first, because
   everything else grants roles to it), and the shared runtime environment/secret
   blocks. Section banners state the ordering reason.
4. **Modules** — **one resource concern per file.** A module that provisions two
   unrelated resources will be reused for neither.

Two rules keep the layering honest:

- **One pass, always.** The entry point re-declares the foundation's resources with the
  same names and properties; an identical, **complete** re-declaration converges to the
  same state — an incomplete one resets what it omits — so the two declarations must be
  kept in exact sync, and a drifted name silently creates a second secret store or
  identity. A design where permissions or secrets land only in a second run is rejected
  outright: a deployment that only works the second time is a deployment nobody can
  trust on a new stamp.
- **Placeholder images.** Compute that runs application images references a public
  placeholder in the template, so infrastructure deploys before any application image
  exists. The pipeline is what pins real images (below).

**Naming:** derive every resource name in one map in the wiring tier — a type prefix
(CAF style), a `<workload>-<environment>` core, a `uniqueString`-derived token where
global uniqueness is required, `take()` where a length limit applies. Nothing outside
that map invents a name. Tags are one default set (`workload`, `environment`,
`managedBy`, cost attribution) unioned with caller tags — duplicated verbatim into the
foundation so tags do not churn between the two passes.

**Optional capabilities** (a CDN/front door, a cache tier, alerting) sit behind boolean
parameters, off by default where they cost money, with the enabling trigger documented in
the parameter description — the same trigger discipline decision records use.

**Incremental deployment never deletes.** A converge-only mode applies what the template
declares and leaves everything else running, so removing a resource from the template does
not remove it from the stamp — and *renaming* one creates the new while the old keeps
running. Two consequences worth writing down: a retired resource is **pruned deliberately**,
not merely undeclared (an abandoned one keeps costing money; a renamed worker means two
workers on one queue). And a prune step must be idempotent and **refuse on an unreadable
read** rather than treating "I could not tell" as "already gone".

## Two pipelines, two owners

Infrastructure and application deploy through **separate workflows with disjoint
ownership**, and each preserves what the other owns:

- **The infra workflow owns declarative state** — resources, configuration, secret
  references. It must never change an application image: before deploying, it reads the
  **live** image off each compute resource and pins it into the parameters (precedence:
  live value → explicitly pinned variable → template placeholder). Without this, every
  infra deploy resets running applications to the placeholder.
- **The app workflow owns images and rollout.** It builds and pushes images, updates
  compute to the new tags, and rolls the background workers that share the image. It
  must never run the infrastructure deployment.

The pin-the-live-value pattern generalizes twice over: a field **the other pipeline
mutates** (an image tag) must be read live and re-asserted, or the pipelines fight and
the loser is whoever deployed last — and a value **the platform generated on first
deploy** (an endpoint name whose replacement would strand DNS) must be pinned live before
any deploy that would otherwise replace the resource by renaming it.

## Workflow discipline

- **Manual dispatch only.** Deployments are applied deliberately by a person; there is
  no push/schedule trigger. The infra workflow takes a mode input: **`what-if`**
  (preview, writes nothing — including secrets) and **`deploy`**. Run what-if before the
  first deploy of any change.
- **One concurrency group per environment, shared by both workflows**, without
  cancellation — an infra deploy must not race an application roll on the same stamp.
- **GitHub Environments are the gate.** The job's `environment:` is the input
  environment name; production carries required reviewers. Per-environment values live
  in the Environment's variables and secrets, not in the workflow.
- **Authenticate with OIDC federated credentials by default** — `id-token: write`, no
  long-lived client secret in the repository. A service-principal secret is the
  fallback for constraints that rule OIDC out, and it is recorded as debt with a
  tracked item, not as the design. Once an identity has no secret, never give it one back.
  A new environment's federated **subject is read from the run, never constructed**: the
  subject format has changed over time and the API can report the old form while the
  platform issues the new one. Dispatch in preview mode, let the login fail, copy the
  subject it printed. One credential per environment — a wildcard subject is not a
  shortcut, it is a highly privileged identity handed to every environment at once.
- **Pin live values before redeploying.** Read what is currently deployed — the image, the
  generated name, the endpoint — and pass it in, or a redeploy resets a running resource to
  the template's placeholder. A live value outranks a configured variable, which outranks a
  derived default.
- **Read `what-if` literally.** It normalises some values, so a stamp exactly in sync can
  report a modification permanently; and it does not evaluate nested deployments, so much of
  a layered template shows as "ignore". Record which lines are permanent noise in the
  workflow header, and **never build a decision on "the diff was empty"** — that reads the
  same whether nothing changed or nothing was evaluated.
- **The workflow header documents its own configuration**: every required and optional
  Variable and Secret, what each gates, and where it is set. The header is the one
  authoritative list — the how-to document points at it instead of repeating it
  (`docs-flow`: never state the same fact in two documents). A preflight step checks
  presence (never values) and fails with the exact settings path to fix — a missing
  variable should cost seconds, not a failed half-deploy.
- **Log the effective state**: echo the resolved non-secret parameters before deploying,
  mask everything secret as soon as it is assembled, and write deployment outputs to the
  step summary so the run is auditable without re-running it.
- **A parent must never wait in its own child's concurrency group.** When one workflow
  calls another, a callee asking for the group its caller already holds queues behind the
  run that is waiting for it. The result is a deploy that never finishes and never errors —
  so scope the lock per environment when dispatched directly, and per run when called.
- **Read the live state before dispatching.** Two people deploy the same environments; your
  checkout does not know what is on one. What is already there is a fact to fetch, not to
  infer from the branch you happen to be on.
- **An escape hatch is recorded, not absent.** A rule with no way around it gets bypassed by
  hand the first time it is inconvenient, and then it is not a rule. Give the bypass a
  named input, and make it print who used it and why into the run summary.

### Required checks — require few, and make those reachable

Branch protection is where teams accidentally build the pedantry they later resent. Two
mechanics decide everything, and they are easy to get backwards:

- **Only a check that reports on every pull request may be required.** A job skipped by an
  `if:` condition reports **success** and satisfies the requirement. A whole workflow
  skipped by a `paths:` or branch filter reports **nothing**, so the check stays pending and
  the pull request is blocked with "Waiting for status to be reported" — for ever. Skip at
  job level; never gate a required workflow with a path filter. (GitHub documents both
  behaviours under *Troubleshooting required status checks*, read 2026-08-16.)
- **A matrix job is a poor required check.** Its contexts are named per cell, so the name a
  ruleset must require is one of the expanded names — and a matrix job that is skipped does
  not expand, so those names never appear. Put a small non-matrix job after the matrix and
  require that instead. (Observed in a consumer on two pull requests the same day, not
  something GitHub documents.)

The same trap catches trigger narrowing: reducing the events a workflow listens to is a good
way to stop wasting runs, and a good way to make a required check unreachable. Check what
the ruleset actually requires before narrowing anything.

Every gate also needs `workflow_dispatch`. A check only a webhook can start is unreachable
exactly when webhooks are throttled, which is when people merge anyway.

## Secrets — two opposite flows, both fail-closed

Decide, per secret, which side is authoritative, and never blur the two:

- **Self-managed secrets** (session keys, internal API keys): **the vault is the source
  of truth.** The pipeline generates a value only on an explicit *not-found* from the
  vault; a read error is a failed run, never a regeneration — "the read failed" is not
  "the secret is absent", and regenerating on a transient error deploys an application
  with a key the vault does not hold. Retry reads against role-assignment propagation
  before concluding anything. In what-if mode, use throwaway values and write nothing.
- **Externally issued secrets** (an identity provider's client secret, a third-party API
  key): **the issuing platform's copy is the source of truth** — stored as a GitHub
  Secret, synced *into* the vault before the deployment that references it. Fail fast
  when the reference is configured but no secret exists anywhere.

Never rotate a secret that encrypts data at rest as if it were a session key — losing it
means losing the data. Mark such secrets in the vault and in the how-to document.

## What IaC cannot do — post-deploy, in the same run

Data-plane configuration is not expressible in ARM and must follow the deployment as
idempotent, guarded steps in the same workflow:

- **Database principals and schema.** Grant the runtime identity access with idempotent
  statements. **Bootstrap is not migration**: apply full schema only when a probe object
  is absent (an empty database); an existing database gets nothing implicit — schema
  changes go through the project's migration mechanism as their own deliberate step.
  Validate every interpolated identifier, and retry around transient unavailability (a
  serverless tier resuming from pause, role assignments still propagating).
- **Temporary network openings** (a firewall rule for the runner) are removed by a
  cleanup that runs even on failure (`trap … EXIT` or the platform's equivalent).
- **DNS convergence, not DNS assertion.** Re-target only records that point at the
  previous generation of the same infrastructure; warn and stop on records a human
  manages. Read validation tokens live from the resource — a token captured as a
  deployment output goes stale when it rotates.

## Application rollout

Whatever the artifact shape (images, a zip package, static files — the runtime shape is
the project's decision, see `app-design`):

- **Version what you deploy**: tag the artifact with the git SHA (plus a moving tag if
  the platform wants one), and stamp commit and build time into a health endpoint — so
  "what is deployed" is a question the running system answers.
- **Roll every workload that runs the same artifact** — background jobs and workers
  update in the same run as the main application, or they run yesterday's code against
  today's schema.
- Where the artifact is a container image, prefer building **in the registry** (cloud
  build) over the runner: the runner then needs no engine and no registry credentials,
  and the image never crosses the network twice.
- **Capture-and-re-assert around lossy tooling.** When a CLI or API round-trip is known
  to drop a field (verify against the current API version before assuming it still
  does), read the full object before the update and re-assert the dropped part
  immediately after, with a comment naming the defect and the version where it was
  observed. Pin API versions where a stable version silently loses data.

## Definition of done for a deployment change

1. `what-if` ran against a real stamp and its diff matches the intent — nothing
   unexpected replaced or deleted.
2. A new stamp still comes up in **one pass** — or the change names why provisioning
   order is untouched.
3. Neither pipeline can undo the other's work: live-pinned values still pinned,
   ownership split intact.
4. Secrets follow their declared flow; nothing regenerates on a read error.
5. Post-deploy steps are idempotent — the workflow can re-run without side effects.
6. The how-to document (per `docs-flow`) reflects any new maintainer step; the workflow
   header stays the one authoritative list of its variables and secrets; incident-derived
   rules go to the scoped agent rules, not the how-to.
