# dev-standards

Shared engineering standards for **entercloud-cz**. This repo is the **source of truth**
for the parts of our working agreement that are not specific to any one product:

| What | Where | Consumed as |
|---|---|---|
| `issue-flow` skill — every request is filed before it is worked, closed with evidence | `skills/issue-flow/` | `.claude/skills/issue-flow/` |
| `docs-flow` skill — which document holds what, and how to write into it | `skills/docs-flow/` | `.claude/skills/docs-flow/` |
| Issue-flow tooling — manifest-driven issue seeding + a generated work-document index | `scripts/` | `scripts/` |
| Reusable drift-check workflow | `.github/workflows/dev-standards-check.yml` | `uses:` from a consumer workflow |

Issue and PR templates are **not** here — GitHub distributes those itself from
[`entercloud-cz/.github`](https://github.com/entercloud-cz/.github), so that repo is the only
place they can be true. Keeping a copy here as well would be the duplication the `docs-flow`
skill exists to prevent.

Nothing here names a repository, a person, a label or a file path of a specific project.
Each consumer keeps its own vocabulary in **`.dev-standards.json`** (tooling config) and in
its **agent file** (`CLAUDE.md` / `AGENTS.md` — the ownership map, label meanings, commands).
That separation is what makes these reusable.

**Editing this repo?** Read [CLAUDE.md](CLAUDE.md) first — the invariants, the bar for
adding anything, the decisions already taken and the failure modes the first release
exposed.

## Using it in a project

```bash
npx github:entercloud-cz/dev-standards install
```

That copies the skills and scripts into the project and writes `.dev-standards.json`
recording the source, the version and a hash per file. Then:

1. Fill in the `issueFlow` block of `.dev-standards.json` — at minimum `repo`, `owners`
   if the project has lanes, and `labels.priorities` (ordered, most-urgent first) if the
   project's priority labels are not the conventional `P0`/`P1`/`P2`. The `track/`,
   `size/`, `area/` and `needs/` label **prefixes** are the org-wide grammar the tooling
   relies on; the names behind them are the project's own.
2. Add the drift check to CI (below).
3. Tell the agent file that these files are **vendored**: do not edit them here, send the
   change upstream.

**Why vendored copies rather than a submodule or a global install**, and what that costs:
[CLAUDE.md → Decisions already taken](CLAUDE.md#decisions-already-taken).

## Updating a consumer

```bash
npx github:entercloud-cz/dev-standards update          # to the latest
npx github:entercloud-cz/dev-standards#v1.2.0 update   # to a specific version
npx github:entercloud-cz/dev-standards check           # verify, no network
```

`update` preserves the `issueFlow` block — that part is the project's own. Files that
disappeared upstream are reported, not deleted, so removing something is a deliberate act.

### CI

```yaml
jobs:
  standards:
    uses: entercloud-cz/dev-standards/.github/workflows/dev-standards-check.yml@main
```

The check is local and needs no network beyond fetching the CLI. It fails when a vendored
file differs from the pinned version — the failure worth catching, because a shared skill
edited inside one consumer gets overwritten by the next `update` and never reaches the
other repos.

## Changing a shared skill or script

1. Change it **here**, on a branch, with the reasoning in the commit.
2. Bump `version` in `package.json` and tag: `git tag v1.2.0 && git push --tags`.
   The tag is what a consumer pins, so a release without a tag is not consumable.
3. In each consumer: `npx github:entercloud-cz/dev-standards update`, review the diff, commit.

Consumers deliberately do not auto-update. A skill governs how work is done; a change to it
should be seen by the person it governs.

## Adding something to this repo

The bar, the invariants and the mistakes already made are in [CLAUDE.md](CLAUDE.md).
Work here is tracked as issues in this repo; file before you work, close with evidence.
