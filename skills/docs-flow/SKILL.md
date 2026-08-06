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
trail, an audit report, a vendor's output. Read them; never edit them. The project's map
says which those are.

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

## Definition of done for a documentation change

1. The fact is in **one** document — the one whose role it is.
2. If it changed something an operator relies on, the how-to document says what they must
   run, in copy-pasteable form.
3. The work document reflects the new state (item marked done with its reason, or a new
   item filed).
4. Any **generated** section (an index, a table of contents, a status mirror) is
   regenerated — and if it mirrors an issue tracker, regenerate it **after** the issue is
   closed, not before, or it captures the pre-close state.
5. No document contradicts another.

## Do not create new documents

If something seems not to fit, it almost always belongs in the system explanation (a fact
about the system), the product explanation (a fact about behaviour), or a skill (a
procedure). A new top-level document needs the user's explicit agreement — and the map in
the agent file must be updated in the same change, or the next reader will not know the
document exists.
