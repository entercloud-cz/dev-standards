---
name: browser-check
description: OPT-IN browser verification of an application's pages — a fixture server that answers what the chrome needs to initialise, and a Playwright checker that fails on what static analysis cannot see (a page that throws on load, a nav that never renders, a role gate showing the wrong things). Use ONLY when the user asks to verify frontend in a real browser, to set up browser checks, or to prove a page works in a real browser — or when the project already carries the instantiated harness. Never require it, never nag a project that has not opted in.
---

# Browser check

Static analysis reads pages as text: it can prove a page declares the right mounts, never
that the page survives being opened. A page that throws on load, a nav that renders zero
items, a section switcher that does nothing, a role gate that shows a member what only an
admin may touch — all invisible until a real browser loads the page. The vendored
`webapp-testing` skill provides the tool (Playwright); this skill provides the harness
and the discipline, because the tool alone is not enough: **a typical application's
chrome asks the API for identity on every init and dies into a retry state without an
answer** — so verification needs a fixture server, not `python -m http.server`.

**Strictly opt-in.** No rule anywhere requires browser checks; a project that does not
want them must never be asked about them. This skill activates only when the user invites
it. (A project can also mute it entirely via `skillOverrides`.) CI is a separate,
deliberate consumer decision — downloading a browser in CI is never a default.

## Setting it up — instantiate, then own

The skill carries two reference skeletons next to this file — `references/stub-server.mjs`
and `references/check-pages.py`. **Copy them into the project** (conventionally
`test/ui/`) and adapt the marked sections; from that moment the copies are the project's
own, like everything `init` writes. Do not edit the references in `.claude/skills/` —
they are vendored. To adapt:

1. **The identity fixture** — find what the chrome actually calls on init (watch the
   network tab, or read the chrome module) and answer it with the real endpoint's exact
   response shape, including the identifier formats the app pins (an ID format that the
   real API never emits exercises a path the real app never takes).
2. **The rendered-chrome assertions** — the selectors that prove the chrome *rendered*,
   not merely that markup declared it.
3. **The skip list** — pages that own their chrome by design, and redirect stubs with
   nothing to render. Keep the reason next to each entry.
4. Playwright: `pip install playwright`, then `playwright install chromium` — a browser
   download the user runs deliberately, on their machine. (`webapp-testing`'s
   `with_server.py` can manage the stub's lifecycle where that skill is present.)
5. Record the run commands in the project's how-to document (per `docs-flow`) — the
   harness is something an operator relies on from now on.

The checker starts with a **handshake** (`/__stub__`) and refuses to run against
anything that does not answer it with the expected role: a stale server from another
project on the same port would otherwise make every result nonsense with a straight
face — this happened during the harness's own graduation. Keep the handshake when
adapting.

## The discipline (paid for in the first deployment, not cosmetic)

- **Fixtures, not mocks.** The stub answers recorded shapes; it must never grow logic
  the real API does not have — a stub with behaviour starts proving things that are not
  true.
- **A missing endpoint means ADD A FIXTURE — never widen the ignore list.** The ignore
  list exists for the stub's own deliberate 404s and favicon noise; every pattern added
  to it is a class of real failures the check goes blind to.
- **A green run says "the page works" — never "it shows correct data."** Correct data
  is a different layer's job (checks against a real environment). State this in the
  harness header so nobody upgrades green to a claim it cannot make.
- **Prove this harness can fail before trusting it** — break something on purpose while
  introducing it (a thrown error in a page, an inverted role gate) and show the run go red.
  This is the general rule about guards, applied here; `docs-flow` states it and the rest
  of what keeps a check honest.
- **One list of exceptions, derived — never restated.** Where a page is skipped by this
  harness and also excluded from a conformance test, derive one list from the other. Two
  hand-maintained copies drift, and the drift is invisible: a skip list that fell behind
  let the checker follow redirects and measure the same page three times under different
  names, all green.
- **Three layers, none replaces another.** Static analysis (text: contracts declared —
  the conformance test from `app-design`'s contract triangle is this layer) → browser
  check (the page survives loading and reacts) → real-data verification (the numbers
  are right, against a deployed environment). Each sees what the previous one cannot,
  and this harness is the middle layer, never a replacement for either neighbour.

## Reading a failure

Fix the page or add the missing fixture — those are the only two moves. Most failures in
a fresh deployment are missing fixtures; the tell is chrome that never renders (the
identity call went unanswered) and the checker's own diagnostic list of endpoints the
stub 404'd by design. A failure that survives a correct fixture is a page defect: file
it per `issue-flow` and fix it. What is never a move: skipping the page, widening the
ignore pattern, or teaching the stub to answer "correctly".

## Role-gated pages deserve a deep check

The generic per-page check proves loading; a page whose content depends on the caller's
role earns its own function (the reference shows the pattern): run it once per role, and
assert **both directions** — the privileged role sees the content and no gate, the
unprivileged role sees the gate and no content. A blank page for the unprivileged role
is a failure too: an explanation belongs where content was denied.

**Give refusal its own roles.** Add a caller with no identity at all and one with an
identity that is not permitted, and keep them distinct — unauthenticated and forbidden are
different answers, and the chrome branches that handle them are otherwise reachable by no
check at all. A refusal check must assert the **specific** refusal: a test that accepts any
failure cannot tell "the gate works" from "the server is down".
