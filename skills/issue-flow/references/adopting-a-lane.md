# Adopting a lane

What has to be true before a lane exists. **The label is the last step, not the first:** a
`track/<lane>` that nobody owns and that the agent file never explains routes nothing — and
a set of labels where some route and some do not is worse than no labels, because people
stop reading all of them.

Work the steps in order; each one depends on the one above it.

## 0. Check the lane will route something

A lane earns its place by doing at least one of two jobs, and it only has to do one:

- **Routing to a person** — a different human is asked, assigned or made to review. This is
  the job a second person unlocks, and the usual reason a lane is created.
- **Separating a kind of work** — the lane gives one person a queue they can filter, and a
  named document the lane's items are accepted against. A single-maintainer project can want
  this on its own: "what am I deciding" and "what am I building" are different questions
  even when the same person answers both.

Refuse the lane when it does **neither** — nobody new is asked and nothing is separated, so
the label only adds a step. Record that refusal where decisions live, **with the trigger
that reopens it**; "revisit when a second person joins" is what makes the next attempt a
decision rather than the same argument had twice.

Owning no files of its own is *not* a reason to refuse — plenty of lanes are the second kind.
What such a lane cannot have is a CODEOWNERS line (step 5), so its routing is a convention
that holds while people follow it. Say so when adopting it, rather than leaving someone to
discover it through a review that never arrived.

## 1. Name the owner

**Assignment is single; review need not be.** The tooling assigns from `owners[lane]`, one
login, because "what am I working on" has to have one answer — a lane where two people
genuinely share the work records the second under `contributors` and sets `assignee` on the
items that are not the default's.

Review is the other axis and takes as many people as the lane needs. A lane whose output is
decisions is the case for naming two in CODEOWNERS on purpose: a spec approved by one of
them is a decision one person made. Do not read the single assignee as a rule against that.

## 2. Say what the lane owns

A list of paths — or, for a lane that has none, the test that stands in for one. Settle it
before anything is configured: this is the sentence the whole lane rests on, because it is
what routes items, what CODEOWNERS can enforce and what "stay in your lane's files" means.

Draw it narrowly. A lane given a whole tree because it *mostly* belongs there will pull in
review requests that carry no decision for it, and requests that are mostly noise get
ignored as a class — including the ones that mattered.

**For the `product` lane specifically**, there are two shapes and the choice between them is
the first thing to settle.

*With a normative half* — the project keeps one numbered entry per feature saying what the
product must do (`docs-flow`, "a normative half of the product explanation"; the
conventional home is `docs/specs/`, the same way `docs/BACKLOG.md` is the conventional home
of the work document, and the project's documentation map is what actually decides). Those
files are the lane's, which is what CODEOWNERS can then enforce — but the lane is still
routed by content, so an item stays product's even when carrying its decision out also
touches code another lane owns. The lane does **not** additionally take the descriptive
product explanation: that changes every time the app lane ships something, so giving it away
means product reviewing the other lane's implementation notes.

*Without one* — the lane owns no files and routes by content: an item is product's when the
item *is* a decision about what the product must do, whoever ends up typing the code. Name
in the agent file which document states acceptance for each lane, because that is the only
form the test can take when the files cannot decide. This shape is fine; it is just the one
where CODEOWNERS cannot help.

Adopting the product lane is the natural moment to decide which of the two the project
wants — the lane's output is decisions, and they need somewhere to live.

## 3. Register the lane in `.dev-standards.json`

```json
"issueFlow": {
  "owners": {
    "infra":   "some-login",
    "app":     "another-login",
    "product": { "owner": "third-login", "contributors": ["another-login"] }
  }
}
```

This is what *declares* the lane. The seeder takes an item's default assignee from it, and
the backlog index lists the declared lanes first — a lane that is only ever a label still
appears in the index once an item carries it, but with nobody to assign to and sorted after
the declared ones. **Key order is the lane order** of the reserve block and of `--emit`.
`update` preserves this block, so it survives every upgrade.

## 4. Declare the labels in the issue manifest

Add to the manifest's `labels`:

- `track/<lane>` — the description states the **routing test in this project's own document
  names**. It is the only explanation most people ever read, and the seeder now reconciles
  it, so editing it here is how it gets fixed everywhere.
- `needs/<lane>`, if the project marks cross-lane work — and `track/<crossLaneLabel>` (the
  configured cross-lane track, `both` by default) if it does not exist yet. **Creating an
  issue with a label that does not exist fails**, so every label an item can carry has to be
  declared in the same change.

Then `node scripts/seed-issues.mjs`, `--dry-run` first: it creates the missing labels and
updates a description or colour that drifted. Note that a bare run is not label-only — it
also files everything queued in the manifest's `issues` and rewrites the file. There is no
labels-only mode; if the queue is not meant to go out yet, empty it first.

## 5. Add the CODEOWNERS line

Last match wins, so broad rules first and the lane's re-assertions last. Then verify it with
a real pull request touching those paths and check who was actually requested — a line can
be syntactically perfect and route nowhere (the skill says why).

## 6. Write the lane into the agent file

**This is the step that gets skipped, and it is the one that makes the lane real to a
session.** The skill says what the standard lanes mean in general; only the agent file can
say what *this* project's lanes own and which document states their acceptance. A session
that meets `track/<lane>` with nothing in the agent file has to guess, and will.

One row per lane: the lane, its owner, the files it owns, the test that routes an item to
it. Where the project's routing test departs from the file-ownership rule, say that it is
deliberate and why — otherwise the next reader treats it as a mistake and "fixes" it.

## 7. Decide what happens to the items already open

Relabel only what is now actively wrong. A bulk relabel for tidiness costs a notification
per item and buys nothing.

The new lane makes the cross-lane track ambiguous — a label meaning "two of them" stops
naming which two the moment there is a third. Renaming it (`crossLaneLabel`) relabels every
open item that carries it, so spend that only when someone genuinely cannot tell what an
item means; the skill's rule for new items handles the rest.

## Retiring a lane

Remove it from `owners`, drop the CODEOWNERS line and the agent-file row, and say in the
decision record what happened to the work it owned. Leave the labels: they are the history
of the items that carry them, and deleting a label strips it from every closed issue.
