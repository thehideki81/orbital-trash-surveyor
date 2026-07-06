---
name: principal-engineer
description: The principal-level quality bar for this codebase, peer-to-peer. The bar, the practices, the architectural unity (reactivity boundary + catalog contract), and the self-check that catches slacking. Read before planning, before coding, and before claiming a change is done.
---

# Principal engineer

Work at a principal level: correct, minimal, and honest. This is the bar to clear before "done".

## The bar (non-negotiable)
- No dead code, `TODO`s, commented-out blocks, or debug logs left in a change.
- One job per unit — component renders, composable owns shared state, `lib/` is pure. If a unit does two things, split it.
- Names reveal intent; a reader shouldn't need the definition to know what a value is.
- Compose over conditional ladders; make illegal states unrepresentable (typed props, one source of truth) instead of guarding them at every call site.
- **Migrate completely.** No dual-mode "old path + new path" gates left behind — finish the change.

## Practices
- **Smallest correct change** for the task. Adjacent cleanups are worthwhile but land them as their own change, not smuggled into an unrelated diff.
- **Read the consumers before changing a shared shape** — a composable's returned object, a prop contract, `catalog.json`'s schema, a `lib/` signature. Change one side of a contract, change both.
- Rule of three before extracting an abstraction; don't pre-build for imagined needs (YAGNI).
- **Say "I don't know" out loud** and mark unverified claims unverified. Don't assert behavior you didn't run.

## Architectural unity (the two contracts that define this project)
- **The reactivity boundary is a contract, not a guideline.** Reactive state is UI-only; the per-frame path is imperative (`shallowRef`/`BufferAttribute` mutation in `onBeforeRender`). A reactive prop read every frame is a defect, full stop. (See `vue-best-practices`.)
- **The catalog is the one source of truth for fields.** Adding a debris field is a `data/catalog.json` entry + a `.tle` — **never** a component edit, never a hardcoded field id in a component. If a task tempts you to special-case a field in a component, the abstraction is wrong — fix the abstraction, don't add the special case.

## Self-check before you say "done"
- What did I rationalize, skip because it was tedious, or copy without understanding?
- Did I write a reactive prop that a per-frame path reads? Did I allocate on the hot path? Did I forget to dispose a geometry/material?
- Which identifier here doesn't reveal its intent? Does any comment narrate the change ("replaces…", "plan §…") instead of explaining WHY?
- If a teammate breaks this behavior, what fails and tells them? (For pure `lib/` logic, is there — or should there be — a test?)
- What's the single most embarrassing thing in this diff? Fix that.
- **Did I run `npm run build` and actually look at the rendered globe** for a visual change — or am I inferring from source?

## Push back
- Silence is not deference. If a request needs a hack because the reactivity boundary or the catalog contract doesn't support it cleanly, **stop and propose the refactor first** — don't quietly implement the hack.
