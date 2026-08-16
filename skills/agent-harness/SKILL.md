---
name: agent-harness
description: Configure Claude Code itself for a project — which skills stay quiet, how a skill is scoped to the files it concerns, how to inject context before a dangerous command, and what belongs in shared versus local settings. Use when a skill keeps volunteering where the question is already settled, when setting up hooks, when deciding what goes in .claude/settings.json, or when asked why a skill is or is not showing up.
---

# Agent harness

Most of a project's working agreement is prose. This is the part that is configuration —
the small number of levers that decide which help arrives, when, and what happens before a
command that cannot be taken back.

Everything here lives in the project's `.claude/` directory. None of it is required: a
project that changes nothing works fine.

## Skills that have nothing left to offer

Skills are help, not gates. But a skill whose premise a project has already settled keeps
volunteering anyway — a design skill in an application that exists, a brief skill where the
visual direction was chosen a year ago. That is noise, and noise is what teaches people to
stop reading.

Two mechanisms, in order of preference.

**`paths:` in a skill's own frontmatter** — the skill surfaces only for matching files. It
costs nothing at rest and needs no per-project configuration, so where it applies it is
strictly better. It is a property of the skill, so a project cannot add it; check whether
the skill already has one before reaching for the second mechanism.

**`skillOverrides` in `.claude/settings.json`** — the project's own lever:

| Value | Use when |
|---|---|
| `"on"` | the default; nothing to write |
| `"name-only"` | something else builds on this skill, so it must stay reachable, but its description is dead weight |
| `"user-invocable-only"` | the premise no longer holds — a decision already made, a capability already instantiated — but someone may still want it deliberately |
| `"off"` | the skill can never apply here |

**Write the reason next to the mute, and the condition that would undo it.** A silent
override reads as an accident, and the next person restores it. "Muted because the direction
is fixed by decision NNNN; it returns if that decision is reopened" cannot be misread.

Mute is not the first tool. A skill that is merely long, or merely rarely relevant, is not
a problem — reach for this when a skill would actively push work in a direction the project
has already decided against.

## Injecting context before something irreversible

A `PreToolUse` hook can put facts in front of the model before a command runs — what is
already deployed, what the current state is, what this command will replace. It is worth
having exactly where the command is hard to take back and the local checkout does not know
the answer.

Four rules, each of which cost somebody a real incident:

- **It never blocks, and always exits 0.** A pre-flight that can fail the command is a new
  way for work to stop; the worst a broken one may do is say nothing. Enforcement is the
  job of the thing being called, not of the thing describing it.
- **Match the action, not words that mention it.** A loose pattern fires on a commit whose
  message merely names the command, and then reads its arguments out of that prose. Require
  the command at the start of the line or after a shell separator, and parse only the exact
  flag form the real command takes.
- **The settings-level `if:` filter is not the boundary.** It narrows what is invoked; it
  does not guarantee what the script receives. The script's own guard is the real one.
- **Name the asymmetry.** Write in the script which way it is tuned and why — usually a
  missed injection costs a blind command while a spurious one costs a paragraph of text, so
  it is deliberately loose in one direction and strict in the other.

Keep the script small, read-only, and in the project's own tooling directory — never among
files vendored from a shared standard, where every project would have to edit it.

## Shared versus local settings

- **`.claude/settings.json` is shared and tracked on purpose.** One permission allow-list
  per project means a colleague does not re-approve the same commands; hooks and overrides
  are decisions about how the project is worked, so they belong in review.
- **`.claude/settings.local.json` is personal and never committed** — machine-specific
  paths, one-off approvals, anything holding a token.
- The local file accumulates. Every so often, promote what is genuinely project-wide into
  the shared file and delete the rest; a hundred hyper-specific one-shot entries is not a
  configuration, it is sediment.

## Two things that surprise people

- **A skill directory that did not exist before needs a session restart** to be discovered.
  Skills are read live from an existing `.claude/skills/`, but creating that directory for
  the first time does not register during the session that created it. Worth saying to
  anyone who reports "the skill isn't there".
- **Agent files and skills load from the working directory up to the repository root.**
  Starting a session in a subdirectory does not escape the root file; scoping is what
  `paths:` and the overrides above are for.

## What not to build

**No skill that dispatches to other skills.** There is no composition mechanism — no
`requires`, and a skill instructing the model to invoke another is discretion, not a
contract. A dispatcher adds a hop that can be skipped, the other skills stay independently
reachable anyway, and a rule that must always apply still needs its trigger line in the
agent file. The two mechanisms above are what the idea was reaching for.
