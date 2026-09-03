# TASK — 67070269

## Role
Backend Developer — Feeding, Report & Navigation

## Goal
รับผิดชอบ Backend feature หลัง Point ถูกสร้างแล้ว ได้แก่ Feeding, Point Report และ Navigation/Routing โดยรักษา API contract เดิมและจัดการ external routing failure อย่างปลอดภัย

## Primary Responsibilities

### 1. Feeding
ดูแล:
- Create Feeding
- Feeding note
- Feeding history
- Latest feeding state
- ความสัมพันธ์ Feeding → Point → User

ไฟล์หลัก:
```text
backend/src/modules/feedings/feedings.routes.js
```

### 2. Point Report
ดูแล:
- `STILL_HERE`
- `NOT_FOUND`
- report validation
- `STILL_HERE` update `lastSeenAt` ตาม business rule เดิม
- ไม่เพิ่ม auto-inactive โดยไม่มี Requirement

ไฟล์หลัก:
```text
backend/src/modules/reports/reports.routes.js
```

### 3. Navigation API
ดูแล:
- `GET /api/navigation/route`
- validate origin/destination
- validate travel mode
- geometry / distance / duration
- route steps / maneuver data
- normalize provider response ให้ Frontend ใช้งานได้

ไฟล์หลัก:
```text
backend/src/modules/navigation/navigation.routes.js
backend/src/modules/navigation/navigation.service.js
```

### 4. Routing Provider Reliability
ดูแล:
- DRIVING / WALKING / CYCLING
- timeout
- transient retry
- no-route/provider failure
- ไม่คืน road route ปลอมเมื่อ provider fail
- controlled error ให้ Frontend fallback ได้

### 5. Shared Backend ที่เกี่ยวข้อง
อาจเกี่ยวข้องกับ:
```text
backend/src/config/env.js
backend/src/middlewares/error-handler.js
backend/src/utils/app-error.js
backend/src/utils/response.js
```
ให้แก้เฉพาะเมื่อจำเป็นกับ Feeding/Report/Navigation และต้องระวังไม่เปลี่ยน Core API โดยไม่ประสาน

### 6. Verification ของงานตัวเอง
เพิ่ม/ปรับ Unit หรือ Integration tests สำหรับ Feeding/Report/Navigation ตาม behavior จริง

ไฟล์ที่อาจเกี่ยวข้อง:
```text
backend/tests/unit/navigation.test.js
backend/tests/integration/critical-flow.test.js
```

## Expected Deliverables
- Feeding/Report ใช้ PostgreSQL จริง
- Navigation คืน road geometry/distance/duration/steps ตาม contract
- Travel modes ทำงานตาม provider ที่ configure
- Provider failure เป็น controlled error
- Retry ไม่ยิง provider ไม่จำกัด
- ไม่มี fake success/fake road route

## Definition of Done
1. Backend lint ผ่าน
2. Navigation Unit tests ผ่าน
3. Integration Feeding/Report ผ่าน
4. Routing failure cases ผ่าน
5. `git diff --check` ผ่าน
6. ไม่เปลี่ยน Auth/Point/Profile contract โดยไม่ประสาน

## Handoff
หากต้องเปลี่ยน API contract ให้ประสาน:
- Backend Core: `67070233`
- Frontend: `67070119`
- Tester/CI-CD: `67070151`
