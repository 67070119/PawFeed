# PawFeed — Docker & Reproducibility

## 1. Runtime Services

PawFeed ใช้ Docker Compose 3 services เท่านั้นใน MVP:

| Service | Image/Build | Port | หน้าที่ |
|---|---|---:|---|
| frontend | `./frontend/Dockerfile` | 3000 | Next.js UI และ same-origin proxy ไป Backend |
| backend | `./backend/Dockerfile` | 3001 | Express API, Auth, Upload, Health, Prisma migration |
| postgres | `postgres:17-alpine` | internal 5432 | Source of truth สำหรับข้อมูลหลัก |

## 2. Startup Dependency

ลำดับการขึ้นระบบ:

```text
postgres healthy
  ↓
backend starts → prisma migrate deploy → /health/ready healthy
  ↓
frontend starts → / healthy
```

Compose ใช้ health check และ `depends_on.condition: service_healthy` เพื่อไม่ให้ service หลักเริ่มก่อน dependency พร้อม

## 3. Same-origin API Proxy

Browser ใช้ PawFeed ผ่าน:

```text
http://localhost:3000
```

Frontend เรียก:

```text
/api/*
/uploads/*
/backend-health/*
```

Next.js rewrite ส่งต่อไปยัง `http://backend:3001` ภายใน Docker network

ข้อดี:
- Browser ไม่ต้องรู้ hostname ภายใน Docker
- HttpOnly auth cookie ทำงานแบบ same-origin
- ลด CORS dependency ใน Critical Flow
- ใช้รูปแบบเดียวกันได้ง่ายขึ้นใน Course Container แบบ Docker-in-Docker

Backend port 3001 ยัง publish สำหรับ health/debug verification โดยตรง

Host ports override ได้ผ่าน `.env` ด้วย `FRONTEND_PORT` และ `BACKEND_PORT` เพื่อหลีกเลี่ยง port conflict ใน Course Container

## 4. Persistence

Named volumes:

```text
postgres-data
pawfeed-uploads
```

`postgres-data` เก็บ PostgreSQL data directory

`pawfeed-uploads` mount ที่:

```text
/app/uploads
```

ใน Backend container

คำสั่งต่อไปนี้ **ไม่ลบข้อมูล**:

```bash
docker compose restart
docker compose down
docker compose up -d
```

คำสั่ง destructive reset เท่านั้นที่ลบ volume:

```bash
./scripts/reset.sh --yes
```

## 5. Standard Commands

Start + build + smoke test:

```bash
./scripts/start.sh
```

หรือ:

```bash
docker compose up -d --build
./scripts/smoke-test.sh
```

Stop โดยเก็บข้อมูล:

```bash
./scripts/stop.sh
```

ตรวจ status:

```bash
docker compose ps
```

ดู log:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

## 6. Smoke Verification

```bash
./scripts/smoke-test.sh
```

ตรวจอย่างน้อย:
1. Backend `/health/ready`
2. Frontend `/`
3. Frontend → Backend proxy ผ่าน `/backend-health/ready`

## 7. Persistence Verification

```bash
./scripts/verify-persistence.sh
```

Script นี้สร้างข้อมูลทดสอบจริงผ่าน API:
1. Register
2. Login ผ่าน HttpOnly cookie
3. Create Point พร้อม PNG
4. Create Feeding
5. Submit STILL_HERE
6. Restart PostgreSQL + Backend + Frontend
7. รอ health/smoke
8. Query Point เดิม
9. ตรวจ Feeding + Report
10. เปิดรูปเดิมจาก upload volume

ถือว่าผ่านเมื่อทั้ง Database records และไฟล์รูปยังอยู่หลัง restart

นอกจากนี้ Phase 6 ได้ตรวจแบบ:

```text
docker compose down
→ docker compose up -d
→ query fixture เดิม
```

และข้อมูลเดิมยังอ่านกลับได้ เนื่องจาก `down` ปกติไม่ลบ named volumes

## 8. Configuration

ค่าตัวอย่างอยู่ใน `.env.example`

สำหรับ Docker Compose มี development/demo defaults ที่ไม่ใช่ production secrets ผู้ใช้สามารถ override ผ่าน `.env` ได้

Production deployment ต้องเปลี่ยนอย่างน้อย:
- `JWT_ACCESS_SECRET`
- PostgreSQL password
- `COOKIE_SECURE=true` เมื่อให้บริการผ่าน HTTPS

ห้าม commit `.env` ที่มี credential จริง

## 9. Migration

Backend container รัน:

```bash
npx prisma migrate deploy
```

ก่อน start server ทุกครั้ง Migration เป็น idempotent deployment flow และ schema อยู่ใน repository

## 10. Cleanup Rule

- ปกติ: `docker compose down`
- ต้องการลบ environment และข้อมูลจริง: `./scripts/reset.sh --yes`
- ห้ามใช้ `down -v` ใน persistence demo เพราะเป็น explicit destructive operation
