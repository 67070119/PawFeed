# PawFeed — Current Verification Status

ปรับ clean-clone setup, Docker/Mailpit, Course Container scripts, Jenkins infrastructure และ publish/deploy pipeline แล้ว

## สถานะของงานปรับครั้งนี้

ผู้ใช้ขอให้หยุดการทดสอบและจะทดสอบเอง จึงยังไม่รับรองว่ารุ่นที่ปรับผ่านทุก gate และไม่ใช้ผลเก่าก่อนแก้เป็นหลักฐานของรุ่นใหม่

เริ่มทดสอบตาม `docs/devops/handoff.md` และดูผล `.ci/results/` โดยเช็ก source SHA และ clean/dirty state ก่อนอ้างในเอกสารส่ง

## ยังต้องทำเองก่อนส่ง

1. Commit/push และตรวจ clean clone ของ revision สุดท้าย
2. รัน Course Container verification ให้ครบ (รวม E2E และ public routing ตาม scope)
3. ตั้ง Jenkins admin/node/job และ Docker Hub access token
4. รัน Jenkins DELIVER=true ให้ Verify/Publish/Deploy/Smoke ผ่าน
5. รัน FAILURE_DEMO=true และยืนยันว่า Publish/Deploy ถูกข้าม
6. เก็บหลักฐาน commit SHA/build IDs/logs แล้วอัปเดต traceability
7. เติมสมาชิกทีมและหลักฐานปัญหา/ผลกระทบ
8. Slide/Report/Video ทำภายหลังตามขอบเขตที่ตกลง

REQ-NFR-DEVOPS-003/004/005 ยังไม่ควรเปลี่ยนเป็น VERIFIED จนมีหลักฐาน final revision ทั้งหมด

Dependency audit ใช้ threshold high เหมือนเดิม การอัปเดตครั้งนี้แก้ high/critical ที่พบตอนเริ่มตรวจ แต่ยังมี low/moderate ในเครื่องมือพัฒนา ต้องอ่านผล audit รอบที่รันจริง และไม่กล่าวอ้างว่าไม่มีช่องโหว่ทั้งหมด
