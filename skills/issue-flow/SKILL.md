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
tell the user the item number, then work.

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
3. **One branch per item, one item per branch**, named from the item so the two cannot
   drift apart.

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

Then write the *reasoning* into the project's work document and refresh any generated
index. The tracker item holds the task; the document holds why it exists — because an item
disappears when it closes, and the reason has to outlive it.

### Priority

Distinguish three kinds, whatever the project calls them:

- **Correctness/security** — wrong money, wrong data, a hole. Fix before feature work.
- **User-visible breakage or a scale blocker** — someone cannot do their job, or the
  arithmetic runs out at the next growth step.
- **Debt, cosmetic, trigger-gated** — real but waiting on a measured trigger. These belong
  in a **reserve** (below), not on the board.

### Lanes and ownership

When work is split into lanes (by subsystem, by person), an item belongs to the lane that
owns the **files it will touch** — the ownership map is in the agent file. An item that
genuinely spans lanes says which half must land first, and is assigned to whoever does that
half.

## Finishing work

Do all four, in this order. Skipping the last two is how documents start lying.

1. **Close the item with evidence.** What changed, and how you know it works — a test name,
   a count, a live check. A comment that says only "done" is worthless in six months. If
   the project merges via pull requests, the PR body closes it; on a direct commit, close it
   yourself.
2. **Update the document the change belongs to** — see the `docs-flow` skill for which one.
3. **Reflect the new state in the work document** — marked done with its reason, not just a
   tick.
4. **Regenerate any mirror** (an index, a status table) — and do it **after** the item is
   closed, or it captures the pre-close state.

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
criteria** (a reserve entry has none), and move it out of the reserve so it survives the
tooling being re-run.

Something new that is only low-priority goes into the reserve, not into a document's prose.

## Rules that are easy to get wrong

- **File before you work, not after.** An item written once the change is done is a
  changelog entry, not coordination — the other lane needed it while you were typing.
- **Never close an item you did not verify.** "The code looks right" is not evidence.
- **Never close an item partially.** If half shipped, comment what remains and leave it
  open, or split it and link both ways.
- **Stay in your lane's files.** Needing a file another lane owns means the item spans
  lanes: do your half, mark it, say so.
- **Trust the code over the tracker.** When an item's claim and the code disagree, the code
  wins — verify before closing, and fix whichever document was stale.
