---
name: issue-flow
description: Every request becomes a tracked item — filed in the issue tracker AND in the project's work document before it is worked, then closed with evidence when it ships. Use at the START of any request that will change the repository, whenever you finish a piece of work, when you discover a defect worth tracking, when promoting something out of the low-priority reserve, or when asked what to work on next.
---

# Issue flow

An untracked change is invisible to everyone else until it lands on the main branch. When
more than one person (or session) works a repository in parallel, that invisibility is how
two people edit the same file, and how work gets done twice or not at all.

**This skill describes the discipline, not one project's setup.** Read the project's
conventions — tracker and repository, label vocabulary, who owns which lane, which document
holds the work, which commands file and refresh it — from the always-in-context agent file
(`CLAUDE.md`, `AGENTS.md` or equivalent). If a project has none, say so and propose one
rather than inventing labels.

## Rule 0 — every request is filed before it is worked

**Any request that will change the repository gets a tracker item AND an entry in the
project's work document FIRST** — not afterwards, not "if it turns out to be big". File it,
tell the user the item number, then work. A project may declare in its agent file that the
tracker **is** its work document — sensible for a small or tooling repository; one item
with the reasoning in its body then satisfies both writes.

**The only exceptions** — name which one applies rather than assuming:

- pure questions, investigations, "what does X do", status checks — nothing changes;
- work that already has an item (say which one);
- a fix small enough to sit inside the current item's scope (say so when closing it).

If unsure whether something qualifies, file it: a closed item costs nothing, an untracked
change costs a conflict.

## Starting work

1. Your queue is **items assigned to you**, not a label filter — a lane label shows the
   other person's work too.
2. Read the item for its context and acceptance criteria before touching anything.
3. **One branch per item, one item per branch, one session per item** — the branch named
   from the item so they cannot drift apart. Resume a session to continue its item; start a
   clean one when the item changes.

**Session history is not a record.** A decision, a measurement or a rejected option exists
only once it is written into a project document or the tracker item — put it there before
the item ends. On resuming, re-derive state rather than trusting a figure quoted earlier in
the conversation; it was true when it was measured, which is not the same as now.

That last part is the agent's job, not the human's: the person choosing which session to
open cannot see themselves sliding into a second item, and only the session can. **When a
request is a different item from the one this session has been working, say so and offer a
clean one.**

## Filing an item

Whatever the project's mechanism (a manifest the tooling reads, or the tracker's own form),
the item needs these five things. Anything less and the next person — or you in a month —
cannot act on it without re-deriving the analysis:

- **Title** — imperative, under ~70 characters.
- **Source** — where this came from: the work document section, a user request with its
  date, or "found while working on #n".
- **Why it matters** — one sentence of impact: what breaks, which number is wrong, what a
  user cannot do. Not "improve X".
- **Done when** — verifiable criteria, one per line, including how it will be verified (a
  test, a count, a live check). "Works correctly" is not a criterion.
- **Likely files, with their owning lane** — this is what tells the other lane whether the
  work touches them.

Then write the *reasoning* into the project's work document. The tracker item holds the
task; the document holds why it exists — because an item disappears when it closes, and the
reason has to outlive it. (Where the tracker is the work document, the body carries the
reasoning — written to be read after the item closes.)

### Priority

Distinguish three kinds, whatever the project calls them:

- **Correctness/security** — wrong money, wrong data, a hole. Fix before feature work.
- **User-visible breakage or a scale blocker** — someone cannot do their job, or the
  arithmetic runs out at the next growth step.
- **Debt, cosmetic, trigger-gated** — real but waiting on a measured trigger. These belong
  in a **reserve** (below), not on the board.

### Lanes and ownership

A lane is a slice of the work with **one assignee**, so that "what am I working on" has a
single answer. Who *reviews* it is a separate axis: a lane whose output is decisions may
deliberately request review from two people, and that is not a modelling error to tidy up.

Three lanes are the org's vocabulary. **A project uses the subset it needs** — a single-lane
project is a legitimate shape, and so is one lane per repository, where the split is the
repository boundary and cross-lane work is a link between two trackers rather than a label.
Which lanes a project actually has, who owns them and which files they own is in the agent
file; what follows is what the names mean when a project does adopt them.

| Lane | Owns | An item is in it when |
|---|---|---|
| `infra` | the platform: infrastructure code, pipelines, schema and migrations, CI, deployment | its acceptance is about how the system is built, run or deployed |
| `app` | the application and the surfaces a user meets | its acceptance is about how the product is implemented |
| `product` | what the product **must** do — the normative specs, wherever the project keeps them | what the item settles is a product decision — read on, because the work may still land in another lane's files |

**Route an item by the files it will touch**, because that is what decides who may edit
them. Where lanes own separate trees — `infra` against the rest, nearly always — that is the
whole test.

**The `product` lane is different in kind: its test is the item's content.** An item is
product's when what it needs is a *decision about what the product must do*, even when
carrying that decision out will touch files another lane owns. Where the project keeps a
normative half, the decision gets **written** into those files — which is why the lane owns
them — but an item does not stop being product's because it also touches code; where the
project keeps none, the lane owns no files at all and the agent file names which document
states each lane's acceptance instead. Either way, "the work happens in application code"
does not make it an `app` item.

**Where a project's routing rule departs from the file test, it says so deliberately** —
read it as decided, not as a mistake to correct.

An item that genuinely spans lanes says which half must land first, and is assigned to
whoever does that half. A product item whose decision will later need code is **not**
automatically one of those. Whether the build rides along in the same item or becomes the
next one in the lane that owns the code is the project's call — say which, and leave the
item where it is either way.

**Introducing a lane a project does not have yet is more than adding a label**: it needs an
owner and a line in the agent file saying what it covers, or nothing routes and the label is
pure overhead. The order to do it in, what a lane with no files of its own can and cannot
enforce, and when to refuse one: `references/adopting-a-lane.md`.

**Past two lanes, prefer "blocked on" over "cross-lane".** A cross-lane label is readable
while there are two lanes and stops being readable the moment there is a third. Most items
that feel cross-lane are really one lane's work waiting on another: mark them as belonging
to the lane whose work the item **is**, with a marker naming the lane they wait for. Where
that work is a decision, the lane is the one deciding — not the one that will build the
decision afterwards, which is its own item. Keep the cross-lane label for work that
genuinely happens in two places at once.

**A code owner without write access is not a code owner.** GitHub does not request review
from someone who lacks write access to the repository, and does not warn — the file
validates, and the request quietly goes to somebody else. The only signal is who actually
gets asked, so after adding an owner, open a change touching their paths and confirm they
were requested.

## Finishing work

Do all three, in this order. Skipping the last two is how documents start lying.

1. **Close the item with evidence.** What changed, and how you know it works — a test name,
   a count, a live check. A comment that says only "done" is worthless in six months. If
   the project merges via pull requests, the PR body closes it; on a direct commit, close it
   yourself.
2. **Update the document the change belongs to** — see the `docs-flow` skill for which one.
3. **Reflect the new state in the work document** — marked done with its reason, not just a
   tick.

*Optional, and only where the project publishes releases:* if the change has a consequence
a pull-request title cannot carry — a behaviour someone must know about, a manual step, a
limit that moved — leave a **release-note fragment**: one small file per change, named from
the item, saying in a sentence what is now possible or fixed. One shared changelog file
conflicts on every second change when more than one person is working; separate files never
do, and the publisher collects the ones added since the last tag. Skip it when the title
already says everything.

**Do not mirror live tracker state into a versioned document.** Which items are open is
already true somewhere else; a copy in the repository can only be refreshed *after* the item
closes, which is after the change that closed it merged — so every finished piece of work
would owe the repository a second commit containing nothing but a generated file, and until
that commit the document is wrong. Point at the tracker (a query, a command) instead, and
generate the live view where it is read rather than storing it. What a document *may*
generate is what the repository itself owns — the reserve below is derived from the manifest,
so it is deterministic and CI can gate it.

## Handing over an item that spans lanes

When your half lands, hand it over explicitly instead of closing it: move the "waiting on"
marker to the other lane, **reassign it**, and comment what exists now and what remains.
Only the person doing the last half closes it.

An item whose first half shipped but whose marker and assignee still point at the finished
lane is invisible to the person who could complete it. That is how cross-lane work stalls
silently.

## The low-priority reserve

Low-priority work must stay **countable without being on the board**. Keep it as structured
data (one entry per item: id, lane, size, source, one line of why) rather than as prose in
a document — prose is how low-priority work disappears, because nobody re-reads six
sections to enumerate it.

Promote an entry when it becomes real: create the item, **then write its acceptance
criteria** (a reserve entry has none). The moment something is a tracker item it **leaves
the reserve** — the tracker owns it now, and an entry recorded in both places is counted
twice. Where the project uses the shared seeding tool, the removal happens by itself.

Something new that is only low-priority goes into the reserve, not into a document's prose.

## Rules that are easy to get wrong

- **File before you work, not after.** An item written once the change is done is a
  changelog entry, not coordination — the other lane needed it while you were typing.
- **Never close an item you did not verify.** "The code looks right" is not evidence.
- **Say what you verified, not what you inferred.** These are different sentences: "the
  permission and the syntax are correct" is not "it works". If a criterion will only be
  proved by the next real run, say that instead of implying the merge proved it — and when
  a criterion was **not** met, record the miss rather than quietly restating the target as
  whatever was achieved.
- **Never close an item partially.** If half shipped, comment what remains and leave it
  open, or split it and link both ways.
- **Stay in your lane's files.** Needing a file another lane owns means the item spans
  lanes: do your half, mark it, say so. The exception is the `product` lane, routed by
  content (above): the item stays where it is and what crosses is the *edit*, so name who
  makes it rather than relabelling the item.
- **Verify the instance, not the indicator.** When something fails, a service's status
  page is a good lead — it suggests what might be wrong — but never the conclusion.
  Evidence is the run, test or query for *your* change, in both directions: an outage
  banner does not prove your run did not fire (incidents are partial), and a green
  status does not prove it did.
- **Trust the code over the tracker.** When an item's claim and the code disagree, the code
  wins — verify before closing, and fix whichever document was stale.
