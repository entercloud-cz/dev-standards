---
name: docs-flow
description: Create and maintain a project's documentation so it stays true — which kind of fact belongs in which document, how to write an entry that still helps in six months, and what earns a place in the always-in-context agent file. Use whenever you change behaviour a document describes, record or resolve a finding, are about to write into any project document, or are tempted to create a new one.
paths:
  - "**/*.md"
  - "docs/**"
  - "**/README*"
---

# Docs flow

Documentation rots in a predictable way: the same fact gets written in two places, one
copy is updated, and both keep reading as authoritative. Everything below exists to
prevent that.

**This skill describes ROLES, not filenames.** Every project maps them to its own files.
Read that mapping from the project's always-in-context agent file (`CLAUDE.md`,
`AGENTS.md` or equivalent) before writing anything; if the project has no map, say so and
propose one rather than inventing files.

## The roles

A healthy set is small and closed. Most projects need these, and only these:

| Role | Holds | Does NOT hold |
|---|---|---|
| **System explanation** | What the system *is* and what is built: architecture, data model, pipelines, security posture | product behaviour, deployment steps, planned work, or *why* a decision was taken (that is the decision record) |
| **Product explanation** | What a *user* can do and how it behaves: features, flows, UX, roles/permissions, open product questions | infrastructure, schema DDL, deployment |
| **Decision records** | One record per fork in the road: context, what was chosen, what it costs, **the alternatives and what they would have bought**, and the trigger that reopens it | task lists, or descriptions of how the system works |
| **Planned work** | Remaining/planned work, findings, and why an item exists or was deferred | decisions (the row above) or how the system works today |
| **How-to / operations** | Deployment, configuration, secrets, runbooks, maintainer commands — the imperative steps | why the system is shaped this way |
| **Agent rules** (always in context) | Conventions, invariants, gotchas — what causes an incident when forgotten | anything lookup-able in the roles above |

A project may also have **read-only** documents it does not own — an external review
trail, an audit report, a vendor's template and its documentation. Read them; never edit
them. The project's map says which those are and where they live.

**Optional — a normative half of the product explanation.** A product description
reverse-engineered from code cannot constrain that code: a handler computing the wrong
thing *agrees* with a document derived from it, so there is nothing an implementation can be
wrong against. Where a project needs that, the product-explanation role may take a second
half — one entry per feature, numbered and superseded like a decision record, saying what
the product **must** do. The two halves never state the same behaviour, and the descriptive
side becomes a pointer as each feature ships. Reach for this when something must be
checkable against intent; it is not a default.

## When you change something, update exactly one place

Ask what *kind* of fact changed:

- The system gained/lost a component, a table, a pipeline stage → **system explanation**.
- A user can do something different, or a screen behaves differently → **product explanation**.
- A fork in the road was taken — an option chosen over others → **decision record**.
- Work was finished, deferred or rejected → **planned work** (with the reason, not just ✅).
- A deployment step, variable, secret or command changed → **how-to / operations**.
- A rule was learned the hard way and breaking it would break production → **agent rules**.

**Never state the same fact in two documents.** Cross-reference instead. Two copies do not
stay in step — and when they disagree, both look authoritative, so the reader picks the
wrong one at random. If you find a contradiction while writing, fix it in the same change
and say so: a stale "still open" misleads exactly as much as a missing entry.

## Writing an entry that is still useful in six months

- **Say why, not what.** "Added retry" is a changelog line. "Retries because a shared run
  id let a retry rewrite already-published content" is knowledge. The commit records what
  changed; the document records why it had to.
- **Name the failure it prevents**, with the symptom someone would actually observe — the
  error text, the wrong number, the blank screen. Symptoms are how the next person
  recognises they are in the same situation.
- **Record rejected options and their cost.** A decision without its alternatives gets
  re-litigated in six months by someone who assumes it was never considered. One line per
  option: what it would have bought, what it would have cost.
- **Mark resolutions, don't delete them.** `✅ done (date, commit): what changed`. The
  record of a decision that turned out wrong is worth more than a tidy file.
- **State the constraint, not the wish.** "X is not possible because the API exposes no
  Y" ages well; "we should do X" does not.
- Keep it scannable: short paragraphs, and a table as soon as there are more than about
  three parallel cases.

## Earning a place in the always-in-context file

That file is loaded on **every turn of every session**, so each line is paid for
continuously and each irrelevant line dilutes the ones that matter. A fact belongs there
only if **forgetting it would cause a real incident**, written in the shortest form that
still carries the reason:

- ✅ an invariant with its consequence: "writes must use the atomic API — the streaming
  one is create+append+flush and a concurrent reader saw a half-written file."
- ❌ a description of how something works → that is the system explanation.
- ❌ a procedure with steps and commands → that is a skill, like this one.

When adding an invariant, check whether an existing line says the same thing less
precisely, and **replace** it instead of stacking both.

**When it grows, move detail out rather than trimming words.** A second agent file inside
the directory it governs carries the rules for that directory; the root file keeps a
one-line tripwire at the point of danger, pointing there. Nothing is stated in both, and
the tripwire is a warning, not the rule — open the scoped file before editing what it
governs. What bounds the root file is that pattern, not a word count.

Read it end to end occasionally. It is the document nobody re-reads, which is exactly where
a renamed workflow, a retired component or a deleted module survives long after the fact.

## When a convention needs a machine behind it

Most documentation rot is caught by a reader. Some of it never is: an index listing nine of
ten records, an ownership file naming a path that was deleted, a link resolving to nothing.
**Nothing fails, so nobody learns** — and the one place you would trust to enumerate
something quietly under-reports. That, and only that, is the case for putting a test behind
a document or a convention.

Keep it narrow, and keep it honest:

- Add one only where a machine can compare against **something external and true** — files
  on disk against the index claiming to list them, paths in an ownership file against paths
  that exist — or against a rot you have **actually seen**. "It would be tidier" is not a
  reason; an apparatus defending a boundary you invented is worse than the drift.
- **Write what it deliberately does not enforce**, and why. A machine can know that somebody
  decided; it cannot know they decided correctly. Saying so stops the next reader trusting
  it for more than it does.
- **Guard against passing vacuously.** A glob that matches nothing passes. A parser
  returning an empty list after a format change passes. Assert the set you are checking is
  non-empty — a check that silently examines nothing is worse than no check.
- **A guard that has never failed guards nothing.** Prove it can fail before trusting it:
  break the thing on purpose, once, and watch it go red.
- **A test double must refuse what the real thing refuses.** A permissive fake hides exactly
  the bug the test exists to catch.
- **Denial must be specific.** A check that treats any error as a pass cannot tell "the rule
  works" from "nothing works" — assert the exact refusal, and start from a positive control
  that proves the setup is sound.

## Definition of done for a documentation change

1. The fact is in **one** document — the one whose role it is.
2. If it changed something an operator relies on, the how-to document says what they must
   run, in copy-pasteable form.
3. The work document reflects the new state (item marked done with its reason, or a new
   item filed).
4. Any **generated** section (an index, a table of contents) is regenerated — and it
   generates only what the repository itself owns. Live tracker state is pointed at,
   never mirrored into a versioned document (the `issue-flow` skill says why).
5. No document contradicts another.

## Do not create new documents

If something seems not to fit, it almost always belongs in the system explanation (a fact
about the system), the product explanation (a fact about behaviour), or a skill (a
procedure). A new top-level document needs the user's explicit agreement — and the map in
the agent file must be updated in the same change, or the next reader will not know the
document exists.

**An artifact is not a document.** A release note, a generated report, a review trail: these
are consumed once, by a particular audience, at a particular moment — they do not answer
"how does this work" or "why is it this way", and nobody re-reads them to find out. The
closed set above is about document roles, so a directory of artifacts alongside it is not a
breach of it. Keep the distinction visible in the map, and do not let an artifact start
carrying facts that a role owns.
