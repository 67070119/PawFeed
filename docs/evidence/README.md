# PawFeed — Evidence Register

Evidence ในโฟลเดอร์นี้อ้างถึงผล verification ของ source รุ่น Phase 8 โดยเน้นผลสรุปและคำสั่งที่ทำซ้ำได้ แทนการ commit raw log ขนาดใหญ่

## Evidence IDs

| Evidence ID | Evidence |
|---|---|
| EV-TEST-AUTH | `backend/tests/integration/critical-flow.test.js`, Unit/Integration summary |
| EV-TEST-POINT | Integration critical flow + validation tests |
| EV-TEST-IMAGE | Upload unit tests + Integration size/type/filename tests |
| EV-TEST-FEED | Integration feeding tests |
| EV-TEST-REPORT | Integration report tests |
| EV-TEST-PROFILE | Integration profile tests |
| EV-TEST-SECURITY | Password hash + HttpOnly cookie integration assertions |
| EV-E2E-MAIN | `tests/e2e/critical-flow.spec.js` |
| EV-E2E-ACTIVE-NAV | `tests/e2e/active-navigation.spec.js` — Start/Stop, GPS progress, maneuver, drag pause, Recenter, arrival |
| EV-E2E-FAILURE | `tests/e2e/failure-cases.spec.js` |
| EV-E2E-PROFILE | Critical browser flow profile assertions |
| EV-SMOKE | `scripts/smoke-test.sh` |
| EV-PERSISTENCE | `scripts/verify-persistence.sh` + Phase 6 down/up verification |
| EV-DOCKER | `docker-compose.yml`, Dockerfiles, smoke result |
| EV-COURSE-CONTAINER | `scripts/course-container-test.sh` + course-container summary |
| EV-SECURITY-REVIEW | `.gitignore`, `.env.example`, auth/upload/security implementation inspection |
| EV-PRIVACY-REVIEW | Browser-only geolocation implementation + denied-permission E2E |
| EV-OPS-LOG | Request log middleware + test execution logs |
| EV-ARCH | `docs/architecture/` |
| EV-DEMO-MAIN | `docs/verification/demo-scenario.md` |
| EV-DEMO-FAILURE | `docs/verification/failure-cases.md` |
| EV-CI | `Jenkinsfile` + Jenkins job evidence pending |
| EV-CI-FAILURE | Controlled Jenkins failing-run evidence pending |

## Important Status

Automated/runtime evidence is available and repeatable. Jenkins Pipeline as Code is implemented, but `EV-CI` and `EV-CI-FAILURE` must receive screenshots/build URLs or exported console logs from a real Jenkins server before the two Jenkins-specific Requirements are marked VERIFIED.
