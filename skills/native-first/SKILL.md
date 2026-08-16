---
name: native-first
description: Build with what a template, framework or vendored package already ships, and adapt it through its own extension points instead of over them. Use when working in a project that stands on somebody else's template or framework — before writing a component, a style, a build step or a module that the thing you are standing on may already provide, when an upgrade of it broke something, or when deciding whether a local workaround is allowed.
---

# Native first

A hand-rolled equivalent of something a template already ships is the code that breaks on
the next upgrade — and it rarely breaks loudly. The vendor moves a token, renames a slot,
changes a default; the override still compiles, still runs, and quietly stops matching
everything around it. Nobody gets an error. Somebody notices months later that one screen,
one pipeline stage or one module looks and behaves unlike the rest.

**This skill is not about user interfaces.** It applies wherever the project stands on
something somebody else maintains: a purchased admin template, a UI component library, a
framework's project layout, an infrastructure module set, a build toolchain's conventions.

## Before you adapt anything, know where the original is

You cannot prefer the shipped thing without reading it. So the first question is not "how do
I style this" but **"where does this project keep the thing it stands on — its
documentation, its examples, its sources?"**

- **If the project records it, read it there.** Its documentation map (`docs-flow` → the
  role→file map in the agent file) is where a project names the material it does not own.
- **If the project does not record it, ask the user** — where the template lives, where its
  documentation is, whether its sources or examples are available to read — and **write the
  answer into the map** as material the project reads and never edits. Then it is answered
  once, for everyone, instead of re-asked every session.
- **Ask when an adaptation is actually on the table**, not as an opening ritual. A question
  nobody needed yet is noise, and it teaches people to skip the answer.

There is no right location. In the repository, in a package directory, a vendor's
documentation site, a folder outside the project — all fine. What matters is that it is
written down and that it is reachable when someone is about to write the thing it already
contains.

## Extend through its extension points, never over them

Everything a maintained thing ships has a designed way to be adjusted: a theme preset, a
configuration hook, a slot, an override file it looks for, a type it expects you to widen.
Use that, even when a shortcut would be fewer lines.

The test that decides between two adaptations:

> **Would a vendor upgrade break this loudly, or silently?**

Adaptations that fail loudly — a compile error, a startup error, a failed build — are safe,
because they demand attention exactly once and at the right moment. Adaptations that fail
silently — a copied value that no longer matches, a selector that stops matching, a
duplicated constant — are the expensive kind, because nothing announces them.

Concretely, in rough order of how often it comes up:

- Register an addition **where the thing registers its own** (a preset next to its presets,
  a module next to its modules), rather than replacing the file it ships.
- Widen a **type or schema** instead of casting at each call site: an upgrade that removes
  the key becomes an error rather than a quiet loss.
- Read values from **its own variables/tokens** rather than copying literals — a copy is a
  fact stated twice, and `docs-flow` says why that ends badly.
- Do not reach for a raw primitive where a shipped component exists; and where you must,
  say in a comment why.

An instruction from the vendor that targets an older major version is not a rule — it is
evidence about intent. Follow the intent through the mechanism the current version
actually has, and record that you did.

## A deviation is allowed. It has to carry its reason and its expiry

Sometimes the shipped thing is wrong, or has a defect, or genuinely does not cover the case.

- **Report the defect where it was made.** An upstream fix reaches everyone; a local patch
  reaches this repository and then has to be re-applied, by someone who no longer knows why.
  Never edit the vendored artifact itself.
- **A local workaround names two things**: the defect that caused it, and **the condition
  under which it is deleted** ("when the package ships the fix", "when we move to v5").
- **When the cause is gone, delete it in the same change that removes the cause.** A
  workaround kept past its cause is worse than the defect was: it is code nobody can
  justify, and the next reader has to work out whether it is still load-bearing.

This is the same rule the org already applies to vendored skills — send the change upstream,
do not edit the copy — one level up.

## If you are building machinery to police the boundary, the boundary is the bug

The failure mode worth naming, because it is expensive and feels productive: the line
between "ours" and "theirs" keeps moving, so enforcement grows to defend it — a token
module, an allow-list of approved deviations, provenance hashes, a conformance suite. Each
step is defensible; the sum is a house style being invented in public, paid for in review
attention that the product's real problems have a better claim on.

**A boundary that needs an apparatus to hold is the wrong boundary.** The cheap version is
one sentence with teeth — *find the shipped component or example first* — checked in review
against the material the map points at.

Keep a machine check only where there is a **genuine external source of truth** that a
machine can compare against, and then keep exactly one (`docs-flow` → guard tests). "Ours
must not look different from theirs" is not such a truth; "these values must equal the
delivered token file" is.

## Definition of done

1. Whatever was written could not be found already shipped — because someone looked, in the
   place the map names.
2. Every adaptation goes through an extension point, or says in a comment why it could not.
3. Every deviation names its cause and the condition that deletes it.
4. Defects in the vendored artifact went upstream; the artifact itself is unedited.
5. No new machinery exists to enforce the boundary.
