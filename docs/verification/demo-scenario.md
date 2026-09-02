# PawFeed — Final Demo Scenario

## Main Demo

1. เปิด `http://localhost:3000` และแสดง Public Map
2. สมัครสมาชิก/เข้าสู่ระบบ
3. เปิด Add Point
4. เลือกตำแหน่งหรือใช้พิกัดที่กำหนด
5. เลือกประเภทสัตว์ จำนวน คำอธิบาย ช่วงเวลาที่พบ และอัปโหลดรูป
6. Submit และแสดง Point Detail จากข้อมูลที่ Backend บันทึกจริง
7. กลับ Map และแสดง Marker จาก Points API
8. เปิด Marker/Point Detail
9. แสดงลิงก์ Navigation ไป Google Maps ด้วยพิกัดจุด
10. บันทึก Feeding พร้อม note
11. แสดง Latest Feeding และ Feeding History ที่เปลี่ยนจากข้อมูลจริง
12. กด `STILL_HERE` และแสดงผลสำเร็จ
13. เปิด Profile → My Points / My Feedings
14. Restart containers
15. เปิด Point และรูปเดิมเพื่อพิสูจน์ Persistence

## Demo Rule

- ห้าม seed/mock คำตอบขึ้น UI เพื่อทำ Demo
- Success state ต้องมาหลัง API success เท่านั้น
- ใช้ source revision เดียวกับที่เก็บ Evidence และส่ง GitHub
- หากบริการ Map tile ภายนอกมีปัญหา ให้ยังพิสูจน์ข้อมูล Point/API ได้และอธิบาย external dependency ตรงไปตรงมา
