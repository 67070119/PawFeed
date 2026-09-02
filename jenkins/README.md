# PawFeed Jenkins CI/CD

ไฟล์ `Jenkinsfile` ที่ root คือ Pipeline as Code สำหรับ PawFeed

## Agent Requirements

Jenkins agent ที่ใช้รัน pipeline ต้องมี:

- Node.js 22
- npm
- Docker Engine
- Docker Compose plugin
- Git
- curl
- สิทธิ์ใช้งาน Docker daemon
- Internet access สำหรับดึง npm packages, Docker images และ Playwright image

Environment ที่อ้างอิงและตรวจแล้วคือ `tuchsanai/devtools:2569_1` ซึ่งมี Node.js 22 และ Docker-in-Docker พร้อมใช้งาน

## Pipeline Gates

ลำดับใน `Jenkinsfile`:

1. Checkout
2. Install + explicit `prisma generate`
3. Backend/Frontend Lint
4. Backend Unit Tests
5. PostgreSQL Integration Tests
6. Backend/Frontend Build
7. npm Security Audit
8. Docker Compose Build + Start + Smoke Test
9. Persistence Verification
10. Browser E2E ด้วย Playwright
11. Cleanup ใน `post { always { ... } }`

Jenkins Declarative Pipeline จะหยุด stage ถัดไปทันทีเมื่อคำสั่ง `sh` ใดคืน exit code ที่ไม่ใช่ 0 ดังนั้น test/build/audit failure จะไม่ถูกนับเป็น delivery success

## Recommended Jenkins Job

สร้าง Multibranch Pipeline หรือ Pipeline from SCM แล้วชี้ repository ไปที่ PawFeed โดยใช้ `Jenkinsfile` จาก root repository

ไม่ควรคัดลอก pipeline commands ไปเขียนใน Jenkins UI เพราะจะทำให้ configuration แตกต่างจาก source code ที่ส่ง

## Local Equivalent Checks

คำสั่งหลักที่ Jenkins ใช้สามารถตรวจจาก repository ได้ด้วย:

```bash
cd backend && npm ci --no-audit --no-fund && npx prisma generate
cd backend && npm run lint && npm test && npm run build && npm audit --audit-level=high
cd frontend && npm ci --no-audit --no-fund
cd frontend && npm run lint && npm run build && npm audit --audit-level=high
./scripts/test-integration.sh
./scripts/test-e2e.sh
```

Full Course Container verification:

```bash
COURSE_RUN_E2E=1 ./scripts/course-container-test.sh
```

## Evidence

Phase 8 ต้องเก็บ evidence จาก Jenkins run จริง เช่น:

- Successful pipeline
- Stage view / console log
- Commit SHA ที่ pipeline ตรวจ
- Intentional failure run ที่แสดงว่า pipeline หยุดเมื่อ gate fail

ห้ามใช้ผลจาก source revision คนละรุ่นกับ commit ที่ส่งงาน
