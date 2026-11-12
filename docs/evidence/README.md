# PawFeed — Evidence Register

Evidence ในโฟลเดอร์นี้อ้างถึงผล verification ของ source revision ล่าสุด โดยเน้นผลสรุปและคำสั่งที่ทำซ้ำได้ แทนการ commit raw log ขนาดใหญ่

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
| EV-TEST-NAV | `backend/tests/unit/navigation.test.js` + routing API validation/normalization |
| EV-LIVE-ROUTING | `scripts/smoke-routing.sh` — live DRIVING/WALKING/CYCLING provider smoke |
| EV-E2E-MAIN | `tests/e2e/critical-flow.spec.js` |
| EV-E2E-ACTIVE-NAV | `tests/e2e/active-navigation.spec.js` — Start/Stop, GPS progress, maneuver, drag pause, Recenter, arrival |
| EV-E2E-NAV-RECOVERY | `tests/e2e/active-navigation.spec.js` — off-route reroute, poor GPS guard, reroute retry, GPS recovery, mobile sheet, 375×667/390×844/430×932 layout guards |
| EV-E2E-FAILURE | `tests/e2e/failure-cases.spec.js` |
| EV-E2E-PROFILE | Critical browser flow profile assertions |
| EV-SMOKE | `scripts/smoke-test.sh` |
| EV-PERSISTENCE | `scripts/verify-persistence.sh` + Phase 6 down/up verification |
| EV-DOCKER | `docker-compose.yml`, Dockerfiles, smoke result |
| EV-COURSE-CONTAINER | `scripts/course-container-test.sh` + course-container summary |
| EV-SECURITY-REVIEW | `.gitignore`, `.env.example`, auth/upload/security implementation inspection |
| EV-PRIVACY-REVIEW | Session-scoped geolocation/routing flow + no-location-history persistence + query-stripped request-log unit assertion + denied/GPS-recovery E2E |
| EV-OPS-LOG | Request log middleware + test execution logs |
| EV-ARCH | `docs/architecture/` |
| EV-DEMO-MAIN | `docs/verification/demo-scenario.md` |
| EV-DEMO-AUTH | Register/Login steps in `docs/verification/demo-scenario.md` + browser critical flow |
| EV-DEMO-FAILURE | `docs/verification/failure-cases.md` |
| EV-CI | `PawFeed-Evidence.zip`: #13 auto-trigger SUCCESS, #14 full Verify/Publish/Deploy SUCCESS; source `185336097f42445c3d08fad69b1efdbb2920af4a` |
| EV-CI-FAILURE | `PawFeed-Evidence.zip`: #8 FAILURE_DEMO=true, assertion failure blocks Publish/Deploy; source diff documents unchanged code/pipeline |

## Important Status

Docker/Jenkins evidence is collected and verified from existing exported logs/artifacts. `REQ-NFR-DEVOPS-003/004/005` are VERIFIED for the recorded code/pipeline. The ZIP includes `SUBMISSION-SUMMARY.txt`, metadata, console logs, test reports, public registry snapshots and checksums. Build #8 used `0dfe66844bbd1d98a967d21bbd31539546cbe8fb`; #13/#14 used `185336097f42445c3d08fad69b1efdbb2920af4a`. Only two evidence-documentation lines differ; the Git diff is included. No new builds/tests were run to update these documents.

หลักฐาน Jenkins และ Docker Hub จัดเก็บแยกไว้ในโฟลเดอร์ PawFeed-Evidence.
