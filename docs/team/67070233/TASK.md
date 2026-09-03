# TASK — 67070233

## Role
Backend Developer — Core API

## Goal
รับผิดชอบ Backend แกนหลักของ PawFeed ได้แก่ Authentication, Stray Point Core, Image Upload และ Profile โดยรักษา API contract เดิมที่ Frontend ใช้อยู่ และไม่เปลี่ยน shared behavior โดยไม่จำเป็น

## Primary Responsibilities

### 1. Authentication
ดูแล:
- Register / Login / Logout
- Current user (`GET /api/auth/me`)
- Password hashing
- HttpOnly authentication cookie
- Generic credential error
- Authorization middleware ที่เกี่ยวข้อง

ไฟล์หลัก:
```text
backend/src/modules/auth/auth.routes.js
backend/src/middlewares/auth.js
```

### 2. Stray Point Core
ดูแล:
- Create Point
- Get Point Detail
- Map/bounding-box Point query
- Coordinate validation
- animal type / estimated count / description / usual time
- ACTIVE point behavior ที่เกี่ยวข้อง

ไฟล์หลัก:
```text
backend/src/modules/points/points.routes.js
backend/src/utils/validation.js
```

### 3. Image Upload
ดูแล:
- JPEG / PNG / WebP allowlist
- MIME + binary signature validation
- upload size limit
- safe server filename
- orphan file cleanup เมื่อ database create ไม่สำเร็จ

ไฟล์หลัก:
```text
backend/src/utils/upload.js
backend/src/modules/points/points.routes.js
```

### 4. Profile Backend
ดูแล:
- My Points
- Profile API ที่มีอยู่
- query ต้อง scope ด้วย authenticated user จริง

ไฟล์หลัก:
```text
backend/src/modules/profile/profile.routes.js
```

### 5. Verification ของงานตัวเอง
เพิ่ม/ปรับ Unit หรือ Integration test ที่เกี่ยวข้องกับ Auth/Point/Profile/Upload โดยรักษา API contract เดิม

ไฟล์ที่อาจเกี่ยวข้อง:
```text
backend/tests/unit/
backend/tests/integration/
```

## Expected Deliverables
- Backend Core API ทำงานตาม Requirement เดิม
- ไม่มี plaintext password
- Upload validation ปลอดภัย
- Profile ไม่อ่านข้อมูลข้าม user
- Error response คาดเดาได้
- Unit/Integration ที่เกี่ยวข้องผ่าน

## Definition of Done
1. Backend lint ผ่าน
2. Unit tests ที่เกี่ยวข้องผ่าน
3. Integration tests ที่เกี่ยวข้องผ่าน
4. `git diff --check` ผ่าน
5. อธิบายได้ว่าแก้ Requirement/bug ใดและไฟล์ใดบ้าง
6. ไม่เปลี่ยน Frontend, Feeding, Report หรือ Navigation โดยไม่ประสานเจ้าของงาน

## Handoff
หากต้องเปลี่ยน shared API contract ให้ประสาน:
- Frontend: `67070119`
- Backend Feeding/Report/Navigation: `67070269`
- Tester/CI-CD: `67070151`
