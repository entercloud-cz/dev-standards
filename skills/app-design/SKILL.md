---
name: app-design
description: Guide the design of a new web application — or a redesign that changes its shape — before code is written. Covers the order of design artifacts (concept, decision records, system and product explanations, functional design of every surface, a seeded backlog), the templates they start from, and the discipline that keeps a design honest. Use when starting a new application or major module, when a product exists only as an idea or a prototype, when asked for a high-level, functional or UI design, or when a decision record needs writing.
---

# App design

A design that exists only in someone's head, a slide deck or a chat thread cannot be
reviewed, cannot be disagreed with precisely, and cannot survive its author's absence. The
output of designing an application is therefore not "a design document": it is the
project's **initial document set, its first decision records and a seeded backlog** — the
same artifacts the `docs-flow` and `issue-flow` skills keep true once the build starts.
This skill covers what those two do not: in which **order** to create the artifacts for a
new application, and what each must contain to still be worth reading when the build is
underway.

**This skill describes ROLES and artifacts, not filenames.** The project maps them to its
own files in its always-in-context agent file (`CLAUDE.md`, `AGENTS.md` or equivalent) —
create that mapping as part of the design (it is artifact 3 below). Nothing here names a
technology stack; the stack is one of the decisions, not an input.

## The order of artifacts

The order matters because each artifact feeds the next. Written out of order, the
documents restate each other — and duplicated facts are how documentation starts lying
(see `docs-flow`). In an existing repository the design work is itself a request: file it
per `issue-flow` Rule 0 before starting — step 6 below seeds the *build* work, which is a
different thing.

1. **Concept — one page.** Who the application is for, the core loop in one diagram and
   one sentence, and what success measurably is. Name the **source of truth** for the
   application's central data — most later decisions hang off that. No technology choices
   yet; a concept that names a database has skipped ahead.

2. **Decision records — before structure.** Every fork in the road gets a record in the
   format below, *before* the documents that assume its outcome are written. Typical forks
   for a new web application: tenancy and isolation model · what owns the central data and
   what merely caches it · frontend approach (framework, or deliberately none) · runtime
   shape (containers, functions, static + API) · how data gets in (push, pull, user entry)
   · async/background work backbone · build-vs-buy for identity. Not deciding is also a
   decision — record it with its trigger.

3. **The document set.** Instantiate the `docs-flow` roles for the project: product
   explanation and system explanation (skeletons below), planned work, how-to/operations,
   and the agent file carrying the role→file map. The set is closed (`docs-flow` — do not
   create new documents): a "design document" next to it would hold nothing that does not
   already belong to one of the roles.

4. **Functional design, surface by surface** (shape below). This fills the product
   explanation.

5. **Graphic design.** Use the `design-brief` skill to elicit the user's brief and let
   them choose the direction by looking at rendered variants, then the `frontend-design`
   craft inside the chosen direction (both vendored alongside this one); where they are
   unavailable, ask and record the choices explicitly. Before the third surface exists,
   put the shared chrome under the consistency contract (below).

6. **Seed the backlog.** Turn the build plan into tracked items per `issue-flow`: real
   items with acceptance criteria for the first increment, everything low-priority into
   the structured reserve, open questions kept as questions (below). The design phase ends
   with work filed, not with a document handed over.

## Decision records — MADR-lite

One record per fork, numbered, in the project's decision-records location:

```markdown
# NNNN — Short imperative title

- **Status:** Accepted | Superseded by NNNN | Deprecated
- **Date:** YYYY-MM-DD

## Context
The forces: the constraint, incident, measurement or product rule that demands a choice.

## Decision
What we do, in one or two sentences.

## Consequences
What this costs us, what it forbids, what must be respected from now on.

## Alternatives considered
Each one: what it would have bought, what it would have cost.

## Revisit when
The observable trigger that reopens this. Omit only if there is none.
```

- **A record is never edited into a lie.** Reversing a decision means a new record and
  marking the old one `Superseded by NNNN`. Numbers are permanent; gaps are fine.
- **Keep the trigger observable.** "The same fix is needed in 3+ pages" reopens a
  decision; "when it feels slow" reopens nothing and forbids nothing.
- The system explanation links decisions in an **index-only table** (decision → link) so
  every *why* exists in exactly one place.
- The template above is the default shape. A project may compact the sections into
  bullet lines — record the chosen shape in the decision-records location itself, and
  keep every record consistent with it.

## The two explanation skeletons

Both documents open with a **status blockquote** — one line of provenance and date
("Designed ahead of the build, YYYY-MM-DD" / "Reverse-engineered from the codebase on
YYYY-MM-DD — records what the code actually does") — and a one-sentence cross-reference
naming where the sibling facts live. A reader must be able to tell how much to trust the
document and where the rest is.

**Product explanation** (what a user can do and how it behaves):

1. The product loop — one diagram, one sentence naming the source of truth.
2. Core behaviours — one section per feature or capability: what it does and its edge
   rules, no schema.
3. Surfaces — per surface (shape below).
4. Roles — a functional matrix: which role can do what, on which surface.
5. Onboarding and auth UX — the path from first contact (sign-up, invitation, SSO) to
   first value.
6. Frontend conventions — page inventory, design tokens and layout metrics, the common
   page pattern, interaction conventions (loading, empty, error, feedback), and — once
   code exists — a **known drift** paragraph naming where reality already diverges.
7. Open questions (discipline below).

**System explanation** (what the system is):

1. Topology — one diagram plus a bullet per component.
2. Data model — and the isolation seams (tenant, role, environment) stated explicitly.
3. Pipelines and flows — how data moves, what triggers what.
4. API surface — a summary, not a reference.
5. Security posture — what will be true and what already is: every invariant carries a
   marker ("⚠ not yet true in full") until it is verified as implemented, and is never
   written as achieved before that.
6. Key decisions — the index-only table into the decision records.
7. Verification — at design time, how each claim *will* be verified; once code exists,
   the commands, tests and probes that check the explanation still holds.

## Functional design of a surface

A surface (page, screen, view) is designed when four things are written, each one
sentence to a short list — anything longer belongs in the mechanics sections:

- **Purpose** — what a user comes here to do, in one sentence.
- **Component inventory** — concrete enough to count: "a summary strip, a searchable
  table, a detail pane", not "a dashboard".
- **Backend contract** — which operations the surface calls and what they return; a
  surface with no contract is a mockup, not a design.
- **States** — empty, loading, error and permission-denied are designed, not left to
  chance; errors belong to the panel that failed, not to the whole page.

## Open questions are not tasks

Every design produces questions nobody can answer yet. Keep them in the product
explanation's open-questions section under one rule: **a question is not a task.** What is
clearly a defect or a decision becomes a tracked item or a decision record; what is
genuinely a question of intent stays a question until the person who owns the intent
answers. Mark the difference visibly, and when a question resolves, mark it resolved
with the date and evidence (`docs-flow`'s resolution style) rather than deleting it —
the record that something was once unclear is what stops it being re-asked.

## Keeping shared UI consistent — the contract triangle

The moment more than a couple of surfaces share chrome (navigation, header, theme), the
design system needs teeth, or the pages drift apart one harmless edit at a time. Three
artifacts, each doing what the others cannot:

1. **A decision record** for the frontend approach — with the duplication cost named in
   its consequences and a measurable revisit trigger.
2. **A contract comment in the module that owns the shared chrome** — the integration
   points every page or view must provide, the single source of shared styling, the
   short list of prohibitions, and **deliberate exceptions listed with their reasons**.
3. **A conformance test** that fails on drift — and names, in its header, the real
   divergence it exists to prevent. Record what is deliberately *not* enforced and why,
   so the next person does not "fix" the gap.

A design system documented but not enforced is a hope; the triangle is what makes it a
property of the codebase.

## Definition of done for a design

1. Every fork has a decision record with alternatives, costs and a revisit trigger.
2. The document set exists, each document knows its role, and no fact is stated twice
   (per `docs-flow`).
3. Every surface has purpose, component inventory, backend contract and states.
4. Open questions are separated from tasks, each marked as defect-suspect or intent.
5. The first increment is filed as tracked items with acceptance criteria; the rest is
   countable in the reserve.
6. The agent file carries the role→file map and the mandatory trigger lines for the
   skills that govern the build.
