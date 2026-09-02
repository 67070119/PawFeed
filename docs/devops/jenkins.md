# PawFeed — Jenkins CI/CD Pipeline

## Purpose

`Jenkinsfile` เป็น Pipeline as Code หลักของ PawFeed ทุก gate ต้องผ่านก่อน stage ถัดไป หากคำสั่งบังคับคืน exit code != 0 pipeline ต้อง fail และไม่ถือว่า delivery สำเร็จ

## Agent Requirements

- Node.js 22.x + npm
- Docker Engine + Docker Compose
- Git, `sh`, `curl`
- สิทธิ์ใช้ Docker daemon
- Internet access สำหรับ npm/Docker/Playwright images

Course Container `tuchsanai/devtools:2569_1` ถูกตรวจจริงใน Phase 7 และรองรับ Node.js 22 + Docker-in-Docker

## Pipeline Stages

1. Checkout
2. Install: backend/frontend `npm ci` + explicit `prisma generate`
3. Lint: Backend + Frontend ESLint
4. Unit Test: Jest
5. Integration Test: PostgreSQL 17 จริง + Prisma migration
6. Application Build: Backend check + Next.js production build
7. Security Audit: `npm audit --audit-level=high`
8. Docker Compose Verification: config/build/up + smoke
9. Persistence Verification: DB + Upload หลัง restart
10. Browser E2E: Playwright Chromium + failure UI

## Fail Gate

Declarative Pipeline ใช้ `sh` โดยตรง ดังนั้น failure จะหยุด pipeline เช่น:

```text
Integration Test FAIL
→ Pipeline FAIL
→ Build/Compose/Persistence/E2E ไม่ถูกนับว่าสำเร็จ
```

Phase 8 จะเก็บ Jenkins run จริงทั้ง successful run และ intentional failure run เป็น evidence ของ `REQ-NFR-DEVOPS-003/004`

## Cleanup

`post { always { ... } }` cleanup main Compose, integration project และ E2E project แม้ pipeline fail โดย CI volumes เป็น disposable และถูกลบด้วย `down -v`

## Security

Production secret ต้องมาจาก Jenkins Credentials/Environment ห้ามเก็บใน `Jenkinsfile` และ log ห้ามพิมพ์ Password/JWT/Cookie

## Related Files

```text
Jenkinsfile
jenkins/README.md
scripts/test-integration.sh
scripts/test-e2e.sh
scripts/smoke-test.sh
scripts/verify-persistence.sh
scripts/course-container-test.sh
```
