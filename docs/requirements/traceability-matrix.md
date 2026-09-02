# PawFeed — Traceability Matrix v1

เอกสารนี้เชื่อม Proposal/Requirement → Acceptance Criteria → Implementation → Verification → Evidence

Phase 8 reconcile สถานะจาก implementation, automated/runtime verification และ inspection จริง โดย `REQ-NFR-DEVOPS-003/004` คงเป็น `IMPLEMENTED` จนกว่าจะมี Jenkins job run จริงตาม Evidence Register

## Status Legend

- `BASELINED` — Requirement และ AC ถูกกำหนดแล้ว
- `IMPLEMENTED` — Implementation มีแล้ว แต่ยังไม่ได้ Verification ครบ
- `VERIFIED` — ผ่าน Verification ตาม AC และมี Evidence
- `DEFECT` — ผลจริงไม่ตรง AC
- `LIMITATION` — มีข้อจำกัดที่เปิดเผยและบันทึกชัดเจน

---

## 1. Functional Traceability

| Requirement | Acceptance Criteria | Implementation | Verification | Evidence | Status |
|---|---|---|---|---|---|
| REQ-AUTH-001 Register | AC-AUTH-001, AC-AUTH-002 | Backend Auth module + Register UI | T-AUTH-REGISTER-SUCCESS, T-AUTH-REGISTER-INVALID | EV-TEST-AUTH, EV-DEMO-AUTH | VERIFIED |
| REQ-AUTH-002 Login | AC-AUTH-003 | Auth API + Login UI | T-AUTH-LOGIN-SUCCESS | EV-TEST-AUTH, EV-DEMO-AUTH | VERIFIED |
| REQ-AUTH-003 Invalid Login | AC-AUTH-004 | Auth validation/error response + UI error | T-AUTH-LOGIN-WRONG | EV-TEST-AUTH | VERIFIED |
| REQ-AUTH-004 Logout | AC-AUTH-005 | Logout API + cookie clear + UI | T-AUTH-LOGOUT | EV-TEST-AUTH | VERIFIED |
| REQ-AUTH-005 Current User | AC-AUTH-003 | `GET /api/auth/me` + frontend auth state | T-AUTH-ME | EV-TEST-AUTH | VERIFIED |
| REQ-AUTH-006 Authentication Gate | AC-AUTH-006, AC-POINT-002, AC-FEED-004, AC-REPORT-004 | Auth middleware + protected routes/pages | T-AUTH-GATE, E2E-UNAUTHORIZED | EV-TEST-AUTH, EV-DEMO-FAILURE | VERIFIED |
| REQ-MAP-001 Public Map | AC-MAP-001 | Map page + Points API | E2E-MAP-LOAD | EV-E2E-MAIN | VERIFIED |
| REQ-MAP-002 Marker Interaction | AC-MAP-002 | Leaflet Marker + Point Preview/Detail navigation | E2E-MARKER-DETAIL | EV-E2E-MAIN | VERIFIED |
| REQ-MAP-003 Location Permission | AC-MAP-003 | Browser Geolocation Adapter + fallback | E2E-LOCATION-DENIED | EV-E2E-FAILURE | VERIFIED |
| REQ-MAP-004 Bounding Box Query | AC-MAP-004 | Points query service/repository | T-POINTS-BOUNDING-BOX | EV-TEST-POINT | VERIFIED |
| REQ-POINT-001 Create Point | AC-POINT-001, AC-POINT-002 | Point API/service + Create Point UI | T-POINT-CREATE, E2E-CREATE-POINT | EV-TEST-POINT, EV-E2E-MAIN | VERIFIED |
| REQ-POINT-002 Required Point Data | AC-POINT-001, AC-POINT-005 | Request schema + form validation | T-POINT-REQUIRED | EV-TEST-POINT | VERIFIED |
| REQ-POINT-003 Animal Type | AC-POINT-003 | Enum/schema validation | T-POINT-ANIMAL-TYPE | EV-TEST-POINT | VERIFIED |
| REQ-POINT-004 Coordinate Validation | AC-POINT-004 | Request validation | T-POINT-COORDINATE, E2E-INVALID-COORDINATE | EV-TEST-POINT, EV-DEMO-FAILURE | VERIFIED |
| REQ-POINT-005 Point Persistence | AC-POINT-001 | Prisma model + PostgreSQL | T-POINT-CREATE-READ | EV-TEST-POINT | VERIFIED |
| REQ-POINT-006 Point Appears on Map | AC-POINT-006 | Create → API → Map refresh/query | E2E-CREATE-POINT-MARKER | EV-E2E-MAIN, EV-DEMO-MAIN | VERIFIED |
| REQ-IMG-001 Required Point Image | AC-POINT-005 | Multipart upload + form requirement | T-IMAGE-REQUIRED | EV-TEST-IMAGE | VERIFIED |
| REQ-IMG-002 Image Type Validation | AC-IMG-001 | Upload MIME/signature validation | T-IMAGE-TYPE, E2E-NON-IMAGE | EV-TEST-IMAGE, EV-DEMO-FAILURE | VERIFIED |
| REQ-IMG-003 Image Size Validation | AC-IMG-002 | Configured upload limit | T-IMAGE-SIZE | EV-TEST-IMAGE | VERIFIED |
| REQ-IMG-004 Safe Filename | AC-IMG-003 | Server filename generator | T-IMAGE-FILENAME | EV-TEST-IMAGE | VERIFIED |
| REQ-IMG-005 Image Persistence | AC-IMG-004 | Persistent upload volume | T-PERSIST-IMAGE | EV-PERSISTENCE | VERIFIED |
| REQ-DETAIL-001 Public Point Detail | AC-DETAIL-001 | Point Detail API + page | E2E-POINT-DETAIL-GUEST | EV-E2E-MAIN | VERIFIED |
| REQ-DETAIL-002 Detail Data | AC-DETAIL-001 | Point detail query including image/feedings | T-POINT-DETAIL, E2E-POINT-DETAIL | EV-TEST-POINT, EV-E2E-MAIN | VERIFIED |
| REQ-DETAIL-003 Missing Point | AC-DETAIL-002 | 404 domain error + Not Found UI | T-POINT-NOT-FOUND | EV-TEST-POINT | VERIFIED |
| REQ-FEED-001 Create Feeding | AC-FEED-001, AC-FEED-004 | Feeding API/service + UI | T-FEED-CREATE, E2E-FEEDING | EV-TEST-FEED, EV-E2E-MAIN | VERIFIED |
| REQ-FEED-002 Feeding Relation | AC-FEED-001 | Prisma relation Point/User/Feeding | T-FEED-RELATION | EV-TEST-FEED | VERIFIED |
| REQ-FEED-003 Optional Note | AC-FEED-002 | Nullable note field + UI | T-FEED-NO-NOTE | EV-TEST-FEED | VERIFIED |
| REQ-FEED-004 Feeding History | AC-FEED-003 | Feeding query + Point Detail list | T-FEED-HISTORY, E2E-FEEDING | EV-TEST-FEED, EV-DEMO-MAIN | VERIFIED |
| REQ-FEED-005 Latest Feeding Time | AC-FEED-003 | Latest feeding query/calculation | T-FEED-LATEST | EV-TEST-FEED, EV-DEMO-MAIN | VERIFIED |
| REQ-FEED-006 Missing Point Rejection | AC-FEED-005 | Feeding service existence check | T-FEED-MISSING-POINT | EV-TEST-FEED | VERIFIED |
| REQ-REPORT-001 Submit Point Report | AC-REPORT-001, AC-REPORT-002, AC-REPORT-004 | Point Report API/service + UI | T-REPORT-STILL-HERE, T-REPORT-NOT-FOUND | EV-TEST-REPORT, EV-DEMO-MAIN | VERIFIED |
| REQ-REPORT-002 Report Relation | AC-REPORT-001, AC-REPORT-002 | Prisma PointReport relation | T-REPORT-RELATION | EV-TEST-REPORT | VERIFIED |
| REQ-REPORT-003 Last Seen Update | AC-REPORT-001 | Transaction/update service | T-REPORT-LAST-SEEN | EV-TEST-REPORT | VERIFIED |
| REQ-REPORT-004 Invalid Report Type | AC-REPORT-003 | Enum validation | T-REPORT-INVALID-TYPE | EV-TEST-REPORT | VERIFIED |
| REQ-NAV-001 In-Web Navigation | AC-NAV-001 | `/points/:id/navigate` + NavigationMap | Playwright critical flow | EV-E2E-MAIN, EV-DEMO-MAIN | VERIFIED |
| REQ-NAV-002 Location-assisted Navigation | AC-NAV-002 | Browser Geolocation + manual-position fallback | Playwright GPS/manual navigation | EV-E2E-MAIN, EV-ARCH | VERIFIED |
| REQ-NAV-003 Road Route Preview | AC-NAV-003 | Navigation API + OSRM adapter + road polyline | Unit routing + Playwright route/failure flow + live routing smoke | EV-TEST-NAV, EV-E2E-MAIN | VERIFIED |
| REQ-NAV-004 Travel Mode Preview | AC-NAV-004 | DRIVING/WALKING/CYCLING tabs + route recalculation | Playwright mode switching + live routing smoke | EV-TEST-NAV, EV-E2E-MAIN | VERIFIED |
| REQ-NAV-005 Active Navigation Mode | AC-NAV-005 | Active navigation state + maneuver/remaining metrics | Playwright active-navigation GPS movement flow | EV-E2E-ACTIVE-NAV | VERIFIED |
| REQ-NAV-006 Follow & Recenter | AC-NAV-006 | NavigationMap follow state + drag pause + recenter | Playwright active-navigation drag/recenter flow | EV-E2E-ACTIVE-NAV | VERIFIED |
| REQ-NAV-007 Off-route Detection & Automatic Rerouting | AC-NAV-007 | Route-deviation threshold + consecutive-fix debounce + reroute | Playwright off-route auto-reroute/retry flow | EV-E2E-NAV-RECOVERY | VERIFIED |
| REQ-NAV-008 GPS Quality & Recovery | AC-NAV-008 | GPS quality tiers + poor-accuracy guard + retry tracking | Playwright poor-GPS and GPS-loss recovery flows | EV-E2E-NAV-RECOVERY | VERIFIED |
| REQ-NAV-009 Mobile Navigation Sheet | AC-NAV-009 | Collapsible navigation bottom sheet | Playwright 390x844 collapse/expand flow | EV-E2E-NAV-RECOVERY | VERIFIED |
| REQ-PROFILE-001 Authenticated Profile | AC-PROFILE-001 | Protected Profile route/API | E2E-PROFILE-GATE | EV-E2E-PROFILE | VERIFIED |
| REQ-PROFILE-002 User Points | AC-PROFILE-002 | User Point query + Profile UI | T-PROFILE-POINTS | EV-TEST-PROFILE | VERIFIED |
| REQ-PROFILE-003 User Feedings | AC-PROFILE-003 | User Feeding query + Profile UI | T-PROFILE-FEEDINGS | EV-TEST-PROFILE | VERIFIED |

---

## 2. Non-Functional Traceability

| Requirement | Acceptance Criteria | Implementation | Verification | Evidence | Status |
|---|---|---|---|---|---|
| REQ-NFR-PERSIST-001 Database Persistence | AC-PERSIST-001 | PostgreSQL persistent volume | T-PERSIST-DB, Demo Restart | EV-PERSISTENCE, EV-DEMO-MAIN | VERIFIED |
| REQ-NFR-PERSIST-002 Upload Persistence | AC-IMG-004 | Upload persistent volume | T-PERSIST-IMAGE, Demo Restart | EV-PERSISTENCE | VERIFIED |
| REQ-NFR-DATA-001 No Mock in Critical Flow | AC-MAP-001 + Mandatory Demo Set | Real API/DB integration | E2E-MAIN-FLOW + runtime inspection | EV-E2E-MAIN, EV-DEMO-MAIN | VERIFIED |
| REQ-NFR-SEC-001 Password Hashing | AC-SEC-001 | Password hashing service | T-SEC-PASSWORD-HASH | EV-TEST-SECURITY | VERIFIED |
| REQ-NFR-SEC-002 HttpOnly Cookie | AC-SEC-002 | Auth cookie config | T-SEC-COOKIE | EV-TEST-SECURITY | VERIFIED |
| REQ-NFR-SEC-003 Secret Management | AC-SEC-003 | `.gitignore`, `.env.example`, runtime env | Repository inspection | EV-SECURITY-REVIEW | VERIFIED |
| REQ-NFR-PRIV-001 Location Privacy | AC-PRIV-001 | Client-only geolocation usage | Architecture/code review + E2E | EV-PRIVACY-REVIEW | VERIFIED |
| REQ-NFR-ERR-001 Validation Error on UI | AC-ERR-001 | Shared API error UI/form errors | E2E-INVALID-COORDINATE, E2E-NON-IMAGE | EV-DEMO-FAILURE | VERIFIED |
| REQ-NFR-ERR-002 API Failure on UI | AC-ERR-002 | Frontend request/error state | E2E-API-FAILURE | EV-E2E-FAILURE | VERIFIED |
| REQ-NFR-ERR-003 No Partial Success Claim | AC-ERR-002 | Success only after API confirmation | E2E-API-FAILURE | EV-E2E-FAILURE | VERIFIED |
| REQ-NFR-OPS-001 Health Endpoint | AC-OPS-001 | Backend `/health` endpoint | T-HEALTH, Smoke Test | EV-SMOKE, EV-CI | VERIFIED |
| REQ-NFR-OPS-002 Useful Logs | AC-OPS-002 | Request/error logging | Controlled error + log inspection | EV-OPS-LOG | VERIFIED |
| REQ-NFR-DEVOPS-001 Docker Compose Startup | AC-DEVOPS-001 | Dockerfiles + Compose | `docker compose up -d --build` + smoke | EV-DOCKER, EV-COURSE-CONTAINER | VERIFIED |
| REQ-NFR-DEVOPS-002 Repeatable Stop/Start | AC-DEVOPS-002 | Compose lifecycle + volumes | stop/start + persistence verification | EV-PERSISTENCE | VERIFIED |
| REQ-NFR-DEVOPS-003 Jenkins Verification | AC-DEVOPS-003 | Jenkinsfile | Successful pipeline run | EV-CI | IMPLEMENTED |
| REQ-NFR-DEVOPS-004 Fail Stops Delivery | AC-DEVOPS-004 | Jenkins stage dependencies | Intentional failing test/build run | EV-CI-FAILURE | IMPLEMENTED |
| REQ-NFR-DEVOPS-005 Course Container Compatibility | AC-DEVOPS-005 | Course verification script/docs | Clean run in `tuchsanai/devtools:2569_1` | EV-COURSE-CONTAINER | VERIFIED |

---

## 3. Main Demo Trace

| Demo Step | Requirement / AC | Expected Evidence |
|---|---|---|
| 1. เปิด Map | REQ-MAP-001 / AC-MAP-001 | Map + Marker จากข้อมูลจริง |
| 2. Login | REQ-AUTH-002 / AC-AUTH-003 | Authenticated UI state |
| 3. Create Point | REQ-POINT-001..005 / AC-POINT-001 | Form → API → Database |
| 4. Upload รูป | REQ-IMG-001..005 | File ถูก Validate/Store |
| 5. Marker ใหม่ขึ้น Map | REQ-POINT-006 / AC-POINT-006 | Marker จาก API หลัง Create |
| 6. Point Detail | REQ-DETAIL-001..002 | ข้อมูลที่สร้างแสดงครบ |
| 7. Navigate | REQ-NAV-001..009 / AC-NAV-001..009 | Navigation Mode ภายใน PawFeed แสดง Route Preview, Active Navigation, Maneuver, Follow/Recenter, GPS Quality และ Off-route Auto-reroute |
| 8. Feeding | REQ-FEED-001..005 | Feeding Record ถูกบันทึก |
| 9. Feeding History เปลี่ยน | AC-FEED-003 | Latest/History ก่อน-หลัง |
| 10. STILL_HERE | REQ-REPORT-001..003 | Report + Last Seen เปลี่ยน |
| 11. Restart | REQ-NFR-PERSIST-001..002 | Data + Image ยังอยู่ |

---

## 4. Failure Demo Trace

| Failure Case | Requirement / AC | Expected Result |
|---|---|---|
| Guest Create Point | REQ-AUTH-006 / AC-POINT-002 | Unauthorized/Login Required, ไม่มี DB mutation |
| Non-image Upload | REQ-IMG-002 / AC-IMG-001 | Reject + UI Error, ไม่มี Success State |
| Invalid Coordinate | REQ-POINT-004 / AC-POINT-004 | Validation Error + ไม่มี Point ใหม่ |

---

## 5. Evidence Locations Planned for Phase 8

```text
docs/evidence/
├── ci/
├── tests/
├── course-container/
├── persistence/
├── security/
└── demo/
```

Evidence ต้องมาจากรุ่น Source Code ที่ส่งจริง และต้องไม่ใช้ Screenshot/Log จากรุ่นเก่าที่ไม่ตรงกับ Commit ส่งงาน

---

## 6. Traceability Rules

1. Requirement ทุกข้อที่อยู่ใน Baseline ต้องมี Acceptance Criteria
2. Critical Requirement ต้องมี Automated Test หรือ E2E Test อย่างน้อยหนึ่งวิธี เว้นแต่เป็น Architecture/Process Requirement ที่เหมาะกับ Inspection/Runtime Verification มากกว่า
3. ทุก Feature ที่กล่าวใน Slide, Report หรือ Demo ต้องมี Requirement ID หรือถูกระบุว่าเป็น Future/Optional อย่างชัดเจน
4. เมื่อ Implementation เริ่ม ให้แทน Implementation ด้วย Path/Module จริง
5. เมื่อ Test ถูกสร้าง ให้แทน Verification ด้วยชื่อ Test File/Test Case จริง
6. Phase 8 ต้องเปลี่ยน Status ตามผลจริงเป็น VERIFIED / DEFECT / LIMITATION ห้ามตั้ง VERIFIED จากคำอธิบายอย่างเดียว
