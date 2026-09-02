# PawFeed — Failure Cases

## Mandatory Demo Failures

### 1. Guest Create Point
- เปิด `/points/create` โดยยังไม่ Login
- Expected: redirect ไป Login
- Backend write endpoint ยัง reject `401` หากยิงตรง
- Evidence: Playwright failure case + Integration test

### 2. Non-image Upload
- Login แล้วอัปโหลดไฟล์ที่ไม่ใช่รูป
- Expected: Backend reject `415`, UI แสดง error และไม่ redirect ไป Success
- Evidence: Integration + Playwright

### 3. Invalid Coordinate
- ส่ง latitude นอกช่วง เช่น `999`
- Expected: `400 VALIDATION_ERROR`, ไม่มี Point ใหม่
- Evidence: Integration test

## Additional Verified Failures

- Wrong password → `401 INVALID_CREDENTIALS` แบบ generic
- Missing image → UI error ก่อน Success state
- Oversized image > configured limit → `413 FILE_TOO_LARGE`
- Invalid report type → `400`
- Missing point → `404 POINT_NOT_FOUND`
- API/network failure ระหว่าง Create → UI error และไม่แสดง false success
- Routing Provider failure → UI แสดง fallback/error โดยไม่วาด Road Route ปลอม
- Automatic reroute failure → คง route เดิมและมีปุ่ม retry
- Poor GPS accuracy → แจ้งเตือนและงด Auto-reroute
- GPS loss ระหว่าง Active Navigation → คง navigation context และให้ลอง GPS ใหม่

## Demo Principle

Failure demo ต้องแสดงผลที่ผู้ใช้เห็นบน UI อย่างน้อยหนึ่งกรณี ไม่ควรแสดงเฉพาะ terminal log
