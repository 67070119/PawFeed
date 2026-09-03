# TASK — 67070151

## Role
Tester & CI/CD Engineer

## Goal
รับผิดชอบการพิสูจน์ว่า PawFeed ทำงานจริงและทำซ้ำได้ ตั้งแต่ Unit, Integration, Browser E2E, Docker/Persistence, Jenkins และ Course Container โดย test ต้องตรวจ behavior จริง ไม่แก้ production feature เพื่อหลบ failure

## Primary Responsibilities

### 1. Backend Unit Test
ดูแล test สำหรับ:
- validation
- upload safety
- navigation validation/normalization
- auth/HTTP baseline
- privacy/logging safeguards

ไฟล์หลัก:
```text
backend/tests/unit/
```

### 2. Backend Integration Test
ดูแล flow ที่ใช้ PostgreSQL จริง:
- Register/Login
- Point Create/Query
- Feeding
- Report
- Profile
- Upload/Auth failure

ไฟล์หลัก:
```text
backend/tests/integration/
scripts/test-integration.sh
docker-compose.test.yml
```

### 3. Browser E2E
ดูแล Playwright:
- Critical user flow
- Route Preview
- Active Navigation
- GPS mock
- Off-route/reroute
- GPS loss/recovery
- Routing provider failure
- Mobile viewport
- no false success

ไฟล์หลัก:
```text
tests/e2e/
tests/routing-mock/
scripts/test-e2e.sh
docker-compose.e2e.yml
```

### 4. Runtime / Docker Verification
ดูแล:
```text
scripts/smoke-test.sh
scripts/smoke-routing.sh
scripts/verify-persistence.sh
scripts/start.sh
scripts/stop.sh
scripts/reset.sh
```
ตรวจ smoke, live routing, persistence, lifecycle และ cleanup

### 5. Jenkins / CI-CD
ดูแล `Jenkinsfile` ให้มี mandatory gates เช่น:
- Checkout
- Install
- Lint
- Unit
- Integration
- Build
- Docker/Compose verification
- Smoke/E2E ตาม pipeline design
- stage สำคัญ fail ต้องทำให้ pipeline fail

### 6. Course Container
ดูแล verification ใน:
```text
tuchsanai/devtools:2569_1
```

ไฟล์หลัก:
```text
scripts/course-container-test.sh
docs/devops/
```

### 7. Verification & Evidence
อัปเดตผล verification ให้ตรง source revision ล่าสุด:
```text
docs/verification/
docs/evidence/
```

## Expected Deliverables
- Tests repeatable และ deterministic เท่าที่ทำได้
- E2E ไม่พึ่ง public routing provider โดยตรง
- Live routing smoke แยกจาก deterministic E2E
- CI fail เมื่อ mandatory verification fail
- Course Container clean verification ได้
- Evidence numbers ตรงผลจริง
- ไม่ลด assertion เพื่อซ่อน defect

## Definition of Done
1. Unit/Integration/E2E runner ทำงานได้
2. Test cleanup ไม่มี container ค้าง
3. Mandatory failure exit non-zero
4. ไม่มี fake success ใน test
5. Evidence ตรง source revision
6. `git diff --check` ผ่าน

## Defect Handoff
เมื่อพบ production defect ให้ส่งต่อเจ้าของ:
- Frontend → `67070119`
- Backend Core → `67070233`
- Feeding/Report/Navigation → `67070269`
