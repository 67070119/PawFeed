# PawFeed — Course Container Verification

## Formal Environment

Target image:

```text
tuchsanai/devtools:2569_1
```

Phase 7 ตรวจจริงแล้วพบ Node.js `v22.23.1`, npm `12.0.1`, Docker `29.6.2`, Docker Compose `v5.3.1`, Git `2.54.0` และ curl `8.5.0` โดย image ใช้ `/workspace` และรองรับ Docker-in-Docker เมื่อรันแบบ privileged

## Verification

Core:

```bash
./scripts/course-container-test.sh
```

Full รวม Browser E2E:

```bash
COURSE_RUN_E2E=1 ./scripts/course-container-test.sh
```

Flow:

```text
clean source copy
→ npm ci
→ explicit Prisma generate
→ lint
→ unit tests
→ build
→ npm audit
→ integration + PostgreSQL
→ Docker Compose build/up
→ smoke
→ persistence after restart
→ Playwright E2E
→ cleanup
```

## Clean-source Rule

Repository ถูก mount read-only ที่ `/source` แล้ว copy ไป `/workspace/PawFeed` โดย exclude `.git`, `node_modules`, `.next` และ Playwright result folders จึงไม่พึ่ง runtime/build state จาก Mac mini

## npm 12 Compatibility

Course image ใช้ npm 12 จึงสั่ง `npx prisma generate` แบบ explicit หลัง `npm ci` ทั้ง Course script และ Jenkins pipeline

## Docker-in-Docker

```text
Host Docker
└── Course Container (privileged)
    └── dockerd
        ├── PawFeed Frontend
        ├── PawFeed Backend
        ├── PostgreSQL
        └── Playwright runner
```

## Phase 7 Result

Full run `COURSE_RUN_E2E=1` ผ่านจริง:

- Backend lint: PASS
- Unit: `11/11` PASS
- Backend build: PASS
- Backend audit: `0` high vulnerabilities
- Frontend lint: PASS
- Frontend build: PASS
- Frontend audit: `0` high vulnerabilities
- Integration: `4/4` PASS
- Compose build/up: PASS
- Smoke: PASS
- Persistence: PASS
- Playwright E2E: `6/6` PASS
- Cleanup: PASS
- Final exit code: `0`

Phase 8 จะเก็บ evidence จาก source revision รุ่นส่งจริง

## Port Conflict

Host ports override ได้ผ่าน `FRONTEND_PORT` และ `BACKEND_PORT` ห้าม hard-code ค่าเฉพาะเครื่องสมาชิกเพื่อให้ verification ผ่าน
