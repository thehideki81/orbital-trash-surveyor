---
name: planning
description: Plan before non-trivial work — explore, then write a short plan, align on the approach, implement in verifiable steps, verify. Invoke for any multi-file change, a new feature/component, a refactor, or anything where the approach is uncertain. Skip it only when the diff fits in one sentence.
---

# Planning

Structured, plan-before-code discipline. The goal is a shared, written approach *before* the first
edit — so the work is deliberate, reviewable, and easy to resume. Lightweight by design: no
templates, no ceremony, no tooling.

## When to plan (and when not to)
- **Plan** when: the change touches multiple files, adds a feature/component/composable, refactors a
  shared shape (a composable's return, a prop contract, `catalog.json`, a `lib/` signature), or the
  approach is genuinely uncertain.
- **Skip** when: "you could describe the diff in one sentence" — a copy tweak, a one-line fix, a
  rename. Planning that costs more than the change is waste.

## The spine — Explore → Plan → Implement → Verify
1. **Explore (read-only).** Understand the current code and the contracts you'll touch *before*
   proposing anything. Read the consumers of whatever you'll change. Delegate broad searches to an
   Explore/read agent so the main context stays clean. Do not edit during exploration.
2. **Plan.** Write a short plan and share it before coding. A good plan states:
   - the **goal** and explicit **non-goals**;
   - the **approach** and any real alternatives (with a one-line why for the chosen one);
   - the **files/units** touched and how each changes;
   - which **contracts** are affected (reactivity boundary, catalog schema, composable/`lib` signatures);
   - **verification** — how you'll prove it works (build, the browser-render check, the extensibility
     regression, a `lib/` unit test);
   - **risks** and their mitigations.
   Keep plan docs as working notes under `.claude/plans/` (gitignored — they don't ship in the repo).
3. **Align.** Surface the plan and get agreement on the **approach** before implementing. Cheaper to
   change a paragraph than a diff.
4. **Implement in steps.** One verifiable step at a time; keep the plan current as reality diverges
   (findings, a changed decision). Don't silently drift from the agreed approach — if it needs to
   change, update the plan and say so.
5. **Verify & close.** Run the `verification` rules (build + render check); confirm the plan's
   acceptance points; note any deviation honestly rather than smoothing it over.

## Quality of a plan
- Self-contained enough that a fresh session could execute it from the doc alone (goal, files,
  contracts, verification, references to the docs you grounded decisions in).
- Names the **thin-margin** decisions, not just the headline — the choices a reviewer would question.
- Ends with concrete, checkable acceptance criteria, not "it should work".
