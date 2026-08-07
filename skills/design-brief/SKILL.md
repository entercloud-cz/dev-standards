---
name: design-brief
description: Elicit the design brief and let the user CHOOSE the visual direction before any UI is styled — the questions that make a design the user's own (audience, tone, brand constraints, references, accessibility, signature), and two or three genuinely divergent directions rendered as real, openable HTML variant boards the user picks from by looking. Use BEFORE styling a new application or surface or applying the frontend-design skill, when the user asks for a redesign, to change how something looks or to "make it prettier", or when no visual direction has been recorded yet.
---

# Design brief

The vendored graphic-design craft (the `frontend-design` skill) is deliberately
opinionated: it tells the model to pin down a missing brief *itself* and to show ideas
only once it is confident they will delight. That produces distinctive one-shot results —
and takes the choice away from the person who has to live with it. This skill is the
other half: **the brief comes from the user, and the direction is chosen by the user, by
looking at rendered variants** — the craft is applied afterwards, inside the chosen
direction.

**Precedence, stated once:** while no direction has been chosen and recorded, this skill
overrides exactly two of `frontend-design`'s process instructions — *pin the brief
yourself* and *only show ideas to the user when confident*. Everything else in it
(calibration, typography, the token system, restraint) applies to each variant board,
and the whole skill applies unchanged once the direction is chosen. Where
`frontend-design` is muted or absent, this skill stands alone and the craft choices are
made explicitly and recorded. The request that triggered all of this is filed per
`issue-flow` Rule 0 as usual; the boards themselves are not extra items.

## No styling before a recorded brief

Before the first line of styling for a new application, surface or redesign, a brief
must exist — recorded where the project keeps its frontend conventions (the product
explanation, per `docs-flow`). If one is recorded, follow it and do not re-interview.
The exceptions, named rather than assumed:

- a change *within* the established direction (a new panel on an existing page) — craft
  only, say the brief already covers it;
- the user already gave the direction in the request — confirm only the gaps.

## Eliciting the brief — ask, don't assume

One compact round of questions, not an interrogation. Every question the user leaves
unanswered becomes a **default named out loud** ("assuming light and dark, correct me"),
never a silent choice:

1. **Audience and setting** — who looks at it, on what devices, and how dense the work
   is (a data-dense operator screen and a calm consumer page want different designs).
2. **Tone** — three adjectives the UI should evoke, and **one it must not** ("premium
   but not corporate" steers more than either word alone).
3. **Brand constraints** — colors, logos or typefaces that are *fixed*, versus axes that
   are free. A fixed constraint is an input to every variant, not one of the options.
4. **References** — one or two products or sites the user likes (and *why* — the why is
   the data), and one they dislike.
5. **Modes and accessibility** — light/dark/both, contrast requirements, motion
   sensitivity, anything regulatory.
6. **The signature** — is there something the product should be remembered by (a
   metaphor, an artifact from its domain), or is that the model's to propose?

## Choosing by looking — variant boards

Adjectives do not communicate design; two people who both said "clean" will pick
different boards. The boards are **mandatory** — skip them only when the brief plus the
fixed constraints leave no real aesthetic fork, and say so, naming what pinned the
direction. Otherwise, render it:

1. Build **two or three divergent directions** — different theses, not shades of one
   idea: distinct palette family, type pairing, density and signature element each. The
   three AI-default looks that `frontend-design` names in its calibration are the floor:
   **none of the variants may be one of them** — unless the user's own answers asked for
   that look (their words win).
2. Each direction is one **self-contained static HTML variant board** — no build step,
   no network, openable directly in a browser. Every board shows the **same
   representative content**: whatever the product's real surfaces are (e.g. navigation,
   a list or table, a form, an empty and an error state), not lorem-ipsum posters — so
   the user compares design, not content.
3. Add a **compare page** placing the boards side by side (iframes), next to the
   standalone files. Everything goes to a temp directory outside the repository, or a
   path its gitignore already covers: **boards are disposable and never committed** —
   what survives is the recorded outcome below.
4. Ask the user to **pick, or to mix** ("A's palette with B's density"). One mixing
   iteration is normal; needing more usually means the directions were not divergent
   enough — render a new board rather than negotiating in prose.
5. Only then apply the `frontend-design` craft, inside the chosen direction — the brief
   and the choice are its inputs, not its competition.

## Record the outcome

The boards die; the choice must not. Record, per `docs-flow`, in the project's frontend
conventions: the palette as named values, the type roles, the layout metrics and
density, the signature element, and the modes — the token system the chosen board
embodied. Where the choice closed a real fork (a framework or none, a design system
versus hand-rolled), it earns a decision record (`app-design`). Shared chrome goes under
the consistency contract before the third surface exists.

## Renders beat descriptions, always

The principle generalizes beyond the first brief: whenever the user must choose between
visual options — a component's two layouts, a dashboard's density, a color adjustment —
render the options as something they can open and look at, and let them point. A design
conversation conducted in adjectives converges on nobody's design.
