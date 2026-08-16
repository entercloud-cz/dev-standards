# CLAUDE.md — {{PROJECT}}

_TODO: one paragraph — what this product is and who uses it. The `app-design` skill
produces it; until then this placeholder stays._

## Skills

The `.claude/skills/` directory is **vendored** from `entercloud-cz/dev-standards`. Never
edit those files here — send the change upstream and run
`npx github:entercloud-cz/dev-standards update`; CI (`dev-standards.yml`) fails on drift.

**Two are the working agreement. Invoke them, don't improvise:**

- `issue-flow` — at the START of any request that will change the repository, and when
  finishing a piece of work.
- `docs-flow` — before writing into any project document.

**The rest are help, offered — not rules.** Reach for one when its subject is what you are
actually doing, or when asked. None of them is a gate, and none needs a reason to be
skipped:

- `app-design` — designing an application or module, or writing a decision record.
- `design-brief` — no visual direction is recorded yet, and someone has to choose one.
- `frontend-design` — building UI inside a direction that is already chosen.
- `native-first` — the project builds on a template, framework or module set somebody else
  ships.
- `webapp-testing` · `browser-check` — a change wants a live check as its closing evidence.
- `azure-deploy` — infrastructure code or a deployment workflow.
- `db-migration` — changing a schema that already holds data.
- `agent-harness` — configuring Claude Code itself: hooks, `skillOverrides`, settings.

A skill that keeps volunteering where this project has already decided the question can be
muted — `skillOverrides` in `.claude/settings.json`, and `agent-harness` says which value to
use. Record WHY next to the mute; a silent mute reads as an accident.

**Where a skill and this project disagree, the project wins and the difference is
deliberate.** Read a skill for what has not been decided here yet, not to reopen what has.

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
  single lane and the tracker is its work document (issue-flow allows both)._ A lane is
  either `"lane": "username"` or `"lane": { "owner": "…", "contributors": ["…"] }`;
  contributors are a note of who works there, never a second assignee.
- Priorities: `P0`/`P1`/`P2` (override in `issueFlow.labels.priorities` if this project
  names them differently).

## Invariants (violating any of these has caused real incidents)

_Empty on purpose. A line is added only when forgetting it would cause a real incident —
see `docs-flow` → "Earning a place in the always-in-context file"._

## Working agreement

- Language: _TODO — the language of the conversation and the language of the artifacts are
  two separate choices. State both (e.g. "reply in X; code, comments, commits and docs stay
  in English")._
- Verify locally before claiming done; close items with evidence (`issue-flow`).
- _TODO once a build/test loop exists: list the exact commands here (build, test, lint,
  run) — the most valuable lines this file can carry; without them an agent spends steps
  rediscovering the loop every session._
- Commit and push only when asked.
