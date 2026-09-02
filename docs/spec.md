# PawFeed — Spec v1

## 1. Project Overview
PawFeed คือระบบแผนที่สำหรับแบ่งปันตำแหน่งสัตว์จรจัดและจุดให้อาหาร ผู้ใช้สามารถถ่ายรูป ปักหมุดตำแหน่ง เขียนรายละเอียด และให้ผู้ใช้อื่นเปิดดูบนแผนที่เพื่อเดินทางไปช่วยให้อาหารได้

เป้าหมายหลักคือทำให้ข้อมูลจุดที่มีสัตว์จรจัดเข้าถึงง่าย ลดการให้อาหารซ้ำในช่วงเวลาใกล้กัน และช่วยให้คนในพื้นที่ติดตามสถานะของสัตว์แต่ละจุดได้

---

## 2. Problem
ปัจจุบันคนที่ต้องการช่วยให้อาหารสัตว์จรจัดมักไม่รู้ว่า:
- บริเวณไหนมีสัตว์จรจัดอยู่จริง
- มีสัตว์ประมาณกี่ตัว
- ช่วงเวลาไหนที่มักพบ
- มีคนให้อาหารไปแล้วหรือยัง
- จุดที่เคยมีสัตว์ยังมีสัตว์อยู่หรือไม่

ข้อมูลส่วนใหญ่อยู่แบบกระจัดกระจาย เช่น โพสต์ใน Social Media หรือการบอกต่อ ทำให้ค้นหาตามพื้นที่และติดตามสถานะได้ยาก

---

## 3. Target Users
### 3.1 ผู้ใช้งานทั่วไป
คนที่ต้องการช่วยสัตว์จรจัดและค้นหาจุดใกล้ตัวเพื่อเดินทางไปให้อาหาร

### 3.2 ผู้รายงานจุด
คนที่พบสัตว์จรจัดและต้องการแชร์ตำแหน่ง รูปภาพ และรายละเอียดให้คนอื่นช่วยดูแล

> ใน MVP ผู้ใช้หนึ่งคนสามารถเป็นได้ทั้งผู้รายงานจุดและผู้ให้อาหาร

---

## 4. Core User Flow

### Flow A — ค้นหาจุดให้อาหาร
1. ผู้ใช้เปิดเว็บไซต์
2. ระบบแสดง Map และตำแหน่งของผู้ใช้หากอนุญาต Location
3. ระบบแสดงหมุดสัตว์จรจัดบนแผนที่
4. ผู้ใช้เลือกหมุด
5. ระบบแสดงรูปและรายละเอียดของจุด
6. ผู้ใช้กด `นำทาง`
7. ระบบเปิด Navigation Mode ภายใน PawFeed แสดงจุดหมายบนแผนที่ และเมื่อผู้ใช้อนุญาต Location จะแสดงตำแหน่งปัจจุบันกับระยะตรงโดยประมาณ
8. เมื่อให้อาหารเสร็จ ผู้ใช้กด `ให้อาหารแล้ว`
9. ระบบบันทึก Feeding History และเวลาล่าสุดที่มีคนให้อาหาร

### Flow B — รายงานจุดใหม่
1. ผู้ใช้ Login
2. กด `เพิ่มจุดสัตว์จรจัด`
3. เลือกตำแหน่งบน Map หรือใช้ตำแหน่งปัจจุบัน
4. อัปโหลด/ถ่ายรูป
5. ระบุประเภทสัตว์
6. ระบุจำนวนโดยประมาณ
7. เขียนคำอธิบาย
8. ระบุช่วงเวลาที่มักพบ หากทราบ
9. Submit
10. ระบบสร้าง Marker ใหม่บน Map

### Flow C — อัปเดตว่ายังพบสัตว์หรือไม่
1. ผู้ใช้เปิดรายละเอียดจุด
2. เลือกสถานะ เช่น `ยังพบสัตว์อยู่` หรือ `ไม่พบแล้ว`
3. ระบบบันทึกเวลาที่อัปเดตล่าสุด
4. หากมีรายงานว่าไม่พบสัตว์ต่อเนื่องตามเงื่อนไขในอนาคต ระบบสามารถเปลี่ยนจุดเป็น Inactive ได้

---

## 5. MVP Features

### 5.1 Authentication
- Register
- Login
- Logout
- ผู้ใช้ต้อง Login ก่อนสร้างจุดหรือบันทึกการให้อาหาร
- ผู้ที่ยังไม่ Login สามารถเปิด Map และดูจุดได้

### 5.2 Map
- แสดง Marker ของจุดสัตว์จรจัด
- แสดงตำแหน่งผู้ใช้เมื่อได้รับ Permission
- กด Marker เพื่อเปิดรายละเอียด
- Map สามารถเลื่อนและ Zoom ได้

### 5.3 Stray Point
ผู้ใช้สามารถสร้างจุดสัตว์จรจัด โดยมีข้อมูลอย่างน้อย:
- รูปภาพ
- Latitude
- Longitude
- ประเภทสัตว์
- จำนวนโดยประมาณ
- คำอธิบาย
- ช่วงเวลาที่มักพบ (Optional)
- ผู้สร้าง
- วันที่สร้าง
- วันที่อัปเดตล่าสุด

ประเภทสัตว์ MVP:
- DOG
- CAT
- OTHER

### 5.4 Point Detail
รายละเอียดจุดต้องแสดง:
- รูป
- ตำแหน่งบน Map
- ประเภทสัตว์
- จำนวนโดยประมาณ
- คำอธิบาย
- เวลาที่มักพบ
- วันที่รายงาน
- วันที่ยืนยันการพบล่าสุด
- เวลาที่ให้อาหารล่าสุด
- Feeding History

### 5.5 Feeding Update
ผู้ใช้ Login สามารถกด `ให้อาหารแล้ว`

ข้อมูลที่บันทึก:
- Point
- User
- วันที่และเวลา
- Note (Optional)
- รูปหลังให้อาหาร (Optional ใน v1 หาก Implementation ไม่ซับซ้อนเกินไป)

หลังจากบันทึก ระบบต้องแสดงเวลาล่าสุดที่มีคนให้อาหาร

ตัวอย่าง:

`มีคนให้อาหารแล้วเมื่อ 2 ชั่วโมงก่อน`

### 5.6 Point Activity Status
สถานะจุดเบื้องต้น:
- ACTIVE
- INACTIVE

ACTIVE = ยังมีข้อมูลว่าสัตว์อยู่บริเวณนั้น

INACTIVE = จุดที่สัตว์ไม่อยู่แล้วหรือไม่ควรแสดงเป็นจุดปกติบน Map

ผู้ใช้สามารถรายงานการพบล่าสุดได้ เช่น:
- STILL_HERE
- NOT_FOUND

### 5.7 Navigation
เมื่อผู้ใช้กด `นำทาง` ระบบเปิด Navigation Mode ภายใน PawFeed โดยไม่เปิด Google Maps หรือแอปแผนที่ภายนอก

Navigation Mode แสดงจุดหมายและตำแหน่งเริ่มต้นจาก Browser Geolocation หรือ manual map pick. เมื่อทราบทั้งสองพิกัด Frontend เรียก PawFeed Routing API เพื่อขอ Road Route Preview และแสดงเส้นทางตามถนน ระยะทาง และ ETA

Route Preview รองรับ DRIVING, WALKING และ CYCLING. หาก Routing Provider ใช้งานไม่ได้ ระบบต้องแจ้ง Failure และอาจแสดงเส้นตรงเพื่ออ้างอิง แต่ห้ามแสดงเส้นตรงนั้นเป็น Road Route สำเร็จ

PawFeed รองรับ Active Navigation ภายในเว็บแล้ว: ผู้ใช้สามารถ Start/Stop, ดู next maneuver จาก Route Steps, Remaining Distance/ETA, Follow/Recenter และระบบตรวจ Off-route เพื่อขอเส้นทางใหม่อัตโนมัติเมื่อ GPS แม่นยำพอ โดยมี GPS quality/recovery และคง route เดิมหากการ reroute ล้มเหลว ยังไม่รองรับ voice guidance, live traffic-aware routing หรือ background navigation เมื่อออกจากหน้าเว็บ

---

## 6. Feeding Status
เพื่อช่วยลดการไปให้อาหารซ้ำ ระบบควรแสดงสถานะจากเวลาที่มีการให้อาหารล่าสุด เช่น:

- `ยังไม่มีข้อมูลการให้อาหาร`
- `เพิ่งมีคนให้อาหาร`
- `มีคนให้อาหารแล้ว X ชั่วโมงก่อน`

ใน MVP ยังไม่จำเป็นต้องตัดสินอัตโนมัติว่าสัตว์ "หิว" หรือ "ไม่หิว" เพราะไม่มีข้อมูลเพียงพอทางการแพทย์หรือพฤติกรรมสัตว์

ระบบเพียงแสดงข้อมูลเวลาล่าสุดให้ผู้ใช้ตัดสินใจเอง

---

## 7. Pages

### Public
- `/` — Map / Home
- `/points/:id` — Point Detail
- `/login`
- `/register`

### Authenticated
- `/points/create` — Add Stray Point
- `/profile` — User Profile
- `/profile/points` — จุดที่ผู้ใช้เคยสร้าง
- `/profile/feedings` — ประวัติการให้อาหาร

---

## 8. Main Data Models

### User
- id
- name
- email
- passwordHash
- createdAt
- updatedAt

### StrayPoint
- id
- createdByUserId
- animalType
- estimatedCount
- description
- latitude
- longitude
- usualTime
- status
- lastSeenAt
- createdAt
- updatedAt

### PointImage
- id
- pointId
- imageUrl
- createdAt

### Feeding
- id
- pointId
- userId
- note
- imageUrl (Optional)
- fedAt
- createdAt

### PointReport
- id
- pointId
- userId
- type: STILL_HERE | NOT_FOUND
- createdAt

---

## 9. Suggested API Scope

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Points
- `GET /api/points`
- `GET /api/points/:id`
- `POST /api/points`
- `PATCH /api/points/:id`

Map API ควรรองรับการ Query ตาม Bounding Box หรือพื้นที่ที่กำลังแสดง เพื่อไม่ต้องโหลดทุก Marker เมื่อข้อมูลมีจำนวนมาก

ตัวอย่าง:

`GET /api/points?minLat=&maxLat=&minLng=&maxLng=`

### Feeding
- `GET /api/points/:id/feedings`
- `POST /api/points/:id/feedings`

### Point Report
- `POST /api/points/:id/reports`

---

## 10. Image Handling
MVP ต้องรองรับการอัปโหลดรูปอย่างน้อย 1 รูปต่อจุด

ข้อกำหนดเบื้องต้น:
- จำกัดประเภทไฟล์เป็นรูปภาพ
- จำกัดขนาดไฟล์
- Generate unique filename
- ห้ามเชื่อชื่อไฟล์จาก Client โดยตรง

Storage สามารถเลือกได้ภายหลัง เช่น:
- Local Volume สำหรับ Demo
- Object Storage สำหรับ Production

ต้องออกแบบให้ข้อมูลรูป Persist เมื่อ Container Restart

---

## 11. Location & Privacy
- ขอ Permission ก่อนอ่านตำแหน่งผู้ใช้
- ระบบทำงานได้แม้ผู้ใช้ไม่อนุญาต Location โดยยังสามารถเลื่อน Map เองได้
- ตำแหน่งปัจจุบันของผู้ใช้ใช้แบบ session-scoped ระหว่าง Navigation และอาจส่งไป Backend เพื่อคำนวณ route/reroute แต่ไม่ Persist เป็น location history
- เก็บเฉพาะพิกัดของ Stray Point ที่ผู้ใช้ตั้งใจเผยแพร่

---

## 12. Non-Goals for MVP
สิ่งที่ยังไม่ทำใน v1:
- Voice Guidance, Live Traffic-aware Routing และ Background Navigation เมื่อออกจากหน้าเว็บ
- Real-time GPS Tracking สัตว์
- AI วิเคราะห์สายพันธุ์หรือสุขภาพจากรูป
- ระบบบริจาคเงิน
- Marketplace
- Chat
- ระบบคลินิกหรือสัตวแพทย์
- Push Notification ขั้นสูง
- Auto detection ว่าสัตว์หิวหรือไม่

จุดประสงค์คือควบคุม Scope ให้สามารถทำ End-to-End ได้จริงและ Demo ได้เสถียร

---

## 13. DevTools Requirements
โปรเจกต์ต้องสามารถแสดง Workflow ของวิชา DevTools ได้ชัดเจน

### Source Control
- Git
- GitHub
- Branch / Pull Request ตาม Workflow ของทีม

### Container
ต้องใช้ Docker และ Docker Compose

อย่างน้อยควรมี:
- frontend
- backend
- database

ระบบต้องสามารถ Start ได้จากคำสั่งหลักเดียว เช่น:

```bash
docker compose up -d
```

และปิด/ล้าง Environment ได้อย่างเหมาะสม

### CI/CD
ใช้ Jenkins สำหรับ Pipeline อย่างน้อย:
1. Checkout
2. Install dependencies
3. Lint
4. Automated Test
5. Build
6. Docker/Compose verification

### Persistence
Database และรูปที่จำเป็นต้อง Persist ต้องไม่หายเมื่อ Restart Container

---

## 14. Automated Verification
ควรมี Automated Test อย่างน้อยใน Critical Flow เช่น:

### Auth
- Register สำเร็จ
- Login สำเร็จ
- Login ด้วย Password ผิดถูก Reject

### Point
- Create point สำเร็จเมื่อ Login
- Anonymous user สร้างไม่ได้
- Invalid latitude/longitude ถูก Reject
- Get points แสดงข้อมูลถูกต้อง

### Feeding
- Authenticated user สามารถบันทึกการให้อาหาร
- Feeding record เชื่อมกับ Point ถูกต้อง
- last feeding time เปลี่ยนหลังบันทึก

---

## 15. Demo Scenario
Demo หลักควรสามารถทำจบภายในไม่กี่นาที:

1. เปิดระบบและแสดง Map
2. Login
3. สร้างจุดสัตว์จรจัดใหม่
4. Upload รูป
5. ปักตำแหน่งบน Map
6. Submit
7. Marker ปรากฏบน Map
8. เปิด Point Detail
9. กด `นำทาง` เพื่อแสดงว่าเปิดตำแหน่งภายนอกได้
10. บันทึก `ให้อาหารแล้ว`
11. ระบบแสดง Feeding History และเวลาล่าสุด
12. Restart Container หรือแสดง Persistence เพื่อพิสูจน์ว่าข้อมูลยังอยู่

### Failure Case สำหรับ Demo
ตัวอย่างอย่างน้อย 1 กรณี:
- Upload ไฟล์ที่ไม่ใช่รูป → Reject
- Create point โดยไม่ Login → 401
- Latitude/Longitude ผิด → Validation Error

---

## 16. Success Criteria v1
ถือว่า MVP สำเร็จเมื่อ:

- ผู้ใช้เปิด Map และเห็นจุดสัตว์จรจัดได้
- ผู้ใช้สมัคร/Login ได้
- ผู้ใช้สร้างจุดพร้อมรูปและตำแหน่งได้
- จุดใหม่ปรากฏบน Map
- ผู้ใช้อื่นเปิดอ่านรายละเอียดได้
- สามารถเปิด Navigation ไปยังพิกัดได้
- ผู้ใช้บันทึกการให้อาหารได้
- ระบบแสดงประวัติและเวลาที่ให้อาหารล่าสุดได้
- ข้อมูล Persist หลัง Restart
- ระบบรันผ่าน Docker Compose ได้
- Jenkins สามารถตรวจ Build/Test ขั้นพื้นฐานได้

---

## 17. Working Project Name
**PawFeed**

คำอธิบายสั้น:

> ระบบแผนที่แบ่งปันตำแหน่งและติดตามการให้อาหารสัตว์จรจัด

ชื่อและ Branding ยังสามารถเปลี่ยนได้ภายหลัง โดยไม่กระทบ Core Requirement ของระบบ
