Closes #

## What changed and why

<!-- One paragraph. The reasoning, not the diff — the diff is below. -->

## Checks

- [ ] I only edited files owned by my lane (see the ownership table in the agent file).
      If not: the other owner is tagged for review and knows why.
- [ ] Tests pass.
- [ ] Anything touching data fails **closed** — no silent fallback to fewer rows, a
      default value, or "absent" on an unconfirmed error.
- [ ] A schema migration, if any, is idempotent and guarded, and this PR body states the
      exact command to run it.
- [ ] Vendored files from the org standards repo are untouched (`dev-standards check`).
- [ ] Docs updated where behaviour changed — see the `docs-flow` skill for which document.

## Maintainer steps after merge

<!-- Migrations to run, workflows to trigger, variables to set. "None" is a valid answer. -->
