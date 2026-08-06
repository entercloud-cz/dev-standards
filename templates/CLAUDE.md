# CLAUDE.md — {{PROJECT}}

_TODO: one paragraph — what this product is and who uses it. The `app-design` skill
produces it; until then this placeholder stays._

## Mandatory skills — invoke them, don't improvise

The `.claude/skills/` directory is **vendored** from `entercloud-cz/dev-standards`. Never
edit those files here — send the change upstream and run
`npx github:entercloud-cz/dev-standards update`; CI (`standards.yml`) fails on drift.
Mute a skill this project genuinely cannot use via `skillOverrides` in
`.claude/settings.json`.

- `issue-flow` — at the START of any request that will change the repository, and when
  finishing a piece of work.
- `docs-flow` — before writing into any project document.
- `app-design` — when designing the application or a module, or writing a decision record.
- `frontend-design` — when creating or reshaping UI, before the first line of markup.
- `webapp-testing` — when a UI change needs a live check as its closing evidence.
- `azure-deploy` — before touching infrastructure code or a deployment workflow.
- `db-migration` — before changing a database schema that already holds data.

## Documentation map — exactly these files (`docs-flow` roles)

| Role | File |
|---|---|
| Product explanation | `docs/APPLICATION.md` _(created by the design flow)_ |
| System explanation | `docs/ARCHITECTURE.md` _(created by the design flow)_ |
| Decision records | `docs/decisions/` |
| Planned work | `docs/BACKLOG.md` |
| How-to / operations | _TODO when infrastructure exists (e.g. `infra/README.md`)_ |
| Agent rules | this file |

## Issue conventions

- Tracker: _TODO `owner/repo`_ — the same value belongs in `.dev-standards.json` →
  `issueFlow.repo`.
- Lanes and owners: _TODO — fill `issueFlow.owners`, or state here that the project has a
  single lane and the tracker is its work document (issue-flow allows both)._
- Priorities: `P0`/`P1`/`P2` (override in `issueFlow.labels.priorities` if this project
  names them differently).

## Invariants (violating any of these has caused real incidents)

_Empty on purpose. A line is added only when forgetting it would cause a real incident —
see `docs-flow` → "Earning a place in the always-in-context file"._

## Working agreement

- Verify locally before claiming done; close items with evidence (`issue-flow`).
- Commit and push only when asked.
