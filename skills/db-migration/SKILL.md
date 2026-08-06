---
name: db-migration
description: Discipline for changing a database schema that already holds data — migrations that are guarded and re-runnable, sequencing changes the running application must survive (expand/contract), data backfills, and proving the isolation seams still hold. Use when adding or changing tables, columns, indexes or constraints, when writing or running a migration, when backfilling data, or when schema and the code that reads it must change together.
paths:
  - "**/*.sql"
  - "**/migrations/**"
  - "**/db/migrate/**"
  - "**/Migrations/**"
---

# Database migration

A schema change is the one change a redeploy cannot undo: the moment data exists in the
new shape, "roll back" means another migration, written under pressure. Everything below
exists so that a migration can crash halfway and be re-run, so that the application keeps
working while the schema is mid-change, and so that an isolation boundary does not
quietly stop existing because a new table forgot it.

**This skill describes the discipline, not one project's setup.** Where migrations live,
how they run (a framework, a script, by hand) and the database's dialect are the
PROJECT's — read them from its agent file and how-to document. If the project has no
migration mechanism, say so and propose one suited to its runtime rather than inventing
files (`docs-flow`).

**Bootstrap is not migration.** Applying the full schema to an *empty* database is the
deployment pipeline's job, probe-guarded, and is covered by the `azure-deploy` skill.
This skill governs the database that already exists.

## One migration per change

- **Every migration is traceable to exactly one tracked item** — an item may own several
  ordered migrations (an expand and its later contract) — and named so order is
  unambiguous: a timestamp or sequence prefix plus the item's slug, the same way a
  branch is named.
- **A shipped migration is never edited.** Any environment that has executed it —
  staging, CI, a teammate's copy — will never re-run it; editing **or renumbering** it
  rewrites a history they already recorded. The same rule decision records follow: a
  wrong migration is corrected by the *next* one.
- New migrations only append. When two changes race on a sequence number, the one that
  has not yet run anywhere it cannot re-run takes the new number — timestamp prefixes do
  not collide, which is a reason to prefer them.

## Guarded and re-runnable

The runner can crash after statement three of five and will be run again — so
**re-running the mechanism must be a no-op**, whichever way the project achieves it:

- A runner with a **ledger** it honours (a migrations table, checksums) already
  guarantees the no-op — respect the ledger, and never apply a recorded migration by
  hand around it.
- Where migrations run **without a ledger**, every statement is guarded:
  create-if-absent, add-column-if-missing, a probe against the catalog before anything
  the dialect cannot guard inline. "It will only run once" is the assumption that breaks
  on the second environment.
- **The no-op is testable, so test it**: run the mechanism twice against a copy of real
  data — the second run must change nothing. That is also the evidence `issue-flow` asks
  for when the item closes.
- Use a transaction where the platform honours one for DDL; where it does not, order the
  statements so an interruption leaves a state the guards can see — never a half-renamed
  pair the probe mistakes for done.

## Changes the running application must survive

Code and schema never change atomically: there is always a window where old code runs on
the new schema, or new code on the old one. Pick which window it is, and make that the
safe one — **expand, migrate, contract**:

1. **Expand** — add the new shape alongside the old: a nullable column, a new table, a
   view that serves both. Old code keeps working untouched.
2. **Migrate the code** — deploy code that writes the new shape and tolerates the old.
   Where both shapes are written for a while, say so in the item.
3. **Contract** — drop the old shape in its **own, later migration**, only when there is
   evidence nothing reads it (a query log, a count, a code search — name it).

A rename or type change is always expand + contract wearing a disguise; done in place it
breaks whichever side of the deploy window you did not pick.

## Data backfills are their own step

Converting existing rows is not fused into the schema migration that enables it:

- **Batched and resumable** — keyed on what is already converted, so a crash resumes
  instead of restarting, and throttled so the live application is not starved of the
  database.
- **Verified by count** before any contract step: rows expected, rows converted, rows
  that could not convert (and why). A backfill without its counts is a hope.

## Isolation seams survive every migration

Where the schema carries an isolation boundary — a tenancy column, row-level security
policies, role grants — a migration is not done when the objects exist:

- **A new table without the seam is a leak, not an omission.** The boundary is part of
  the definition of every new object, not a hardening pass for later.
- Keep the seam's definition **idempotent and re-applicable** (policies, grants), re-run
  it after schema changes, and **verify from the least-privileged role**: a probe that
  proves the boundary holds is worth more than the DDL that declares it.

## Evidence when the item closes (per `issue-flow`)

1. The migration mechanism ran **twice** against a copy of real data (or a
   non-production environment), and the second run changed nothing.
2. The unsafe side of the deploy window is named, and the chosen order (migrate-first or
   deploy-first) is safe for it.
3. Backfill counts are recorded: expected, converted, failed.
4. Where the project declares an isolation seam: probes pass from the least-privileged
   role. ("No seam" is a valid answer — say it.)
5. The how-to document carries the exact run command; anything else the change taught
   routes per `docs-flow`.
