---
name: code-review
description: >-
  Behavior-first code review for merge requests, pull requests, and diffs in
  any project. Use when reviewing MRs/PRs, examining code changes, giving
  review feedback, or when the user asks for a code review. Prefer glab
  (GitLab CLI) for remote MR workflows.
---

# Behavior-first code review

Review like a reliability engineer reading the change under stress — not as a
linter of the diff. Prefer findings that change runtime outcomes for users or
state. Skip syntax/taste nits unless they hide a real bug; if you mention them,
label them as nits.

Also respect the project's own rules and conventions when relevant (clocks,
error types, DI, layering, naming). Prefer project standards over generic
advice when they conflict.

## Local checkout

Feel free to fetch and switch to the MR branch locally whenever the diff alone
is not enough — for example to read surrounding code, trace imports, run targeted
tests, or verify runtime behavior.

Use [glab](https://gitlab.com/gitlab-org/cli) (GitLab CLI) for remote merge
request workflows. From the repo root:

1. Get the source branch from an MR number:
   `glab mr view <number> -F json --jq .source_branch`
2. Fetch and check it out:
   `git fetch origin <branch-name> && git switch <branch-name>`

Or check out the MR directly when that is enough:
`glab mr checkout <number>`

Use the same workflow when the user gives you a branch name directly. Switch
back to your previous branch when you are done if you need to.

## Mindset

1. **Simulate the system** — walk data/input → domain/store → UI/API →
   error/feedback path.
2. **Name durable intent** — what preference or loaded state must survive
   temporary conditions (viewport, tab, clock tick, reconnect, offline)?
3. **Trace every exit** — reject, omit, unmount, reconnect, second entry,
   fire-and-forget click, menu opened later than render, schema field missing,
   close/reopen while async is in flight.
4. **Check outcome honesty** — does success/error mean what the caller and UI
   assume? Partial persistence must not look like "nothing happened".
5. **Guard boundaries** — validation, mapping, time, result types, layer
   ownership (generic shells must not absorb feature UI; services must not
   take presentation state).
6. **Ask for proof** — a regression that starts from the bad preconditions,
   not a framework smoke test or a test double that diverges from production.

## Review playbook

Copy and complete while reviewing:

```text
Review progress:
- [ ] Durable intent vs temporary conditions
- [ ] Happy path + failed / omitted / stale / cancelled continuations
- [ ] Outcome honesty (success boolean, result variants, partial persistence)
- [ ] Boundaries (API schema, commands vs form state, time, DI, deps)
- [ ] Idempotency / double-entry (reconnect, retry after persist, effects)
- [ ] Classification applied consistently everywhere it matters
- [ ] Tests encode the product invariant with production-like doubles
```

### What to look for

| Area                | Prefer catching                                                                                                                                             | Weak / skip                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| State               | Temporary UI overwriting persisted preference; derive presentation                                                                                          | Renaming locals for taste                                          |
| Control flow        | Fail-open on impossible states; falsy checks that conflate `0` / missing / empty / error                                                                    | Style-only ternary debates                                         |
| Async / UI lifetime | Unmount leaks; close/reopen while submit in flight; stale completion closing a new modal; side effects in updaters                                          | Memoization everywhere without identity need                       |
| Merge / map         | Omitted API fields becoming defaults that wipe existing entity state; allowlists of synthesized defaults                                                    | Formatting                                                         |
| Outcomes            | `true`/generic failure after only part of a multi-step flow; retry that duplicates persisted work; unhandled result variants                                | Wording of log strings unless misleading to users                  |
| Errors / copy       | User-facing messages from another feature; validation code mapped to unrelated copy                                                                         | —                                                                  |
| Time                | Raw `Date.now()` / `new Date()` / timers in testable logic when the project injects a clock                                                                 | Absolute "future" dates in tests when a deterministic clock exists |
| Types               | `as any`, definite assignment `!`, assertions that hide schema/mapper drift                                                                                 | —                                                                  |
| Tests               | Setter/framework smoke tests; waits that don't assert the user-visible effect; sentinel unwraps instead of narrowing; fakes that skip production invocation | Coverage % without scenarios                                       |
| Architecture        | Feature↔feature cycles; shared importing a feature; UI form state in services; fat hooks + global container instead of plain functions with explicit deps   | Drive-by refactors unrelated to the MR                             |

### Fail-closed defaults

- Inconsistent edit/update state → error / impossible-state path, not create/fallback.
- Invalid or missing required remote data → stop; do not continue as success.
- Optional callback required for success UX → make it required or hide the action.
- Silent no-ops after user action → log + user-facing feedback at minimum.
- Empty placeholders behind shipped UI actions → block or implement; do not leave
  clickable no-ops when the ticket is the flow.

### Derived vs persisted

If a condition is temporary (small viewport, inactive tab, short clock tick),
**do not write it into persisted store**. Persist user preference; derive
effective UI:

```ts
const isCollapsed = featureEnabled && preference === Collapsed && isRelevantTab && !isSmallViewport;
```

### Outcome honesty (including partial persistence)

For multi-step flows (create → setup → join / invite / refresh):

- Do not return a single boolean or generic failure that implies nothing happened
  when a backend write already succeeded.
- Prefer an explicit taxonomy, e.g.:
  - nothing persisted
  - persisted, but subsequent setup failed
  - complete success
- UI must match that taxonomy: close + refresh for both persisted outcomes so
  retry cannot create duplicates; keep the form open only when nothing was
  written.
- Handle **every** returned result / error variant (or explicitly defer with a
  question). Returning two failure kinds but only handling one is a silent
  failure.
- User-facing copy must name the **actual operation and failure**. Do not reuse
  another feature's translation map when it mislabels the error.

### Command and dependency boundaries

- Map UI/form state into an explicit command (`{title, selectedUsers, …}`)
  **before** entering a service. Services must not take presentation fields
  (filters, raw unvalidated input, modal-only shape).
- Feature modules must not import each other in both directions. Extract shared
  creation/timing/styles into neutral modules. A `shared/` module must not
  depend on a feature folder.
- Prefer a plain function with explicit dependencies for orchestration; keep
  hooks/components thin (UI state only). Avoid resolving critical deps from a
  global container inside the unit under test.
- Resolve feature flags at a composition boundary and pass booleans; avoid
  one-line hooks that only re-read context.
- If you introduce a classification, apply it everywhere that classification
  drives UI/behavior (headers, avatars, alerts, permissions).

### Schema and merge boundaries

- Prefer updating from the **validated payload** so omitted fields stay omitted.
- Shared schema relaxations need contract coverage for **all** consumers, not
  only the feature that prompted the change.
- Avoid type assertions after validation — widen the mapper input type so the
  type checker tracks schema/mapper compatibility.

### Tests worth requesting

Ask for (or write) tests that lock the **scenario you described**:

- Existing entity with non-default local state → update omits fields → state unchanged.
- Unmount / cancel during async → resources disposed; no silent leak.
- Close/reopen (or generation change) while submit is pending → stale completion
  cannot dismiss the new instance; dismiss blocked while submitting if required.
- Retry after "persisted but setup failed" → no duplicate create.
- Opposite dependency path (stable when deps unchanged **and** updates when they change).
- Deterministic clock instead of hard-coded absolute future dates, when the
  project supports it.
- Menu/action eligibility recomputed at open/action time if `now` can go stale.
- Assert the **defining** behavior of the flow, not only create + refresh.
- Narrow result / optional types explicitly on success paths — do not unwrap to
  sentinels or map errors to `null` in tests that expect success.
- Test doubles must preserve production semantics (e.g. invokers that actually
  start the async work). Prefer deferring an inner dependency over a fake that
  never invokes.

Reject tests that only prove a framework's setters work, or that codify a
misleading validation/error mapping.

## Related systems

When the diff alone is not enough to judge an API contract, schema field,
endpoint behavior, or persistence semantics:

1. Find the related service / backend / package the change depends on.
2. Prefer the latest relevant branch of that codebase when available locally.
3. Search and read the modules that define request/response shapes, validation,
   error codes, and persistence.

If a finding depends on that behavior, cite it with a permalink (repo + file +
lines on the default or relevant branch) when possible.

## Comment style

Write like a strong teammate: collaborative, specific, actionable.

**Structure each substantive comment:**

1. Observation (what the code does)
2. Why it matters at runtime (user/state consequence)
3. Concrete alternative (sketch or either/or)
4. Optional regression that locks the scenario

**Tone:** prefer "Can we…", "Could we…", "I would prefer…", "Is this intentional?".
Label non-blocking notes. Separately ask if something is intentional vs a bug
before treating scope as wrong. Do not mention Cursor, the IDE, or AI at all.
Use B2-level English so it sounds natural. Do not use "--" in the output.

**Severity (use in the summary, not as emoji spam on every line):**

- **Blocking** — wrong behavior, data loss, silent failure, duplicate persist, contract break
- **Should fix** — likely bug or misleading error/recovery gap
- **Nit** — clarity/consistency/a11y-only (semantic HTML, cursor, naming)

## Output format

When delivering a review, use:

```markdown
## Summary

[1–3 sentences: what the change does + overall risk]

## Findings

### Blocking

- **[area]** Problem → runtime consequence → suggested fix
  - Test: [scenario to lock]

### Should fix

- …

### Nits

- …

## Questions

- [Intent / product contract unclear?]

## What looks good

- [Call out solid boundaries or tests — briefly]
```

Inline MR comments should stand alone without the summary template; keep the
same observation → consequence → alternative → test shape.

## Follow-through

When the author replies with a fix:

- Re-check the **root cause**, not only the symptom (e.g. removing one bad
  allowlist field is insufficient if omitted props still synthesize defaults;
  a generation guard is insufficient if dismiss is still allowed mid-submit and
  the test double never starts submission).
- Confirm requested regressions actually assert the failure mode with
  production-like behavior.
- Acknowledge when the boundary is fixed.
- If title/description no longer match the change, ask for an update.

## Project anchors (adapt per repo)

Prefer the project's documented patterns when present. Common ones to look for:

- Time: injectable clock / wall clock instead of raw `Date.now()` / timers in
  testable logic
- Errors/optionals: explicit result / optional types instead of thrown exceptions
  or null soup, when that is the project style
- Prefer DI at composition boundaries over module mocks in unit tests
- API schemas are runtime boundaries: prefer validating/narrowing so omitted
  fields stay omitted; avoid leaking unvalidated passthrough data unless
  intentional
- Identity comparisons: use the full identifier the system defines (e.g.
  qualified / compound IDs), not a bare fragment alone
- Prefer explicit conditions (`title.trim().length === 0`,
  `errors.title !== undefined`) over truthiness on strings/optionals

## Comment examples

Patterns for strong behavior-first reviews. Adapt to the change under review; do
not paste blindly.

### Durable preference vs temporary UI

**Weak:** "Don't set the store here."

**Strong:**

> Could we avoid overwriting the persisted collapse preference here?
>
> The preference is persisted, but this sets it permanently to expanded when
> the viewport becomes smaller. The same happens when changing to a non-list
> tab.
>
> Viewport and current tab are temporary conditions. Persist the user's
> preference and derive the effective presentation instead:
>
> ```ts
> const isListCollapsed =
>   isEnabled && preference === Collapsed && isListTab(currentTab) && !isScreenLessThanMdBreakpoint;
> ```
>
> That way, visiting Settings or resizing does not discard the user's choice.

### Fail closed on inconsistent state

**Weak:** "Handle the missing id."

**Strong:**

> I think this should fail closed instead of falling back to creating a new
> entity.
>
> If `mode === 'edit'` but `editingId` is missing, this currently creates a new
> record. An inconsistent edit state could create duplicates.
>
> Can we make the branches explicit?
>
> - create mode → create
> - edit mode + id → update
> - edit mode + missing id → return an update / impossible-state error

### Omitted API fields wiping local state

**Weak:** "Be careful with defaults."

**Strong:**

> The schema allows `name` (and similar fields) to be omitted.
> The mapper turns omissions into concrete defaults, then the merge allowlist
> writes those defaults onto an already-loaded entity. A valid response without
> `name` could clear an existing title.
>
> Could we derive the update object from the validated payload so omitted
> properties stay omitted, rather than from the normalized entity?
>
> Please add a regression: existing entity has a title and a non-default
> permission; update response omits those fields; both remain unchanged.

### Partial persistence / dishonest outcomes

**Weak:** "Add a try/catch." / "Return a better boolean."

**Strong:**

> This flow can reject after the backend entity has already been created.
> Returning a generic `creationFailed` keeps the modal open because the caller
> treats that as "nothing was created". Retrying can therefore create a
> duplicate.
>
> Could the result distinguish:
>
> - nothing was persisted
> - the entity was persisted but subsequent setup failed
> - the complete operation succeeded
>
> Close the creation flow and refresh the list for both persisted outcomes, and
> cover the middle case with a regression.

**Related — early success:**

> `submit()` returns `true` immediately after triggering the follow-up action,
> but that does not mean the action succeeded. Offline paths may skip it, and
> the join/start call may still fail.
>
> Could we make the outcome explicit (creation vs successful join), or await
> the follow-up before reporting success?

**Related — unhandled variants:**

> The operation returns both `notFound` and `joinFailed`, but the hook handles
> only the first. A rejected start path produces no feedback.

**Related — wrong feature copy:**

> Failures resolve through another feature's translation keys, so a create
> failure can read as a schedule failure. Could we use neutral shared messages
> or feature-specific mapping so title and body match the actual operation and
> failure?

### Async UI lifetime / stale completion

**Weak:** "Memory leak?" / "Add a flag."

**Strong:**

> Can the modal still be closed through the close button, backdrop or Escape
> while `isSubmitting` is true?
>
> Async submission continues after `handleClose()` resets the form. If the user
> closes and reopens before the first request completes, the previous completion
> can close the newly opened modal or start work after cancel.
>
> Could we prevent closing while submission is active, or associate completion
> with the submission/modal instance that initiated it?
>
> Please add a component regression. Prefer the production invoker and defer an
> inner dependency so `isSubmitting` is truly true while dismiss is attempted.

### Command boundary (form state vs service)

**Weak:** "Wrong type."

**Strong:**

> Why does the service accept the form state type directly?
>
> That type contains presentation fields (filters, modal-only shape) and a raw,
> potentially empty title that assumes the modal already validated.
>
> Could we validate and map UI state into an explicit command such as
> `{title, selectedUsers}` before crossing into the service?

### Feature coupling / dependency direction

**Weak:** "Wrong file."

**Strong:**

> This introduces dependencies between two feature modules in both directions,
> including cyclic imports. Feature A imports defaults/styles from Feature B,
> while Feature B's service imports Feature A's form state.
>
> Could we extract shared creation, timing, participant and modal-style concerns
> into neutral modules? A `shared` module must not import from a feature folder.

### Orchestration extractability

**Weak:** "Too many hooks."

**Strong:**

> Could we remove this memoization cascade and separate orchestration into a
> plain function with explicit dependencies?
>
> The hook resolves deps from application context, view model, store and a
> global container while also handling translation, modal UI, refresh and join.
> A plain `startFlow(dependencies, input)` returning an explicit result type
> would be independently testable; the hook would own only UI state.

### Tests that miss the bug

**Weak:** "Add more tests."

**Strong:**

> Waiting for the mock loader to have been called twice only proves loading
> started. The playability check still resolves asynchronously, so these
> re-renders may run while `src` is still undefined — and the test passes even
> if re-rendering would revoke an active playback URL.
>
> Wait until the media element `src` is the expected blob URL before the
> progress loop, as the earlier test does.

### Tests that miss the defining behavior

**Weak:** "Looks covered."

**Strong:**

> Could we also verify that the returned conversation identifier is passed into
> the join operation?
>
> This test currently proves only that the entity is created and the list is
> refreshed. It would continue to pass if joining were removed or invoked with
> the wrong id, even though joining is the defining behavior.

### Explicit result / optional narrowing in tests

**Weak:** (accepting `unwrapOr(new Date(0))` on a success path)

**Strong:**

> Could we assert the result and optional variants explicitly instead of
> matching them to sentinel values?
>
> Mapping errors to `null` and unwrapping to a sentinel introduce fallbacks into
> a test that expects success. An explicit ok/just assertion plus normal
> assertions narrows types and documents the invariants.

### Framework smoke test

**Weak:** (accepting store setter tests)

**Strong:**

> This test verifies that calling a store setter assigns the provided value.
> That is the framework's behavior, not an application invariant.
>
> Could we instead cover the behavior this MR introduces — e.g. preference
> persisted, list visually expanded on non-list tabs when preference is
> collapsed, collapse gated by tab + viewport + flag?

### Boundary / layer ownership

**Weak:** "Wrong file."

**Strong:**

> This wrapper is a generic panel abstraction, but it now imports feature
> styles and renders feature-specific collapse controls.
>
> Could we keep this behavior inside the feature (e.g. a `panelOverlay` slot)
> so the wrapper stays generic?

### Swallowed errors behind result wrappers

**Weak:** "Use a Task/Result here."

**Strong:**

> Wrapping `addUsers()` in a result type does not fully solve the concern:
> `addUsers()` still catches backend errors internally and does not rethrow.
> This wrapper can resolve successfully when adding users failed.
>
> For this flow we need an explicit result (e.g. `{ failedToAdd }` or a typed
> error) instead of wrapping the existing method unchanged.

### Stale time at action time

**Weak:** "Use a clock."

**Strong:**

> `nowMs` comes from render time, but the menu can be opened later. The item
> may render before the event starts; after it starts, without a rerender,
> eligibility still sees the old timestamp.
>
> Can we compute current time when opening the menu, or re-check eligibility
> inside the action before opening the modal?

### Classification applied inconsistently

**Weak:** "Treat them as groups."

**Strong:**

> The component introduces `isGroupCall = isGroup || isMeeting`, but still
> passes only `isGroup` to the header. Meetings consequently get one-to-one
> avatar and focus behavior, while alerts and controls classify them as group
> calls.

### Validation / error taxonomy honesty

**Weak:** "Fix the message."

**Strong:**

> `missingTimes` is not equivalent to `endBeforeStart`. When either date is
> absent, this reports "End time must be after start time", which describes a
> different failure — and the test currently codifies that misleading result.
>
> Could missing times be represented explicitly, or made impossible before this
> mapper runs? Also avoid mapping a `default` branch to `endBeforeStart`; an
> exhaustive mapping prevents a future error from silently producing unrelated
> copy.

### Type assertion hiding schema/mapper drift

**Weak:** "Remove the cast."

**Strong:**

> Since the payload is already validated as the narrower type, could the mapper
> accept that type without an assertion?
>
> The assertion hides whichever structural difference prevents acceptance, so
> the type checker cannot verify that the schema and mapper remain compatible.

### Schema change blast radius

**Weak:** "Nice test."

**Strong:**

> Is `permission: null` valid for all canonical responses, or only for the
> payload embedded in this feature?
>
> This change broadens a shared schema. If `null` is valid globally, could we
> add a contract test for the canonical schema?

### Truthiness vs explicit conditions

**Weak:** "Use a helper."

**Strong:**

> Could we avoid converting a possibly absent string through truthiness?
> `Boolean(errors.title)` hides the condition. `errors.title !== undefined`
> (and `title.trim().length === 0` for emptiness) stays correct regardless of
> string content.

### Intent check (non-blocking)

> Non-blocking: remaining actions without a click handler still render as
> active menu entries and only close the menu. Is that intentional for this MR's
> scope?

### CI feedback honesty

**Weak:** "Quiet the logs."

**Strong:**

> I do not think we should reintroduce quiet mode in CI. With quiet mode and a
> max-warnings budget together, the linter can fail the warning budget without
> printing which warning caused it. That reintroduces guessing. Keep warnings
> visible; if log volume is the problem, address that separately.
