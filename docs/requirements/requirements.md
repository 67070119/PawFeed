# PawFeed — Requirements Baseline v1

เอกสารนี้เป็น Requirement Baseline สำหรับ PawFeed MVP และใช้เป็นข้อตกลงกลางระหว่าง Proposal → Implementation → Verification

> หลักการ: Requirement ทุกข้อในเอกสารนี้ต้องสามารถเชื่อมไปยัง Acceptance Criteria, Implementation, Automated Test หรือ Demo Evidence ได้ในภายหลัง

## 1. Scope Baseline

PawFeed v1 เป็น Web Application สำหรับแชร์ตำแหน่งสัตว์จรจัดและติดตามการให้อาหาร โดยมี End-to-End Flow หลักดังนี้:

1. Guest เปิดแผนที่และดูจุดสัตว์จรจัดได้
2. ผู้ใช้สมัครสมาชิก / Login ได้
3. ผู้ใช้ที่ Login แล้วสร้างจุดพร้อมตำแหน่ง รูป และรายละเอียดได้
4. จุดใหม่ถูกบันทึกและแสดงบน Map
5. ผู้ใช้เปิด Point Detail และเปิด Navigation ไปยังพิกัดภายนอกได้
6. ผู้ใช้ที่ Login แล้วบันทึกการให้อาหารได้
7. Point Detail แสดง Feeding History และเวลาที่ให้อาหารล่าสุด
8. ผู้ใช้ที่ Login แล้วรายงาน STILL_HERE / NOT_FOUND ได้
9. Database และรูปของ Stray Point ต้อง Persist หลัง Container Restart
10. ระบบต้องรันและตรวจซ้ำได้ด้วย Docker Compose และ Course Container ของรายวิชา

---

## 2. Functional Requirements

### Authentication

#### REQ-AUTH-001 — Register
ผู้ใช้ใหม่ต้องสามารถสมัครสมาชิกด้วยชื่อ Email และ Password ที่ผ่าน Validation ได้

#### REQ-AUTH-002 — Login
ผู้ใช้ที่มีบัญชีต้องสามารถ Login ด้วย Email และ Password ที่ถูกต้องได้

#### REQ-AUTH-003 — Invalid Login Rejection
ระบบต้อง Reject การ Login เมื่อ Credential ไม่ถูกต้อง โดยไม่เปิดเผยว่า Email หรือ Password ส่วนใดผิด

#### REQ-AUTH-004 — Logout
ผู้ใช้ที่ Login แล้วต้องสามารถ Logout และ Session/Authentication ของ Browser นั้นต้องถูกยกเลิก

#### REQ-AUTH-005 — Current User
Frontend ต้องสามารถตรวจสอบผู้ใช้ปัจจุบันผ่าน Backend เพื่อแสดง Authenticated State ได้

#### REQ-AUTH-006 — Authentication Gate
Guest ต้องดู Map และ Point Detail ได้ แต่ต้องไม่สามารถสร้าง Stray Point, บันทึก Feeding, รายงาน Point Status หรือเข้าดู Profile ส่วนตัวได้โดยไม่ Login

---

### Map

#### REQ-MAP-001 — Public Map
Guest และ Authenticated User ต้องเปิดหน้า Map และเห็น ACTIVE Stray Point จากข้อมูลจริงใน Database ได้

#### REQ-MAP-002 — Marker Interaction
ผู้ใช้ต้องสามารถกด Marker เพื่อเปิด Preview หรือ Point Detail ของจุดนั้นได้

#### REQ-MAP-003 — User Location Permission
ระบบต้องขอ Browser Location Permission ก่อนอ่านตำแหน่งปัจจุบัน และยังใช้งาน Map ได้หากผู้ใช้ไม่อนุญาต

#### REQ-MAP-004 — Bounding Box Query
Backend ต้องรองรับการ Query Stray Point ตามขอบเขต Map ที่แสดงอยู่ด้วย minLat, maxLat, minLng และ maxLng เพื่อหลีกเลี่ยงการโหลดทุกจุดโดยไม่จำเป็น

---

### Stray Point

#### REQ-POINT-001 — Create Stray Point
Authenticated User ต้องสามารถสร้าง Stray Point ใหม่ได้

#### REQ-POINT-002 — Required Point Data
Stray Point ใหม่ต้องมีอย่างน้อย Animal Type, Estimated Count, Description, Latitude, Longitude และรูปภาพอย่างน้อย 1 รูป

#### REQ-POINT-003 — Animal Type
Animal Type ใน MVP ต้องรองรับ DOG, CAT และ OTHER เท่านั้น

#### REQ-POINT-004 — Coordinate Validation
Latitude ต้องอยู่ระหว่าง -90 ถึง 90 และ Longitude ต้องอยู่ระหว่าง -180 ถึง 180 หากไม่ถูกต้องระบบต้อง Reject โดยไม่สร้างข้อมูล

#### REQ-POINT-005 — Point Persistence
เมื่อ Create สำเร็จ Stray Point และความสัมพันธ์กับผู้สร้างต้องถูกบันทึกลง Database และอ่านกลับมาได้หลัง Request สิ้นสุด

#### REQ-POINT-006 — Point Appears on Map
หลังสร้าง Stray Point สำเร็จ จุดใหม่ต้องสามารถปรากฏบน Map จากข้อมูลที่ Backend ส่งกลับ ไม่ใช่ข้อมูล Mock/Hard-coded

---

### Image Handling

#### REQ-IMG-001 — Required Point Image
การสร้าง Stray Point ต้องมีรูปอย่างน้อย 1 รูป

#### REQ-IMG-002 — Image Type Validation
ระบบต้องอนุญาตเฉพาะไฟล์รูปประเภทที่กำหนด และ Reject ไฟล์ที่ไม่ใช่รูป

#### REQ-IMG-003 — Image Size Validation
ระบบต้อง Reject ไฟล์ที่มีขนาดเกินค่า Limit ที่กำหนดใน Configuration

#### REQ-IMG-004 — Safe Filename
Backend ต้องสร้างชื่อไฟล์ใหม่ที่ Unique และต้องไม่ใช้ชื่อไฟล์จาก Client เป็นชื่อไฟล์จัดเก็บโดยตรง

#### REQ-IMG-005 — Image Persistence
รูปที่บันทึกสำเร็จต้องยังเปิดอ่านได้หลัง Restart Container โดยใช้ Persistent Storage

---

### Point Detail

#### REQ-DETAIL-001 — Public Point Detail
Guest และ Authenticated User ต้องเปิดรายละเอียด Stray Point ได้

#### REQ-DETAIL-002 — Detail Data
Point Detail ต้องแสดงอย่างน้อย รูป, Animal Type, Estimated Count, Description, Coordinates/Map Location, Usual Time (ถ้ามี), Created At, Last Seen At, Latest Feeding Time และ Feeding History

#### REQ-DETAIL-003 — Missing Point
เมื่อเปิด Point ID ที่ไม่มีอยู่ ระบบต้องแสดง Not Found ที่เข้าใจได้และไม่ Crash

---

### Feeding

#### REQ-FEED-001 — Create Feeding
Authenticated User ต้องสามารถบันทึกว่าให้อาหารแล้วสำหรับ Stray Point ที่มีอยู่ได้

#### REQ-FEED-002 — Feeding Relation
Feeding Record ต้องเชื่อมกับ Stray Point และ User ที่บันทึก พร้อมเวลา fedAt

#### REQ-FEED-003 — Optional Note
ผู้ใช้สามารถเพิ่ม Note ใน Feeding ได้โดยไม่บังคับ

#### REQ-FEED-004 — Feeding History
Point Detail ต้องแสดง Feeding History ที่มาจากข้อมูลจริงใน Database

#### REQ-FEED-005 — Latest Feeding Time
หลังบันทึก Feeding สำเร็จ ระบบต้องแสดงเวลาการให้อาหารล่าสุดที่เปลี่ยนตาม Record ล่าสุด

#### REQ-FEED-006 — Missing Point Rejection
ระบบต้อง Reject การบันทึก Feeding สำหรับ Point ที่ไม่มีอยู่

> รูปหลังให้อาหารยังเป็น Optional Enhancement และไม่ใช่ Acceptance Requirement บังคับของ v1

---

### Point Report / Activity

#### REQ-REPORT-001 — Submit Point Report
Authenticated User ต้องสามารถรายงานสถานะ STILL_HERE หรือ NOT_FOUND ให้ Stray Point ที่มีอยู่ได้

#### REQ-REPORT-002 — Report Relation
Point Report ต้องเชื่อมกับ Point, User, Report Type และเวลาที่รายงาน

#### REQ-REPORT-003 — Last Seen Update
เมื่อมีรายงาน STILL_HERE สำเร็จ ระบบต้องอัปเดตข้อมูล Last Seen ของ Point ให้สะท้อนการพบล่าสุด

#### REQ-REPORT-004 — Invalid Report Type
ระบบต้อง Reject Report Type ที่ไม่ใช่ STILL_HERE หรือ NOT_FOUND

> Auto transition จาก ACTIVE → INACTIVE จากจำนวน NOT_FOUND เป็น Future Scope และไม่ใช่ Requirement บังคับใน v1

---

### Navigation

#### REQ-NAV-001 — External Navigation
ผู้ใช้ต้องสามารถกด Navigate จาก Point Detail แล้วเปิดบริการแผนที่ภายนอกด้วย Latitude/Longitude ของ Point นั้นได้

#### REQ-NAV-002 — No Internal Navigation Engine
PawFeed v1 จะไม่สร้าง Route/Navigation Engine เอง

---

### Profile

#### REQ-PROFILE-001 — Authenticated Profile
Authenticated User ต้องสามารถเปิด Profile ของตนเองได้

#### REQ-PROFILE-002 — User Points
Profile ต้องสามารถแสดงรายการ Stray Point ที่ผู้ใช้สร้างจากข้อมูลจริงได้

#### REQ-PROFILE-003 — User Feedings
Profile ต้องสามารถแสดงประวัติ Feeding ของผู้ใช้จากข้อมูลจริงได้

---

## 3. Non-Functional Requirements

### Persistence & Data Integrity

#### REQ-NFR-PERSIST-001 — Database Persistence
ข้อมูล User, Stray Point, Feeding และ Point Report ต้องไม่หายจากการ Restart Application/Database Container ตามขั้นตอนปกติ

#### REQ-NFR-PERSIST-002 — Upload Persistence
รูป Stray Point ต้องไม่หายจากการ Restart Application Container ตามขั้นตอนปกติ

#### REQ-NFR-DATA-001 — No Mock in Critical Flow
Critical End-to-End Flow ที่ใช้ Demo ต้องใช้ข้อมูลจริงผ่าน Frontend → Backend → Database/Storage และห้ามใช้ Mock หรือ Hard-coded Data แทน Integration ที่รับปากว่าใช้งานจริง

---

### Security & Privacy

#### REQ-NFR-SEC-001 — Password Hashing
Password ต้องไม่ถูกเก็บเป็น Plain Text และต้องผ่าน Password Hashing ก่อนเก็บใน Database

#### REQ-NFR-SEC-002 — HttpOnly Authentication Cookie
Token/Session Credential ที่ใช้ Authentication ใน Browser ต้องเก็บใน HttpOnly Cookie ตาม Technology Baseline

#### REQ-NFR-SEC-003 — Secret Management
Secret, Password, Token และ Production Credential ต้องไม่ถูก Commit ลง Git Repository และ Configuration ตัวอย่างต้องใช้ Placeholder

#### REQ-NFR-PRIV-001 — Location Privacy
ระบบต้องไม่ติดตามหรือจัดเก็บตำแหน่งปัจจุบันของ User แบบต่อเนื่อง และเก็บเฉพาะพิกัด Stray Point ที่ผู้ใช้ตั้งใจเผยแพร่

---

### Reliability & Error Handling

#### REQ-NFR-ERR-001 — Validation Error on UI
Invalid Input ที่ระบบจัดการแล้วใน Critical Flow ต้องถูกแสดงให้ผู้ใช้เข้าใจได้บน UI ไม่ใช่มีเพียง Backend Log

#### REQ-NFR-ERR-002 — API Failure on UI
เมื่อ Backend/API สำหรับ Critical Action ไม่พร้อมใช้งาน Frontend ต้องไม่แสดงว่ารายการสำเร็จ และต้องแสดง Error State ที่เหมาะสม

#### REQ-NFR-ERR-003 — No Partial Success Claim
เมื่อ Create Point หรือ Feeding ล้มเหลว ระบบต้องไม่แสดง Success State หรือสร้าง UI State หลอกที่ขัดกับข้อมูลจริง

---

### Operability

#### REQ-NFR-OPS-001 — Health Endpoint
Backend ต้องมี Health Endpoint สำหรับตรวจว่า Process พร้อมตอบ Request พื้นฐาน

#### REQ-NFR-OPS-002 — Useful Logs
Backend ต้องมี Log สำหรับ Request/Error สำคัญเพียงพอสำหรับวินิจฉัย Failure ระหว่าง Demo/Verification โดยไม่ Log Password หรือ Secret

---

### Reproducibility & Delivery

#### REQ-NFR-DEVOPS-001 — Docker Compose Startup
ระบบต้องสามารถ Build และ Start Frontend, Backend และ Database ด้วย Docker Compose จากคำสั่งที่ระบุใน README

#### REQ-NFR-DEVOPS-002 — Repeatable Stop/Start
ทีมต้องสามารถ Stop และ Start ระบบซ้ำโดยใช้ขั้นตอนที่ระบุ โดยข้อมูล Persistent ที่กำหนดยังคงอยู่

#### REQ-NFR-DEVOPS-003 — Jenkins Verification
Jenkins Pipeline ต้องทำอย่างน้อย Checkout, Install, Lint, Automated Test, Build, Docker/Compose Verification และ Health/Smoke Verification ก่อนถือว่า Pipeline สำเร็จ

#### REQ-NFR-DEVOPS-004 — Fail Stops Delivery
หาก Lint/Test/Build/Verification ขั้นบังคับ Fail Pipeline ต้อง Fail และต้องไม่รายงาน Deployment/Verification ว่าสำเร็จ

#### REQ-NFR-DEVOPS-005 — Course Container Compatibility
รุ่นส่งต้องสามารถ Clone/Checkout, Build, Start, Test และ Cleanup ภายใน Course Container `tuchsanai/devtools:2569_1` ตามคู่มือใน Repository โดยไม่พึ่ง Runtime File ที่มีเฉพาะในเครื่องสมาชิก

---

## 4. Explicit Non-Goals v1

รายการต่อไปนี้ไม่อยู่ใน Acceptance Scope ของ PawFeed v1:

- Navigation Engine ภายในระบบ
- Real-time GPS Tracking สัตว์
- AI วิเคราะห์สายพันธุ์ สุขภาพ หรือความหิวจากรูป
- Donation / Payment
- Marketplace
- Chat
- Clinic/Veterinarian Management
- Advanced Push Notification
- Auto detection ว่าสัตว์หิวหรือไม่
- Auto เปลี่ยน Point เป็น INACTIVE จากจำนวน NOT_FOUND
- Feeding Photo เป็น Requirement บังคับ
- RabbitMQ, Kafka, Redis, Kubernetes, Prometheus หรือ Grafana เว้นแต่ Requirement ในอนาคตทำให้จำเป็น

---

## 5. Change Control

หลัง Baseline นี้ถูกใช้เริ่ม Implementation:

1. Requirement ใหม่ต้องมี ID และ Acceptance Criteria
2. การลด Scope ต้องบันทึกเหตุผลและผลกระทบ
3. README, Spec, Slide และ Report ต้องไม่อ้าง Feature ที่ไม่อยู่ใน Baseline หรือทำงานจริงไม่ได้
4. หาก Implementation แตกต่างจาก Requirement ต้องบันทึกเป็น Defect, Known Limitation หรือ Scope Change อย่างชัดเจน
