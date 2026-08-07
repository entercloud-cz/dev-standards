---
name: db-migration
description: Discipline for changing a database schema that already holds data — migrations that are guarded and re-runnable, sequencing changes the running application must survive (expand/contract), data backfills, and proving the isolation seams still hold. Covers both the operated mode (the org runs the migration against its own database) and the shipped mode (a versioned artifact upgrading a customer-operated database). Use when adding or changing tables, columns, indexes or constraints, when writing or running a migration, when backfilling data, when schema and the code that reads it must change together, or when packaging an application whose upgrade must carry schema changes to a database the org does not operate.
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
deployment pipeline's job, probe-guarded, and is covered by the `azure-deploy` skill —
in the operated mode; the shipped mode bootstraps through its own mechanism (see the
upgrade contract). This skill governs the database that already exists.

## Who runs the migration — two modes

Declare in the project's agent file, per deployable, which mode it is in. The discipline
differs because the failure modes do:

- **Operated** — the database is the org's, and the org (a pipeline, a maintainer) runs
  the mechanism. Everything in this skill applies as written.
- **Shipped** — the application leaves as a versioned artifact (a container on a
  registry) and the database belongs to the customer. Nobody from the org is present at
  upgrade time: no one to hand-run SQL, no copy of the customer's data, no ops channel
  to repair a half-applied upgrade. Everything in this skill still applies, **plus the
  upgrade contract below**.

### The shipped-mode upgrade contract

- **The artifact carries its migrations and its mechanism, and a ledger is mandatory**
  (it overrides the ledger-or-guards choice below). The ledger records what ran **and
  the compatibility floor** — the oldest release still able to run on this schema,
  raised only by compatibility-breaking migrations (contracts). On an **empty database**
  the same mechanism bootstraps: every migration from zero, through the same ledger —
  shipped mode has no pipeline-owned bootstrap.
- **Startup begins with a version handshake.** Schema older than the artifact needs —
  refuse to serve and name the missing upgrade step (on first install: the bootstrap
  above). Artifact older than the schema's **compatibility floor** — refuse as loudly:
  it was rolled back past the supported window. Ledger entries newer than the artifact
  but at or above the floor are the supported rollback window — serve. An artifact that
  refuses with a precise message is a support ticket; one that guesses is data
  corruption.
- **Migration is an explicit step, never an unconditional boot side effect.** Ship a
  dedicated way to run it (a subcommand, a separate entry point, an operator-run job) so
  the operator or their orchestration applies it deliberately; auto-apply at startup
  only behind an explicit opt-in the operator sets. Before applying, the mechanism
  prints its plan — which migrations will run — and can be told to stop there. The
  migrate step enforces the upgrade matrix as well, refusing an unsupported starting
  version — running it before first boot must not bypass the handshake.
- **The operator's backup is the only rollback of data.** There are no down migrations:
  rolling back the *artifact* is supported down to the compatibility floor; rolling
  back the *schema* is a restore. The migrate step says so, and verifies — or at least
  warns — about backup before touching anything.
- **Rollback support means backward compatibility; forward is gated, not compatible.**
  Forward: new code refuses to serve until the migrate step runs (the handshake).
  Backward: every schema change tolerates the code of every release at or above the
  floor, so the operator can roll the artifact back without touching the database. The
  window rule follows: a contract ships **no sooner than one release after the last
  release whose code touches the old shape** (its expand at the earliest), raises the
  floor, and probes that the expand whose old shape it removes actually ran here.
- **Customers skip versions — test the jumps, and enforce them.** State the supported
  upgrade matrix (strictly sequential? any-to-latest?) and test every supported starting
  version against the current migrations. Where this skill says "a copy of real data",
  shipped mode substitutes **a representative dataset the project maintains at realistic
  scale** — the closest thing to customer data the org will ever have.
- **Release notes** — a release artifact, not one of `docs-flow`'s documents — **state
  the migration's cost**: whether this release migrates, the expected duration and
  locking, and the backup it expects. A surprise long table rewrite in the middle of a
  customer's upgrade is how trust ends.

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

- A runner with a **ledger** it honours (a migrations table, checksums) guarantees that
  *recorded* migrations never re-run — respect it, and never apply a recorded migration
  by hand around it. The ledger does **not** cover a crash *inside* a migration: where
  DDL is not transactional, the run dies half-applied and unrecorded, and the re-run
  replays the applied half — so each migration must still be internally re-runnable
  (transactional where the platform allows it, guarded statements where it does not).
- Where migrations run **without a ledger** (operated mode only — shipped mode mandates
  a ledger, see the upgrade contract), every statement is guarded: create-if-absent,
  add-column-if-missing, a probe against the catalog before anything the dialect cannot
  guard inline. "It will only run once" is the assumption that breaks on the second
  environment.
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
5. Shipped mode only, in CI and at latest by the release that ships the migration: the
   handshake refused a too-old schema and an artifact below the compatibility floor; a
   **previous-release artifact served correctly against the migrated schema**; and the
   upgrade matrix ran — every supported starting version reached the current schema on
   the representative dataset.
6. The how-to document carries the exact run command; anything else the change taught
   routes per `docs-flow`.
