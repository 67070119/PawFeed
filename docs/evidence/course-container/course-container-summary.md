# Course Container Evidence

Target environment:

```text
tuchsanai/devtools:2569_1
```

Final Navigation Redesign Phase 5 command:

```bash
COURSE_RUN_E2E=1 ./scripts/course-container-test.sh
```

Final result: **PASS / exit code 0**

Verified inside a clean working copy in the Course Container:

- Backend dependency install + explicit Prisma Client generation
- Backend lint
- Unit tests: **15/15 PASS** across 4 suites
- Backend build + npm audit
- Frontend dependency install
- Frontend lint + production build + npm audit
- PostgreSQL Integration tests: **7/7 PASS**
- Docker Compose build/up
- Health / Smoke verification
- Database + Upload persistence after restart
- Playwright Browser E2E: **16/16 PASS**
- Navigation mobile viewports: **375×667, 390×844, 430×932 PASS**
- Navigation recovery flows: off-route reroute, poor GPS, routing retry and GPS recovery PASS
- Cleanup

The source copy excludes host `.git`, `node_modules`, `.next` and prior Playwright reports, so the result does not depend on Mac mini build artifacts.

Live public routing is verified separately with `./scripts/smoke-routing.sh` because Course Container E2E intentionally uses the deterministic routing mock and must not depend on public-provider availability.
