# PawFeed Backend

Express REST API สำหรับ PawFeed MVP

## Runtime Baseline

- Node.js >= 22.12
- Express 5
- Prisma ORM 6.12
- PostgreSQL
- JWT authentication ผ่าน HttpOnly cookie
- Multer 2.3 สำหรับ point image upload

## Commands

```bash
npm install
npm run prisma:generate
npm run prisma:validate
npm test
npm start
```

`DATABASE_URL` ต้องถูกกำหนดเมื่อต้องใช้ Prisma validation/migration/runtime ที่เชื่อม database

## Main Routes

```text
GET  /health/live
GET  /health/ready

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET   /api/points?minLat=&maxLat=&minLng=&maxLng=
GET   /api/points/:id
POST  /api/points
PATCH /api/points/:id

GET  /api/points/:id/feedings
POST /api/points/:id/feedings
POST /api/points/:id/reports

GET /api/profile/points
GET /api/profile/feedings
```

## Upload Rules

Point creation requires exactly one image in field `image` for MVP.

Accepted content:
- JPEG
- PNG
- WebP

The backend checks both declared MIME type and file signature, generates a UUID filename, and never stores the client filename directly.

## Authentication

Cookie name: `pawfeed_access`

Baseline:
- HttpOnly
- SameSite=Lax
- Secure in production
- HS256 JWT
- default access expiry 15 minutes

Password baseline:
- 8–128 characters
- at least one letter
- at least one number
- bcrypt cost 12 before database write

## Database

Schema:

```text
prisma/schema.prisma
```

Initial migration:

```text
prisma/migrations/0001_init/migration.sql
```

Entities:
- User
- StrayPoint
- PointImage
- Feeding
- PointReport

## Phase 4 Test Boundary

Phase 4 contains unit/HTTP baseline tests that do not require a running PostgreSQL instance, covering validation, upload signatures, liveness and authentication gates.

Full database integration, Docker Compose verification and E2E tests are intentionally deferred to Phase 6–7.
