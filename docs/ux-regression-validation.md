# PawFeed Functional Regression Validation

> Phase 11 of **PawFeed UX/UI Improvement**.
>
> Purpose: verify that the UX/UI implementation still builds, passes backend regression coverage, keeps the runtime stack healthy, and identify E2E coverage that must be updated for the new interaction model.

## Passed verification

### Frontend

- `npm run lint` — PASS
- `npm run build` — PASS
- Next.js generated all expected routes:
  - `/`
  - `/login`
  - `/register`
  - `/points/create`
  - `/points/:id`
  - `/points/:id/navigate`
  - `/profile`
  - `/profile/points`
  - `/profile/feedings`

### Backend

- `npm run lint` — PASS
- `npm run build` — PASS
- Unit tests — **46/46 PASS**
- Integration tests through `scripts/test-integration.sh` — **7/7 PASS**

The first direct `npm run test:all` attempt failed only because the host shell did not define `DATABASE_URL`. Re-running through the repository's isolated integration-test script provisioned the test PostgreSQL database and all integration tests passed.

### Runtime smoke

`scripts/smoke-test.sh` — PASS:

- backend readiness
- frontend
- frontend → backend proxy

## Existing Playwright E2E result

Existing suite contains **16 tests** across:

- `critical-flow.spec.js` — 1
- `failure-cases.spec.js` — 8
- `active-navigation.spec.js` — 7

Observed result against the current UX/UI implementation:

- **3 passed**
- **13 failed**

The passing failure-case tests were:
- guest is redirected to login before protected create page
- invalid login shows generic error
- create point shows required image error before success state

## E2E failure analysis

### E2E-01 — Create-point helpers still use removed latitude/longitude number fields

**Severity:** MAJOR test regression / stale coverage

Affected:
- critical user flow
- all 7 active-navigation tests
- insecure LAN navigation fallback
- routing-provider failure fallback

The tests still perform:

```js
const numberInputs = page.locator('input[type="number"]');
await numberInputs.nth(0).fill('13.7291');
await numberInputs.nth(1).fill('100.7789');
await numberInputs.nth(2).fill('1');
```

The current create-point UX intentionally moved location selection to the map picker. The only remaining number field is estimated count, so the tests time out waiting for a second number input.

**Phase 12 action:** replace old coordinate-input setup with the current location-picker interaction or a reusable E2E helper that selects the map location through the supported UI.

### E2E-02 — Failure tests submit without choosing the now-required location

**Severity:** MAJOR test regression / stale setup

Affected:
- disguised non-image rejection
- network failure during create

Both tests provide description/image but do not select a location. Current frontend validation correctly stops submission first with the required-location validation, so:
- the disguised file never reaches the backend content-signature validation;
- the mocked POST network failure never executes.

**Phase 12 action:** select a valid location before triggering the targeted failure so each test reaches the layer it is intended to verify.

### E2E-03 — Home geolocation selector uses old accessible name

**Severity:** MINOR test regression / stale selector

Affected:
- geolocation denied shows fallback while map remains usable

The test searches for a button matching `/ตำแหน่งฉัน/`, while the current home-map control is labelled `ใช้ตำแหน่งปัจจุบัน`.

**Phase 12 action:** update the locator to the current accessible name and verify the current error/recovery copy.

### E2E-04 — Navigation assertions must be reconciled with Phase 7 copy/state changes

**Severity:** MAJOR coverage maintenance

After the create-point helper is repaired, navigation tests need to be rerun because Phase 7 deliberately changed:
- manual-origin wording;
- route-source/status copy;
- GPS fallback CTAs;
- follow/recenter copy;
- fallback-route explanation;
- some navigation DOM structure/classes.

Do not weaken behavioral assertions. Update them to verify the same product requirements through the current accessible UI.

## Assessment

No backend/API regression was found:
- build/lint are clean;
- 46 unit and 7 integration tests pass;
- runtime health and frontend proxy pass.

The current Playwright failures do **not** demonstrate a confirmed application-flow break. Their first failure points correspond to intentional UX changes that made old selectors/setup invalid. However, the E2E suite is currently not trustworthy until it is updated and rerun successfully.

Phase 12 must therefore:
1. fix the accessibility/responsive findings from Phase 10;
2. update stale E2E helpers/selectors/setup without reducing coverage;
3. rerun all 16 Playwright tests;
4. fix any application regressions that remain after test maintenance;
5. rerun lint/build/integration as appropriate.

## Phase 12 resolution

The E2E suite was updated to follow the current user-facing flows rather than restoring removed UI solely for test compatibility:

- create-point setup now selects the location through the actual map picker;
- targeted failure tests select a valid location before exercising backend upload or network failures;
- geolocation and navigation selectors/copy were reconciled with the current accessible UI;
- navigation tests continue to verify GPS quality, off-route rerouting, reroute recovery, GPS loss recovery, collapsed-sheet behavior, mobile layout, manual origin fallback, and routing-provider failure;
- off-route test coordinates are derived from the created destination and consecutive GPS fixes are emitted separately, matching the production two-fix reroute rule.

Regression testing also exposed and fixed two real frontend issues:

1. The location picker could collapse to zero height because the overlay grid reserved an error-notice row even when no notice existed.
2. The collapsed navigation sheet hid its primary action; it now keeps the main CTA visible while hiding secondary content.

Earlier UX regression cycle Playwright result at that revision: **16/16 passed**.

Other verification retained from Phase 11:
- backend unit tests: **46/46 passed**;
- backend integration tests: **7/7 passed**;
- runtime smoke test: passed;
- frontend and backend lint/build: passed.

## Earlier UX cycle final diff review

Final diff review found no unresolved blocking UX/UI or functional regressions. The review also hardened the post-login `next` redirect so crafted backslash-based paths cannot resolve to an external origin, and added an E2E regression case for that behavior.

Final verification after the review fix:
- frontend lint: passed;
- frontend production build: passed;
- `git diff --check`: passed;
- Playwright E2E at that earlier revision: **17/17 passed**.


## Visual QA Phase 10 targeted responsive guards

Added `responsive-guards.spec.js` to preserve the responsive fixes that functional flow tests alone do not reliably catch.

The new guards verify:

- Login/Register primary actions remain inside the first 320×568 viewport; the 390×500 Register flow instead verifies the focused Confirm Password field and Submit action remain separate and reachable after scroll.
- Protected mobile routes do not create page-level horizontal overflow at 320×568, and key Create/Profile actions remain usable after being scrolled into view.
- Create-point map picker fills the portrait/landscape viewport, keeps the Confirm footer inside the viewport, avoids nested vertical scrolling, closes with Escape and restores focus.
- Navigation primary action remains inside the viewport and unobscured in expanded and collapsed states at 320×568, 667×375, 844×390 and 932×430.
- Navigation collapse does not hide the main CTA; expand restores the full sheet.

The geometry guard treats an action as usable only when its full bounding box is inside the viewport, its height is at least 44 px, and the element (or one of its children) owns the center hit-test point.

Validation result for the new file: **4/4 passed**.


## Visual QA Phase 11 full functional regression

This run validates the repaired UX/UI together with the existing backend and end-to-end behavior after the responsive guard suite was added.

Passed:

- Frontend lint — PASS
- Frontend production build — PASS
- Backend lint — PASS
- Backend build / Prisma generate — PASS
- Backend unit tests — **46/46 PASS**
- Backend integration tests through `scripts/test-integration.sh` — **7/7 PASS**
- Runtime smoke (`backend readiness`, `frontend`, `frontend → backend proxy`) — PASS
- `failure-cases.spec.js` — **9/9 PASS**
- `active-navigation.spec.js` — **6/7 PASS**
- `responsive-guards.spec.js` — **4/4 PASS**
- `git diff --check` — PASS before this result was recorded

Playwright discovery reports **21 tests in 4 files**. Running the full command in one process exceeded the agent command transport, so the exact same 21 discovered tests were executed by spec / individual active-navigation test on the same production runtime. Combined result: **19/21 PASS**.

### QA-11-01 — critical flow is pinned to stale exact route metrics

**Classification:** stale test expectation; no confirmed application regression.

`critical-flow.spec.js` expects the Driving preview to be exactly `5 นาที` and `2.5 กม.`. The current runtime successfully rendered the road route and OSRM source, but the actual route preview was `2 นาที` and `553 ม.`. The test stops at the exact ETA assertion before reaching later exact Walking/Cycling route values.

Phase 12 should keep checking that a valid road route, ETA, distance and OSRM/source metadata are present, but should not tie the functional flow to one exact metric unless the test also owns the routing fixture that guarantees those values.

### QA-11-02 — active navigation is pinned to one exact first maneuver

**Classification:** stale test expectation; no confirmed application regression.

`active-navigation.spec.js` expects the first maneuver to contain `เลี้ยวขวา`, while the current route correctly rendered `เลี้ยวซ้าย`. The active-navigation UI was present and the remaining navigation behavior is covered by six passing tests: off-route reroute, poor-GPS suppression, reroute recovery, GPS-loss recovery, sheet collapse/expand and responsive mobile layout.

Phase 12 should assert that a real maneuver instruction is rendered (and preserve destination/arrival behavior) without assuming a fixed left/right turn unless the route fixture guarantees it.


## Visual QA Phase 12 regression-finding fixes

Resolved both Playwright findings from Phase 11 without changing production UI, routing behavior, API contracts or backend logic.

### QA-11-01 resolved — route metrics are now behavior-based

`critical-flow.spec.js` no longer assumes one exact routing result such as `5 นาที / 2.5 กม.`. It now verifies that:

- a road-route geometry is rendered;
- ETA and distance contain real numeric values rather than the unavailable marker `—`;
- route metadata identifies the current-position road route and OSRM source;
- Walking and Cycling mode controls become `aria-pressed=true` when selected;
- ETA/distance remain valid after each mode change.

This keeps the critical flow sensitive to missing/invalid routing output while allowing legitimate route metrics to change with the actual start/destination pair.

### QA-11-02 resolved — maneuver assertion follows route semantics

`active-navigation.spec.js` now requires the active maneuver instruction to be non-empty rather than assuming the route's first maneuver must be `เลี้ยวขวา`. The stronger destination assertions remain unchanged: when GPS reaches the point, the UI must show `ถึงจุดหมายแล้ว` and `0 ม.`.

### Regression rerun

- `critical-flow.spec.js` — **1/1 PASS**
- `active-navigation.spec.js` — **7/7 PASS**
- `failure-cases.spec.js` — **9/9 PASS**
- `responsive-guards.spec.js` — **4/4 PASS**
- Combined Playwright result — **21/21 PASS**
- `git diff --check` — PASS

Phase result: all validation/regression findings from Phase 11 are resolved; there are no remaining blocking findings assigned to this phase.

## Visual QA Phase 13 documentation/spec synchronization

Current-truth documentation was reconciled against the approved runtime after the 21/21 Playwright regression pass.

Synchronized behavior:

- Point Detail now documents the fields the runtime actually presents: image/reporter, animal metadata, status/Last Seen, Latest Feeding, recent reports, feeding history and the in-web Navigation CTA. Raw coordinates/embedded map are no longer described as mandatory Point Detail presentation.
- Navigation flow now documents Browser Geolocation or manual-origin Road Route Preview, DRIVING/WALKING/CYCLING, ETA/distance, Active Navigation only with live GPS, Follow/Recenter, GPS recovery, off-route rerouting and portrait/landscape responsive panels.
- Feeding flow no longer claims a runtime image-upload control; the Prisma optional `Feeding.imageUrl` field remains documented as a future/optional enhancement rather than a v1 UI capability.
- NOT_FOUND now remains a report-only action in the v1 user flow; automatic ACTIVE → INACTIVE transition is explicitly future scope.
- `/points/:id/navigate` is listed as a public in-web route.
- Current verification docs report Unit 46/46 and Playwright 21/21 while retaining the older Course Container 16/16 result only as archived evidence.

Traceability status was also reconciled with evidence freshness: `REQ-NFR-DEVOPS-005` is temporarily `IMPLEMENTED` (not `VERIFIED`) until the current 21-test revision is rerun in the Course Container. Current matrix count is **60 VERIFIED / 3 IMPLEMENTED / 0 DEFECT**.

Historical evidence files and the MVP wireframe were intentionally not rewritten; they remain artifacts of the revision/context in which they were produced.

Phase result: current spec, user flow, requirements, acceptance criteria, traceability, architecture summary, navigation status, README and verification status describe the approved runtime without claiming unsupported capabilities.

## Visual QA Phase 14 final diff review

Reviewed only the task-produced working-tree diff against the Visual QA & Responsive Repair goal, scope, constraints and acceptance criteria.

Review findings:

- No blocking UX/UI, responsive, functional, auth/API-contract or documentation mismatch was found.
- No backend source, package/lockfile, Docker Compose or environment-file drift was introduced by this task.
- Auth `next` redirect remains same-origin only and has a Playwright regression guard for crafted backslash/external-origin input.
- Create Point keeps the native file input out of sequential keyboard/a11y navigation (`tabIndex=-1`, `aria-hidden=true`) while visible upload/change buttons programmatically own the interaction.
- Navigation manual-origin state remains preview-only; Active Navigation still requires live GPS.
- CSS contains intentional later responsive overrides over older baseline selectors; no exact duplicated rule was found that changes runtime behavior, and the viewport/overlay guards cover the repaired contracts.
- No temporary Playwright runners, logs, PID files or failed-test artifacts remain.
- Project-local `skills/` files remain untracked support material and are not production runtime changes.

Final gates:

- frontend lint — PASS
- frontend production build — PASS
- Playwright discovery — **21 tests / 4 files**
- most recent full regression execution — **21/21 PASS**
- `git diff --check` — PASS

Known non-code evidence gap remains explicit rather than hidden: the current 21-test working tree still needs a fresh Course Container run before `REQ-NFR-DEVOPS-005` can return from `IMPLEMENTED` to `VERIFIED`.

Final review result: **PASS — no blocking finding remains for this task.**