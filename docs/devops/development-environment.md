# PawFeed — Development Environment

## 1. Baseline

PawFeed ต้องพัฒนาและตรวจสอบได้โดยไม่พึ่ง Environment เฉพาะเครื่องสมาชิก

Baseline:
- Node.js 22
- npm + lockfile
- Docker Engine
- Docker Compose v2
- PostgreSQL ผ่าน container
- Timezone baseline: `Asia/Bangkok`

Formal verification target:
- Course Container image `tuchsanai/devtools:2569_1`
- Docker-in-Docker ตามข้อกำหนดรายวิชา

## 2. Application Ports

Development defaults:

| Component | Host Port | Container/Internal Port |
|---|---:|---:|
| Frontend | 3000 | 3000 |
| Backend | 3001 | 3001 |
| PostgreSQL | optional host expose | 5432 |

Host-facing port should remain configurable so Course Container can avoid conflicts.

## 3. Environment Variables

Source template: root `.env.example`

Current baseline:

```text
NODE_ENV=development
TZ=Asia/Bangkok
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_ACCESS_SECRET=change-me
JWT_ACCESS_EXPIRES_IN=15m
POSTGRES_DB=pawfeed
POSTGRES_USER=pawfeed
POSTGRES_PASSWORD=change-me
DATABASE_URL=postgresql://pawfeed:change-me@postgres:5432/pawfeed?schema=public
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=5
```

Rules:
- `.env.example` contains only safe placeholders
- `.env` is ignored by Git
- required secret must not silently fall back to insecure production-like default
- frontend public variables must not contain secrets

## 4. Planned Package Layout

```text
frontend/
├── package.json
├── package-lock.json
├── Dockerfile
└── src/

backend/
├── package.json
├── package-lock.json
├── Dockerfile
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── src/
```

Application package initialization occurs in Phase 4–5. Phase 3 only locks the design and environment contract.

## 5. Local Development Modes

### Preferred reproducible mode

Final target:

```bash
docker compose up -d --build
```

All required dependencies start from repository configuration.

### Developer hot-reload mode

May be added later for convenience, but it must not become the only way to run the project. Formal verification uses the reproducible container path.

## 6. Database Environment

- PostgreSQL service hostname inside Compose: `postgres`
- database: `pawfeed`
- application connects through `DATABASE_URL`
- migrations are repository-controlled through Prisma
- data persists through named volume

Developers must not depend on a manually prepared host PostgreSQL database.

## 7. Upload Environment

Inside backend container:

```text
UPLOAD_DIR=/app/uploads
```

`/app/uploads` will be backed by a persistent named volume in Phase 6.

Rules:
- application creates/validates required directory at startup where appropriate
- test environment may use isolated temporary storage
- upload test artifacts must not pollute repository

## 8. Frontend ↔ Backend Configuration

Browser-facing API default:

```text
http://localhost:3001
```

CORS allow origin default:

```text
http://localhost:3000
```

Both are configuration values, not constants spread throughout source code.

## 9. Development Commands Contract

By the end of implementation, each package should provide predictable scripts such as:

Frontend:

```text
npm run dev
npm run lint
npm test
npm run build
```

Backend:

```text
npm run dev
npm run lint
npm test
npm run build/check if applicable
npm run prisma:migrate / equivalent controlled migration command
```

Exact names may be adjusted in implementation, but root README/Jenkins must match actual scripts.

## 10. Health Contract

Backend:

```text
GET /health/live
GET /health/ready
```

Final Compose healthcheck should use a command available inside the runtime image or a Node-based check rather than assume host-only utilities exist.

Frontend smoke verification should confirm the web page responds after backend/database readiness.

## 11. Course Container Compatibility Rules

The submitted repository must not require:
- GUI-only setup
- globally installed framework CLI
- host-specific absolute path
- existing local database
- untracked runtime file
- manually created Docker network/volume without documented setup

Verification should be scriptable from a fresh checkout.

## 12. Planned Reproducibility Scripts

Phase 6–7 target:

```text
scripts/start.sh
scripts/stop.sh
scripts/reset.sh
scripts/smoke-test.sh
scripts/verify.sh
scripts/course-container-test.sh
```

`reset.sh` must clearly distinguish normal stop/restart from destructive data cleanup.

## 13. Git Workflow Baseline

- `main` represents integration/submission-ready direction
- feature work should use meaningful commits/branches/PRs according to team workflow
- repository history should preserve evidence of real development/review
- secrets and generated runtime data never committed

Branch protection/PR settings are repository administration decisions and should be documented if enabled.

## 14. Definition of Environment Ready

Phase 3 environment design is considered ready when:
- stack and versions are defined
- ports and environment variables are consistent
- state ownership/persistence targets are defined
- no host-specific dependency is required by design
- Course Container constraints are considered before coding

Actual Docker runtime verification is intentionally Phase 6–7 work and is not claimed complete here.
