# PawFeed — Failure Modes

## 1. Purpose

รายการนี้กำหนด Failure Mode ที่สำคัญและพฤติกรรมที่ระบบควรแสดง เพื่อให้ Architecture, Error Handling, Automated Test และ Demo ใช้เกณฑ์เดียวกัน

## 2. Authentication Failures

| Failure | Backend behavior | User-visible behavior |
|---|---|---|
| Wrong email/password | `401`, generic error | แจ้งว่าอีเมลหรือรหัสผ่านไม่ถูกต้อง |
| Missing auth cookie on protected action | `401` | แจ้งให้เข้าสู่ระบบ / redirect login |
| Invalid/expired auth | `401`, clear/reject session as appropriate | กลับสู่สถานะ guest และแจ้งให้ login ใหม่ |
| Duplicate registration email | `409` | แจ้งว่าไม่สามารถใช้อีเมลนี้สมัครได้ โดยไม่แสดง DB detail |

## 3. Point Creation Failures

| Failure | Behavior |
|---|---|
| Missing required field | `400`, no Point created |
| Invalid animal type | `400` |
| estimatedCount < 1 | `400` |
| Invalid latitude/longitude | `400`, no Point created |
| No image | `400`, no Point created |
| Non-image upload | reject request; no Point created |
| Oversized upload | reject request; no Point created |
| DB failure after file write | return controlled failure and cleanup orphan file when possible |
| Storage write failure | no DB Point should be committed as successful |

Frontend must keep useful form state where practical and show the validation/error near the action.

## 4. Map Failures

### Geolocation denied
System remains usable:
- show permission/error notice
- do not block map
- allow manual pan/zoom and manual coordinate selection

### OpenStreetMap tile/network failure
Application shell and known Point data should not crash. UI may show map loading/error state and allow retry. PawFeed cannot guarantee external tile service availability.

### Invalid bounding box query
Backend returns controlled `400`, not server crash.

## 5. Point Detail Failures

### Point not found
- Backend: `404`
- Frontend: explicit not-found state + action back to map

### Point image unavailable
- Show fallback/placeholder instead of breaking entire detail page
- Log enough server/client context for diagnosis without exposing filesystem path

## 6. Feeding Failures

| Failure | Behavior |
|---|---|
| Anonymous feeding | `401`, no record created |
| Point not found | `404` |
| Invalid note/body | `400` |
| Database unavailable | controlled error; UI must not claim feeding saved |
| User retries after uncertain network result | UI should refresh latest history before presenting final state; implementation should avoid blindly duplicating action where practical |

MVP does not promise a fully idempotent feeding API unless added later to Requirement Baseline.

## 7. Point Report Failures

- anonymous → `401`
- invalid report enum → `400`
- point not found → `404`
- DB failure → no success UI

Repeated NOT_FOUND does not automatically inactivate Point in v1.

## 8. Database Unavailable

Expected:
- `/health/live` can remain `200` while process is alive
- `/health/ready` becomes `503`
- data-dependent API returns controlled service/internal error
- frontend shows temporary unavailable/retry state
- no false success state

Recovery:
- when PostgreSQL becomes healthy, backend should resume without requiring source changes

## 9. Upload Storage Unavailable

Create Point requiring image must fail safely rather than create a Point whose mandatory image cannot be read.

Read failure for an existing image should degrade to image placeholder while Point metadata can still load if DB is available.

## 10. In-Web Navigation / Geolocation / Routing Failure

หากผู้ใช้ไม่อนุญาต Geolocation หรือ browser ไม่รองรับ หน้า Navigation ต้องยังแสดงจุดหมายและให้เลือกตำแหน่งเริ่มต้นบนแผนที่ได้

หาก Routing Provider timeout, network fail หรือไม่พบเส้นทาง Backend ต้องคืน controlled error. Frontend ต้องแสดง Error State และอาจใช้เส้นตรงเป็น fallback เพื่ออ้างอิงเท่านั้น โดยต้องไม่แสดง Route Distance/ETA หรือ Road Polyline หลอกว่า provider คำนวณสำเร็จ

หาก OpenStreetMap tile โหลดไม่ได้ ข้อมูล Point, พิกัด และ route summary ที่ได้รับแล้วต้องไม่ถูกตีความเป็นข้อมูลหายจาก Database

## 11. Frontend ↔ Backend Network Failure

Frontend behavior:
- stop loading indicator eventually
- show clear retryable error
- do not report operation successful without successful API result
- prevent accidental duplicate submission while request is actively pending

## 12. Docker / Startup Failures

### PostgreSQL not ready yet
Backend readiness must fail until database connection succeeds. Compose health/dependency strategy in Phase 6 should prevent verification from treating a half-started stack as ready.

### Missing required environment variable
Application should fail fast with clear server log instead of starting with insecure/default secret.

### Port conflict
Host-facing ports must be configurable. Course Container verification should document chosen ports.

## 13. Jenkins Failure Policy

Expected pipeline rule:

```text
Checkout
→ Install
→ Lint
→ Test
→ Build
→ Compose Verification
→ Health/Smoke
```

Any required stage failure stops delivery verification. Pipeline must not mark deployment successful when tests fail.

## 14. Failure Cases Selected for Live Demo

Primary failure evidence:
1. Anonymous Create Point → `401` + Login-required UI
2. Non-image upload → Reject + visible validation
3. Invalid coordinate → Reject + visible validation

Optional additional demo:
4. Stop database temporarily → readiness failure / controlled unavailable state

## 15. Known External Dependencies

| Dependency | Risk | Mitigation |
|---|---|---|
| OpenStreetMap tiles | network/service unavailable | UI error/fallback; core DB data preserved |
| Browser Geolocation | permission denied/unsupported | Navigation/Map ยังแสดงจุดหมายได้โดยไม่ใช้ตำแหน่งผู้ใช้ |


## 16. Verification Principle

A handled failure must be visible in the system behavior, preferably UI + API/test evidence. A server log alone is not sufficient proof for the important user-facing failure cases required by the Mini Project criteria.
