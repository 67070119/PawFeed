# PawFeed — Current Verification Status

ปรับ clean-clone setup, Docker/Mailpit, Course Container scripts, Jenkins infrastructure และ publish/deploy pipeline แล้ว

## สถานะของงานปรับครั้งนี้

หลังผู้ใช้ขอให้รันทดสอบเอง ได้แก้การปิด time picker และการรอ Leaflet animation ก่อนลากแผนที่ แล้วรันชุดเต็มใน `tuchsanai/devtools:2569_1` ผ่าน Unit 54/54, Integration 7/7, E2E 22/22, Lint, Build, Audit (threshold high), Compose startup, Smoke, Persistence และ Cleanup ด้วย exit code 0 เมื่อ 2026-11-12

ตรวจ Jenkinsfile ด้วย Jenkins Declarative validator ผ่าน และ controlled-failure run คืน exit code 1 ที่ Unit โดยไม่เข้าสู่ Integration/Build ต่อ ไม่มีการสร้าง screenshot/video/trace ผลทดสอบอ้าง working tree ที่มีการแก้ test files บน base commit `bf34140a60947616adb897fadc059475a1bb1400` ไม่ใช่ final committed revision และยังไม่ได้ทดสอบ Docker Hub Publish/Deploy จริง

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
