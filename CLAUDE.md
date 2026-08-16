# CLAUDE.md — working in dev-standards

This repo publishes the **reusable** parts of the org's working agreement: a set of Claude
Code skills and the issue tooling they describe. Consumers **vendor** copies of it; they do
not reference it live.

[README.md](README.md) covers what a consumer does (install, update, check) and how to cut a
release. This file covers what someone **editing this repo** has to know — read it first, and
don't repeat here what README already says.

## The one rule

**Nothing in `skills/` or `scripts/` may name a project** — no repository slug, no username,
no label name, no file path belonging to one product, no domain vocabulary. Consumers keep
that in `.dev-standards.json` (tooling config) and in their own agent file (ownership map,
label meanings, commands).

The bar for adding anything: **would another product in the org use it unchanged?** A
"shared" file that every consumer edits locally is worse than no shared file — `check` then
fails forever and people learn to ignore a red build.

## Invariants

1. **The vendored payload is declared in `PAYLOAD` in `bin/dev-standards.mjs`**
   (`skills/` → `.claude/skills/`, `scripts/` → `scripts/`). Moving or renaming a payload
   file changes where it lands in every consumer, and the old copy survives there — an
   `update` never deletes. Rename only when you intend every consumer to carry both until
   someone removes one by hand.
2. **`scripts/` is copied as one unit** because `seed-issues.mjs` and
   `sync-backlog-index.mjs` import `./lib/config.mjs` by relative path. Splitting them
   across payload entries breaks that import in the consumer, not here.
3. **`version` in `package.json` is bumped in the same change as the tag.** The CLI reports
   the package version and `install`/`update` writes it into the consumer's
   `.dev-standards.json`, so a mismatch makes a project look pinned to a version that does
   not exist. (Release steps: README → *Changing a shared skill or script*.)
4. **Config is required, never guessed.** `scripts/lib/config.mjs` throws on a missing
   `.dev-standards.json` or a missing `issueFlow.repo`. Defaulting the tracker repo would
   file issues into someone else's project.
5. **Never hard-code a lane, a label or a document path.** Derive lanes from the configured
   owners; take paths from config with a conventional default. This is the invariant that
   already broke once — see below.
6. **`check` must stay offline.** It recomputes hashes against `.dev-standards.json`. It is
   a CI gate, so a network dependency would make an unrelated outage look like drift.
7. **A new kind of shared service is a new top-level directory with its own `PAYLOAD`
   entry** — never a subfolder of an existing payload unit, because relative paths inside
   a unit are what land in every consumer (see invariant 1). Per-service docs wait for a
   trigger: a service that outgrows one file earns its own README, and a directory that
   accumulates dev-only invariants earns a nested `CLAUDE.md` — but everything under a
   payload directory ships to every consumer, so either must land in the same change as a
   payload exclusion for dev files in the CLI. Until then, `SKILL.md` and script headers
   are the service's documentation, and dev invariants live here.
8. **`templates/` is distributed but never vendored.** `init` writes its files into a
   consumer once, only where absent — from then on the consumer OWNS them, so they must
   never enter `PAYLOAD`: a hash-checked starter would make `check` fail the moment the
   project fills in its first TODO. (The `.github`-repo gotcha does not apply — these are
   per-project starting points, not community health files GitHub serves org-wide.)

## Gotchas (learned the hard way, 2026-08-06)

- **Grepping for repository names does not prove a file is generic.** After a clean grep the
  scripts still described lanes as `track/app`/`track/infra`, pointed at `CLAUDE.md` by
  filename, and called the reserve "the P2 reserve" — `P2` is a label a project chooses, not
  a concept. Read the prose, not just the identifiers.
- **The bug a grep would never have found:** `sync-backlog-index.mjs` iterated a hard-coded
  `['infra','app','both']` lane order. A project with different lane names would have
  produced an index that **silently omitted its own issues** — no error, just missing rows.
  Anything that enumerates project vocabulary must derive it.
- **Templates belong in the org `.github` repo, not here.** GitHub distributes community
  health files from `entercloud-cz/.github`; a second copy here would be the copy GitHub
  never reads, which is the one that rots unnoticed.
- **Claude Code has no skill composition.** No `requires` field, and a skill instructing the
  model to invoke another skill is model-discretion, not a contract. **Do not build a "root"
  skill** that dispatches to the others: it adds a hop that can be skipped, the sub-skills
  stay independently invocable anyway, and a mandatory rule still needs a trigger line in the
  consumer's agent file.
- **A skill's reach is controlled by two supported mechanisms**, not by a dispatcher:
  `paths` globs in the frontmatter (surface it only for relevant files — `docs-flow` uses
  this) and `skillOverrides` in a consumer's `.claude/settings.json`
  (`"on"` · `"name-only"` · `"user-invocable-only"` · `"off"`).
- **The payload is the filesystem, not git.** `walk()` in the CLI lists what is on disk, so
  anything that appears under a payload directory ships to every consumer and is hash-checked
  there for ever — including files git ignores. A `__pycache__` produced by *running the
  verification steps* made it into the payload during v1.14.0 and was caught only by diffing
  `list` against the previous tag. Diff it every time; `.gitignore` will not save you.
- **Skills are discovered live** from an existing `.claude/skills/` directory, but creating
  that directory for the first time needs a session restart. Worth saying to a consumer who
  reports "the skill isn't there".

## Decisions already taken

Recorded here rather than as separate records while they are few; when they stop fitting
on one screen, graduate them into `docs/decisions/` in the format the `app-design` skill
carries.

**Vendored copies, not a submodule or a personal clone.** A clone must work with zero setup:
Claude Code discovers skills from files on disk, and any mechanism needing a second command
(`git submodule update`, a per-developer clone) will one day not be run — silently, on
someone else's machine. Copies are also reviewable in a PR and pin a version per repo.
*Rejected:* submodule (detached HEAD, `--recursive`, forgotten updates), personal-level
install (no pin, invisible in the repo, each machine differs), npm registry package (needs a
registry for five markdown and JS files).
*Cost accepted:* copies can be edited locally, which is why `check` exists.

**Updates are deliberate, never automatic.** A skill governs how work is done, so a change
to it should be seen by the person it governs. *Rejected:* a scheduled bot opening update PRs
in every consumer — it would trade a stale skill for PR noise nobody reads.

**Templates live in the org `.github` repo.** See the gotcha above.

**Opt-in capabilities ship as a skill with reference skeletons, never as payload or
templates** (v1.13.0, `browser-check`). The skill carries the discipline plus a
`references/` directory the model instantiates into a consumer **only on invitation**;
the copies are the project's own from that moment, because their content (fixtures,
selectors) is project vocabulary.
*Rejected:* a payload unit (`scripts/`-style or a new top-level dir) — lands hash-checked
in every consumer, so it is not opt-in, and the consumer MUST edit fixtures, which makes
`check` fail forever (the exact anti-pattern under "The one rule"); a `templates/`
starter — `init` writes it into every new project, and a deleted starter resurrects on
the next `init` run; editing the vendored `webapp-testing` — foreign, verbatim, its
NOTICE forbids it.

**Two skills are the working agreement; the rest are help** (v1.14.0). The starter agent
file used to call eight skills mandatory, and the backlog workflow failed a pull request
because a generated block had not been regenerated. Both are the same mistake: a standard
that is enforced everywhere stops being read anywhere. Now `issue-flow` and `docs-flow` are
invoked as a matter of course, everything else is reached for when its subject is at hand,
and the only check that may fail a consumer's run is the drift check — which catches a
locally edited vendored file, i.e. a change that would silently never reach the other
repositories. *Rejected:* keeping the reserve gate and marking it non-required per project
(the same trap one setting away); dropping the reserve report altogether (it is genuinely
useful, just not worth blocking on).
*Cost accepted:* a stale reserve block can now merge. It is deterministic and regenerating
it is one command, so the cost is a stale generated paragraph — not a wrong document.

**A versioned document never mirrors live tracker state** (v1.5.0). `sync-backlog-index.mjs`
used to write open/closed-per-lane into the work document. That mirror can only be refreshed
*after* an item closes — i.e. after the change that closed it merged — so every finished
piece of work owed the consumer a second commit containing nothing but a generated file, and
until that commit the document was wrong. Now the document holds only what the repository
owns (the manifest-derived reserve: deterministic, offline, `--check`-able) and `--emit`
prints the live view to stdout for a CI summary or a terminal.
*Rejected:* a bot that commits the refreshed index (trades a stale document for bot commits
on the default branch, and races concurrent merges); a CI check that fails the PR until a
human commits it (that IS the second commit, only mandatory); keeping the mirror and
accepting staleness (a mirror exists to be trusted, or not at all).

## Working in this repo

- **Work is tracked as issues in this repo** (`gh issue list -R entercloud-cz/dev-standards`).
  The `issue-flow` discipline applies: file before working, close with evidence — what
  changed and how you know it works.
- The skills are **published** here, not vendored into here: that would put two copies of
  the same file in one repository, and `check` would compare a file against itself. When
  working here, follow their content directly.
- **Verification before a release** — all offline:
  ```bash
  node --check bin/dev-standards.mjs scripts/*.mjs scripts/lib/*.mjs
  node bin/dev-standards.mjs list                 # payload is what you expect
  (cd "$(mktemp -d)" && node <repo>/bin/dev-standards.mjs install)   # install into a scratch dir
  # EVERY workflow, here and in templates/ — a starter is as easy to break as a real one
  for f in .github/workflows/*.yml templates/.github/workflows/*.yml; do
    python3 -c "import yaml,sys;yaml.safe_load(open(sys.argv[1]))" "$f"; done
  # every SKILL.md frontmatter parses, name matches its directory, description is non-empty
  # — a malformed block does not error, the skill simply is not there
  # reference files ship to every consumer and nothing else checks them. Parse, never
  # py_compile: py_compile writes __pycache__ INTO the payload directory, and the next
  # `list` cheerfully vendors a .pyc to every consumer (this happened while writing v1.14.0).
  node --check skills/*/references/*.mjs
  python3 -c "import ast,sys;[ast.parse(open(f).read()) for f in sys.argv[1:]]" skills/*/references/*.py
  # last: the payload is exactly what you intended — diff it against the previous tag
  node bin/dev-standards.mjs list
  ```
  Then, in a real consumer: `update`, run its tooling, and `check` — a change that breaks a
  consumer's scripts cannot be seen from inside this repo.
- Commit messages end with the Claude co-author trailer. Commit and push only when asked.
- Reply to the user in Czech; code, comments, commits and docs stay in English.
