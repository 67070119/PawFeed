# PawFeed — Automated Verification

## Verification Layers

| Layer | Tool | Scope |
|---|---|---|
| Unit / HTTP baseline | Jest + Supertest | Validation, upload signature, auth gate, health/error baseline |
| Integration | Jest + Supertest + PostgreSQL | API + Prisma + migration + real database flow |
| Runtime | Docker Compose + curl | Health, proxy, restart, persistence |
| Browser E2E | Playwright Chromium | Frontend → Backend → PostgreSQL/Upload + Failure UI |

## Unit Tests

```text
backend/tests/unit/
├── http-baseline.test.js
├── upload.test.js
└── validation.test.js
```

Result: **3 suites / 11 tests / PASS**

## Integration Tests

Runner:

```bash
./scripts/test-integration.sh
```

ใช้ PostgreSQL 17 จริงจาก `docker-compose.test.yml` และ apply Prisma migration ก่อน test

Result: **1 suite / 7 tests / PASS**

ครอบคลุม Register, Login, auth cookie, Create Point + image, safe filename, bounding-box query, Feeding, latest feeding, STILL_HERE, profile และ failure cases ของ credential/guest/coordinate/non-image

## Browser E2E

```text
tests/e2e/
├── critical-flow.spec.js
├── failure-cases.spec.js
├── helpers.js
└── playwright.config.js
```

Runner:

```bash
./scripts/test-e2e.sh
```

ใช้ official image `mcr.microsoft.com/playwright:v1.62.1-noble` จึงไม่พึ่ง Chromium ของเครื่องสมาชิก

Result: **7 tests / PASS** ทั้ง Docker environment ปกติและ Full Course Container

Critical flow:

```text
Register → Login → Add Point + image → Detail
→ In-Web Navigation → Feeding → Feeding History
→ STILL_HERE → Profile Points → Profile Feedings
```

Failure UI:

- Guest Create → Redirect Login
- Invalid Login → Generic Error
- Missing Image → Error + ไม่มี Success State
- Disguised Non-image → Backend Reject + UI Error
- Network Failure → Error + ไม่ redirect/ไม่แสดง Success หลอก

## Runtime Verification

```bash
./scripts/smoke-test.sh
./scripts/verify-persistence.sh
```

ตรวจ Backend readiness, Frontend, same-origin proxy และ User/Point/Image/Feeding/Report หลัง container restart

## Course Container

```bash
COURSE_RUN_E2E=1 ./scripts/course-container-test.sh
```

Phase 7 result: **PASS, exit code 0**

## Regression Rule

เมื่อ Requirement เปลี่ยน ต้อง update Acceptance Criteria, implementation และ automated test ที่เกี่ยวข้อง และ Phase 8 ต้องอ้าง evidence จาก source revision ล่าสุด
