# PawFeed — Automated Verification

## Verification Layers

| Layer | Tool | Scope |
|---|---|---|
| Unit / HTTP baseline | Jest + Supertest | Validation, upload signature, auth gate, health/error baseline, routing validation/normalization |
| Integration | Jest + Supertest + PostgreSQL | API + Prisma + migration + real database flow |
| Runtime | Docker Compose + curl | Health, proxy, restart, persistence, live routing smoke |
| Browser E2E | Playwright Chromium | Frontend → Backend → PostgreSQL/Upload + Navigation + Failure UI |

## Unit Tests

```text
backend/tests/unit/
├── http-baseline.test.js
├── navigation.test.js
├── upload.test.js
└── validation.test.js
```

Current working-tree result: **4 suites / 46 tests / PASS**

## Integration Tests

Runner:

```bash
./scripts/test-integration.sh
```

ใช้ PostgreSQL 17 จริงจาก `docker-compose.test.yml` และ apply Prisma migration ก่อน test

Result: **1 suite / 7 tests / PASS**

ครอบคลุม Register, Login, auth cookie, Create Point + image, safe filename, bounding-box query, Feeding, latest feeding, STILL_HERE, profile และ failure cases ของ credential/guest/coordinate/non-image/oversized image/missing point/invalid report

## Browser E2E

```text
tests/e2e/
├── active-navigation.spec.js
├── critical-flow.spec.js
├── failure-cases.spec.js
├── responsive-guards.spec.js
├── helpers.js
└── playwright.config.js
```

Runner:

```bash
./scripts/test-e2e.sh
```

ใช้ official image `mcr.microsoft.com/playwright:v1.62.1-noble` จึงไม่พึ่ง Chromium ของเครื่องสมาชิก

Current working-tree result: **21/21 Playwright tests PASS** on the production runtime used for Visual QA. This is separate from the archived Course Container evidence below.

Navigation/responsive coverage includes:
- Road Route Preview + DRIVING/WALKING/CYCLING
- Active Navigation Start/Stop
- next maneuver + remaining distance/ETA + arrival
- Follow/Recenter after user map drag
- off-route detection + automatic rerouting
- poor GPS accuracy guard
- reroute failure + manual retry recovery
- GPS loss + retry recovery
- collapsible mobile portrait bottom sheet with primary action retained
- low-height landscape side-panel layout
- responsive CTA/no-horizontal-overflow guards at `320×568`, `390×500`, `390×844`, `667×375`, `844×390` and `932×430`

Critical/failure coverage also includes marker interaction, guest gate, invalid login, safe post-login redirect, upload failures, API/network no-false-success behavior, geolocation denied/manual-origin fallback and routing-provider failure.

## Runtime Verification

```bash
./scripts/smoke-test.sh
./scripts/verify-persistence.sh
./scripts/smoke-routing.sh
```

`smoke-routing.sh` verifies the live configured routing provider for DRIVING, WALKING and CYCLING. Because it is an external dependency, each mode has a bounded retry and still fails if all attempts are exhausted.

## Course Container

```bash
COURSE_RUN_E2E=1 ./scripts/course-container-test.sh
```

Latest archived Course Container evidence: **PASS / exit code 0**, including Playwright **16/16 PASS** on that evidence revision.

Current working-tree Playwright suite has expanded to 21 tests and has not yet been rerun in the Course Container after this UX/UI repair. Course Container E2E still uses an internal deterministic routing mock so CI reproducibility does not depend on public routing availability; live provider verification remains a separate runtime smoke gate.

## Regression Rule

เมื่อ Requirement เปลี่ยน ต้อง update Acceptance Criteria, implementation และ automated test ที่เกี่ยวข้อง และ evidence ต้องอ้าง source revision ล่าสุดเท่านั้น
