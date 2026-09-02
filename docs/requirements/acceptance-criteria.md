# PawFeed — Acceptance Criteria v1

เอกสารนี้กำหนดเกณฑ์ Pass/Fail สำหรับ Requirement Baseline ของ PawFeed MVP

> รูปแบบหลัก: Given / When / Then เพื่อให้สามารถนำไปทำ Automated Test, E2E Test และ Demo Verification ได้โดยตรง

## 1. Authentication

### AC-AUTH-001 — Register สำเร็จ
**Requirement:** REQ-AUTH-001

- Given: Email ยังไม่ถูกใช้และข้อมูลผ่าน Validation
- When: ผู้ใช้ Submit Register
- Then: ระบบสร้าง User ใหม่, Password ไม่ถูกเก็บแบบ Plain Text และผู้ใช้สามารถ Login ด้วย Credential นั้นได้

### AC-AUTH-002 — Duplicate/Invalid Register ถูก Reject
**Requirement:** REQ-AUTH-001

- Given: Email ถูกใช้แล้วหรือข้อมูล Register ไม่ผ่าน Validation
- When: ผู้ใช้ Submit Register
- Then: ระบบไม่สร้าง User ซ้ำและ UI แสดง Error ที่เข้าใจได้

### AC-AUTH-003 — Login สำเร็จ
**Requirement:** REQ-AUTH-002, REQ-AUTH-005

- Given: User มีอยู่และ Password ถูกต้อง
- When: Login
- Then: ระบบสร้าง Authenticated Session/Cookie และ `/api/auth/me` คืนข้อมูล User ปัจจุบัน

### AC-AUTH-004 — Wrong Credential ถูก Reject
**Requirement:** REQ-AUTH-003

- Given: Email หรือ Password ไม่ถูกต้อง
- When: Login
- Then: ระบบ Reject, ไม่สร้าง Authenticated Session และข้อความไม่ระบุว่าช่องใดผิด

### AC-AUTH-005 — Logout ยกเลิก Session
**Requirement:** REQ-AUTH-004

- Given: User Login อยู่
- When: Logout
- Then: Browser ไม่สามารถเรียก Protected Action ด้วย Session เดิมได้

### AC-AUTH-006 — Guest Access Gate
**Requirement:** REQ-AUTH-006

- Given: User ยังไม่ Login
- When: เปิด Map หรือ Point Detail
- Then: เปิดอ่านได้
- And: เมื่อ Create Point, Feeding, Report หรือ Profile ระบบต้อง Reject/Redirect ไป Login โดยไม่แก้ข้อมูล

---

## 2. Map

### AC-MAP-001 — Map แสดงข้อมูลจริง
**Requirement:** REQ-MAP-001

- Given: Database มี ACTIVE Stray Point
- When: เปิด Map
- Then: Marker ของ Point ปรากฏจาก API Data และ Point ที่เพิ่มใหม่สามารถปรากฏโดยไม่แก้ Hard-coded Frontend Data

### AC-MAP-002 — Marker เปิดรายละเอียดได้
**Requirement:** REQ-MAP-002

- Given: Marker แสดงอยู่บน Map
- When: ผู้ใช้กด Marker
- Then: ระบบแสดง Preview หรือเปิด Point Detail ที่ตรงกับ Point ID นั้น

### AC-MAP-003 — Location Permission Denied ยังใช้งานได้
**Requirement:** REQ-MAP-003

- Given: Browser ไม่อนุญาต Geolocation
- When: เปิด Map
- Then: หน้า Map ยังใช้งานได้และผู้ใช้ยังเลื่อน/Zoom เพื่อค้นหาจุดเองได้

### AC-MAP-004 — Bounding Box Filter
**Requirement:** REQ-MAP-004

- Given: Database มี Point ทั้งภายในและภายนอก Bounding Box
- When: เรียก `GET /api/points?minLat=&maxLat=&minLng=&maxLng=` ด้วยค่าถูกต้อง
- Then: Response มีเฉพาะ Point ที่อยู่ในขอบเขตที่ร้องขอ
- And: Bounding Box ที่ไม่ถูกต้องถูก Reject ด้วย Validation Error

---

## 3. Stray Point & Image

### AC-POINT-001 — Create Point สำเร็จ
**Requirement:** REQ-POINT-001, REQ-POINT-002, REQ-POINT-005

- Given: User Login, Input ถูกต้อง และมีรูปอย่างน้อย 1 รูป
- When: Submit Create Point
- Then: ระบบสร้าง Stray Point ใน Database พร้อมผู้สร้างและรูปที่อ้างอิงได้

### AC-POINT-002 — Anonymous Create ถูก Reject
**Requirement:** REQ-POINT-001, REQ-AUTH-006

- Given: Guest
- When: เรียก Create Point
- Then: Backend ตอบ Unauthorized และไม่มี Point ใหม่ใน Database

### AC-POINT-003 — Animal Type Validation
**Requirement:** REQ-POINT-003

- Given: User Login
- When: ส่ง Animal Type ที่ไม่ใช่ DOG, CAT หรือ OTHER
- Then: ระบบ Reject และไม่สร้าง Point

### AC-POINT-004 — Coordinate Validation
**Requirement:** REQ-POINT-004

- Given: User Login
- When: ส่ง Latitude < -90 หรือ > 90 หรือ Longitude < -180 หรือ > 180
- Then: ระบบ Reject ด้วย Validation Error และไม่สร้าง Point

### AC-POINT-005 — Missing Required Data
**Requirement:** REQ-POINT-002

- Given: User Login
- When: ขาด Animal Type, Estimated Count, Description, Coordinate หรือรูปบังคับ
- Then: ระบบ Reject และ UI ระบุข้อมูลที่ต้องแก้โดยไม่แสดง Success State

### AC-POINT-006 — Point ใหม่ขึ้น Map
**Requirement:** REQ-POINT-006

- Given: Create Point สำเร็จ
- When: กลับหรือ Refresh Map ที่ครอบคลุมพิกัดนั้น
- Then: Marker ของ Point ใหม่ถูกโหลดจาก Backend และกดเปิดรายละเอียดได้

### AC-IMG-005 — Point ต้องมีรูปอย่างน้อย 1 รูป
**Requirement:** REQ-IMG-001

- Given: User Login และกรอกข้อมูล Point อื่นครบ
- When: Submit Create Point โดยไม่มีรูป
- Then: ระบบ Reject, ไม่สร้าง Point สำเร็จ และ UI แจ้งว่าต้องมีรูปอย่างน้อย 1 รูป

### AC-IMG-001 — Non-image ถูก Reject
**Requirement:** REQ-IMG-002

- Given: User Login
- When: Upload ไฟล์ที่ไม่ใช่ประเภทภาพที่ระบบอนุญาต
- Then: ระบบ Reject, ไม่สร้างไฟล์ใช้งานจริง และ UI แสดง Error

### AC-IMG-002 — Oversize Image ถูก Reject
**Requirement:** REQ-IMG-003

- Given: User Login
- When: Upload Image ที่ใหญ่กว่า Configuration Limit
- Then: ระบบ Reject และไม่บันทึก Point แบบสำเร็จ

### AC-IMG-003 — Server-generated Filename
**Requirement:** REQ-IMG-004

- Given: Upload Image ที่ชื่อ Client กำหนด
- When: ระบบจัดเก็บไฟล์
- Then: Storage Filename ถูก Generate ใหม่โดย Backend และไม่ใช้ Client Filename ตรง ๆ

### AC-IMG-004 — Image Persistence
**Requirement:** REQ-IMG-005, REQ-NFR-PERSIST-002

- Given: Point พร้อมรูปถูกสร้างสำเร็จ
- When: Restart Application Container ตามขั้นตอนปกติ
- Then: รูปเดิมยังเปิดจาก Point Detail ได้

---

## 4. Point Detail

### AC-DETAIL-001 — Public Detail
**Requirement:** REQ-DETAIL-001, REQ-DETAIL-002

- Given: Point มีอยู่
- When: Guest เปิด `/points/:id`
- Then: แสดงข้อมูล Point จาก Backend รวมรูป, ประเภท, จำนวน, คำอธิบาย, Location, เวลา, Latest Feeding และ Feeding History ตามข้อมูลที่มี

### AC-DETAIL-002 — Point Not Found
**Requirement:** REQ-DETAIL-003

- Given: Point ID ไม่มีอยู่
- When: เปิด Point Detail
- Then: Backend/UI แสดง Not Found ที่เข้าใจได้และหน้าไม่ Crash

---

## 5. Feeding

### AC-FEED-001 — Create Feeding สำเร็จ
**Requirement:** REQ-FEED-001, REQ-FEED-002

- Given: User Login และ Point มีอยู่
- When: ยืนยันว่าให้อาหารแล้ว
- Then: ระบบสร้าง Feeding ที่เชื่อม Point/User และมี fedAt

### AC-FEED-002 — Feeding Note Optional
**Requirement:** REQ-FEED-003

- Given: User Login และ Point มีอยู่
- When: Submit Feeding โดยไม่ใส่ Note
- Then: ระบบยังบันทึก Feeding สำเร็จได้

### AC-FEED-003 — Latest Feeding เปลี่ยนจริง
**Requirement:** REQ-FEED-004, REQ-FEED-005

- Given: Point มี Feeding เดิม
- When: เพิ่ม Feeding ใหม่ที่ใหม่กว่า
- Then: Point Detail แสดง Record ใหม่ใน History และ Latest Feeding Time ตรงกับข้อมูลล่าสุด

### AC-FEED-004 — Anonymous Feeding ถูก Reject
**Requirement:** REQ-AUTH-006, REQ-FEED-001

- Given: Guest
- When: Submit Feeding
- Then: ระบบ Reject และไม่มี Feeding Record ใหม่

### AC-FEED-005 — Missing Point Feeding ถูก Reject
**Requirement:** REQ-FEED-006

- Given: User Login
- When: Submit Feeding ให้ Point ID ที่ไม่มีอยู่
- Then: ระบบ Reject และไม่สร้าง Orphan Feeding Record

---

## 6. Point Report

### AC-REPORT-001 — STILL_HERE สำเร็จ
**Requirement:** REQ-REPORT-001, REQ-REPORT-002, REQ-REPORT-003

- Given: User Login และ Point มีอยู่
- When: Submit STILL_HERE
- Then: ระบบสร้าง Point Report และ Last Seen ของ Point ถูกอัปเดตให้สะท้อนเวลาการพบล่าสุด

### AC-REPORT-002 — NOT_FOUND สำเร็จ
**Requirement:** REQ-REPORT-001, REQ-REPORT-002

- Given: User Login และ Point มีอยู่
- When: Submit NOT_FOUND
- Then: ระบบสร้าง Point Report ที่เชื่อมกับ Point/User โดยไม่ Auto เปลี่ยน ACTIVE → INACTIVE ใน v1

### AC-REPORT-003 — Invalid Report Type ถูก Reject
**Requirement:** REQ-REPORT-004

- Given: User Login
- When: Submit Report Type อื่น
- Then: ระบบ Reject และไม่สร้าง Report

### AC-REPORT-004 — Anonymous Report ถูก Reject
**Requirement:** REQ-AUTH-006, REQ-REPORT-001

- Given: Guest
- When: Submit STILL_HERE หรือ NOT_FOUND
- Then: ระบบ Reject และไม่มี Report ใหม่

---

## 7. Navigation & Profile

### AC-NAV-001 — In-Web Navigation
**Requirement:** REQ-NAV-001

- Given: Point มี Latitude/Longitude
- When: ผู้ใช้กด Navigate
- Then: Browser เปิด `/points/:id/navigate` ภายใน PawFeed และแสดงจุดหมายบนแผนที่ โดยไม่เปิด Google Maps หรือแอปแผนที่ภายนอก

### AC-NAV-002 — Location-assisted Navigation
**Requirement:** REQ-NAV-002

- Given: ผู้ใช้อยู่ใน Navigation Mode
- When: ผู้ใช้ไม่อนุญาต Location
- Then: จุดหมายยังดูได้และระบบอธิบายว่าการนำทางแบบใช้ตำแหน่งไม่พร้อม
- When: ผู้ใช้อนุญาต Location
- Then: ระบบแสดงตำแหน่งผู้ใช้ ระยะตรงโดยประมาณ และอัปเดตตำแหน่งระหว่างเปิดหน้า โดยต้องระบุชัดว่าไม่ใช่ road route/turn-by-turn

### AC-PROFILE-001 — Profile ต้อง Login
**Requirement:** REQ-PROFILE-001

- Given: Guest
- When: เปิด Profile
- Then: ระบบ Redirect/Reject ไป Login

### AC-PROFILE-002 — User Points จากข้อมูลจริง
**Requirement:** REQ-PROFILE-002

- Given: User Login และมี Point ที่ตนสร้าง
- When: เปิดรายการ Point ของตน
- Then: แสดงเฉพาะรายการที่เชื่อมกับ User นั้นจาก Database

### AC-PROFILE-003 — User Feedings จากข้อมูลจริง
**Requirement:** REQ-PROFILE-003

- Given: User Login และมี Feeding History
- When: เปิดประวัติ Feeding ของตน
- Then: แสดง Feeding ที่เชื่อมกับ User นั้นจาก Database

---

## 8. Persistence, Security & Privacy

### AC-DATA-001 — Critical Flow ใช้ Integration จริง
**Requirement:** REQ-NFR-DATA-001

- Given: Demo/Verification ของ Critical End-to-End Flow
- When: Create Point, Load Map, Open Detail และ Create Feeding
- Then: State ที่แสดงต้องมาจาก Frontend → Backend → Database/Storage จริง และตรวจ State ก่อน-หลังได้ โดยไม่มี Mock/Hard-coded Data แทน Integration หลัก

### AC-PERSIST-001 — Database Restart Persistence
**Requirement:** REQ-NFR-PERSIST-001

- Given: มี User, Point, Feeding และ Report ใน Database
- When: Restart Containers ตามขั้นตอนที่กำหนดโดยไม่ลบ Persistent Volume
- Then: Record เดิมยัง Query ได้ครบ

### AC-SEC-001 — Password ไม่เป็น Plain Text
**Requirement:** REQ-NFR-SEC-001

- Given: Register User สำเร็จ
- When: ตรวจค่า Password ที่เก็บใน Database
- Then: ค่าไม่เท่ากับ Password ที่ผู้ใช้ส่งและสามารถ Verify ผ่าน Hash Algorithm ที่ระบบเลือกใช้

### AC-SEC-002 — Auth Cookie เป็น HttpOnly
**Requirement:** REQ-NFR-SEC-002

- Given: Login สำเร็จ
- When: ตรวจ Set-Cookie Header / Browser Cookie Attributes
- Then: Authentication Cookie มี HttpOnly

### AC-SEC-003 — Repository ไม่มี Runtime Secret
**Requirement:** REQ-NFR-SEC-003

- Given: รุ่นที่ส่ง
- When: ตรวจ tracked files และ `.env.example`
- Then: ไม่มี Production Password/Token/Secret และไฟล์ตัวอย่างใช้ Placeholder

### AC-PRIV-001 — ไม่มี Continuous User Tracking
**Requirement:** REQ-NFR-PRIV-001

- Given: ผู้ใช้อนุญาต Browser Location
- When: ใช้งาน Map
- Then: ระบบใช้ตำแหน่งเพื่อแสดง/ช่วยเลือกพิกัดโดยไม่สร้าง Continuous Location History ของ User ใน Database

---

## 9. Reliability & UI Error Handling

### AC-ERR-001 — Validation Error เห็นบน UI
**Requirement:** REQ-NFR-ERR-001

- Given: ผู้ใช้ Submit Critical Form ด้วย Invalid Input
- When: Backend Reject
- Then: UI แสดง Error State ที่เข้าใจได้และข้อมูลไม่ถูกแสดงว่าสำเร็จ

### AC-ERR-002 — API Failure ไม่แสดง Success
**Requirement:** REQ-NFR-ERR-002, REQ-NFR-ERR-003

- Given: Backend/API Critical Action ไม่พร้อมหรือคืน Error
- When: ผู้ใช้ Submit Action
- Then: UI แสดง Failure State และไม่สร้าง Optimistic Success ที่ขัดกับ Backend State

---

## 10. Operability & Delivery

### AC-OPS-001 — Health Endpoint
**Requirement:** REQ-NFR-OPS-001

- Given: Backend Process ทำงานปกติ
- When: เรียก Health Endpoint
- Then: ได้ Success Status ที่ Jenkins/Smoke Test ใช้ตรวจได้

### AC-OPS-002 — Error Log ใช้วินิจฉัยได้
**Requirement:** REQ-NFR-OPS-002

- Given: เกิด Request Error ที่จัดการโดย Backend
- When: ตรวจ Application Log
- Then: มีข้อมูล Error/Request Context ที่จำเป็นต่อการวินิจฉัยโดยไม่มี Password/Secret

### AC-DEVOPS-001 — Docker Compose Start
**Requirement:** REQ-NFR-DEVOPS-001

- Given: Clean Checkout + Environment Configuration ตาม README
- When: รันคำสั่ง Docker Compose ที่กำหนด
- Then: Frontend, Backend และ Database Start และผ่าน Health/Smoke Verification

### AC-DEVOPS-002 — Stop/Start ทำซ้ำได้
**Requirement:** REQ-NFR-DEVOPS-002

- Given: ระบบมี Persistent Data
- When: Stop แล้ว Start ตามคู่มือโดยไม่ลบ Volume
- Then: ระบบกลับมาทำงานและ Persistent Data ยังอยู่

### AC-DEVOPS-003 — Jenkins Happy Path
**Requirement:** REQ-NFR-DEVOPS-003

- Given: Commit ที่ผ่านทุก Check
- When: Jenkins Pipeline ทำงาน
- Then: Checkout, Install, Lint, Test, Build, Docker/Compose Verification และ Health/Smoke Check ผ่านก่อน Pipeline Success

### AC-DEVOPS-004 — Jenkins Fail Fast
**Requirement:** REQ-NFR-DEVOPS-004

- Given: Lint, Test, Build หรือ Verification ขั้นบังคับถูกทำให้ Fail
- When: Jenkins Pipeline ทำงาน
- Then: Pipeline Fail และไม่รายงาน Deploy/Verification Success

### AC-DEVOPS-005 — Course Container Reproducibility
**Requirement:** REQ-NFR-DEVOPS-005

- Given: Course Container `tuchsanai/devtools:2569_1` และรุ่น Source Code ที่ส่ง
- When: ทำตามขั้นตอน Clone/Checkout → Configure → Build → Start → Test → Smoke → Cleanup จาก README/Script
- Then: ขั้นตอนทำซ้ำได้โดยไม่พึ่ง Runtime File เฉพาะเครื่องสมาชิก

---

## 11. Mandatory Demo Verification Set

ก่อนถือว่า PawFeed v1 พร้อมนำเสนอ ต้อง Demonstrate อย่างน้อย:

### Happy Path
1. เปิด Map และเห็นข้อมูลจริง
2. Login
3. Create Point พร้อมรูปและ Location
4. Marker ใหม่ขึ้น Map
5. เปิด Point Detail
6. กด In-Web Navigation
7. บันทึก Feeding
8. Feeding History / Latest Feeding เปลี่ยน
9. Submit STILL_HERE
10. Restart Container และยืนยัน Persistence

### Failure Cases
อย่างน้อยต้องแสดงจาก UI จริง:

1. Guest Create Point → Unauthorized/Login Required
2. Upload Non-image → Reject
3. Invalid Coordinate → Validation Error

ผล Demo ต้องตรงกับข้อมูลใน Database/Storage และรุ่น Source Code ที่ส่ง
