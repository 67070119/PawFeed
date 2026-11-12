# PawFeed — Submission Checklist

อัปเดตจากหลักฐาน Jenkins #8/#13/#14 และ Docker Hub ที่รวบรวมวันที่ 12 พฤศจิกายน 2026 ดู [Final Verification Status](../verification/final-status.md) ช่องที่ทำเครื่องหมายหมายถึงมีหลักฐานตามขอบเขตที่ระบุ ไม่ได้หมายความว่า Mini Project ทุกส่วนเสร็จแล้ว

## Source / Runtime

- [x] Git repository structured and documented
- [x] Frontend + Backend + Database work End-to-End
- [x] Dockerfiles + Docker Compose
- [x] Persistent PostgreSQL + Upload volumes
- [x] Automated Unit / Integration / E2E tests
- [x] Jenkinsfile
- [x] Course Container `tuchsanai/devtools:2569_1` full verification ของ clean committed source `185336097f42445c3d08fad69b1efdbb2920af4a` — #14
- [x] Jenkins delivery: publish SHA-tagged images + persistent course deployment + smoke — #13/#14
- [x] Jenkins successful pipeline run evidence — #14
- [x] Push/SCM change triggers Jenkins โดยอัตโนมัติและ delivery ผ่าน — #13
- [x] Public routing จริง DRIVING/WALKING/CYCLING — #14
- [x] Jenkins intentional-failure pipeline evidence — #8; assertion fail แล้ว Publish/Deploy skipped
- [x] Docker Hub tag และ digest ตรงกับ source/push log ของ #14 ทั้งสอง images
- [x] รวบรวม console/artifacts/metadata/registry snapshots และ checksums เป็น `PawFeed-Evidence.zip`
- [ ] Commit/push การอัปเดตเอกสารสถานะและไฟล์สุดท้ายที่ตั้งใจส่ง

หมายเหตุ fail gate: #8 ใช้ SHA `0dfe66844bbd1d98a967d21bbd31539546cbe8fb` ส่วน #13/#14 ใช้ `185336097f42445c3d08fad69b1efdbb2920af4a` ความต่างมีเฉพาะเอกสาร 2 บรรทัด; application/scripts/Compose/Jenkinsfile ไม่เปลี่ยน จึงใช้ #8 พร้อม source diff เป็นหลักฐาน fail gate ได้ โดยไม่อ้างว่าทุกรอบใช้ SHA เดียวกัน

## Project Content

รายการด้านล่างที่ทำเครื่องหมายหมายถึงมีเอกสารหัวข้อนั้นแล้ว ส่วนหลักฐานจากผู้ใช้/ข้อมูลภายนอกและผลประเมินจริงยังต้องเติมตามรายการที่เว้นไว้

- [x] Problem
- [x] Solution / Scope
- [x] Target Users
- [x] Social Impact
- [x] Sustainability
- [x] System Design
- [x] Failure Cases
- [x] Known Limitations
- [x] AI usage disclosure
- [ ] Fill real team-member names and individual responsibilities
- [ ] เพิ่มแหล่งอ้างอิง/ข้อมูลสัมภาษณ์หรือข้อมูลผู้ใช้รองรับปัญหาและ Target Users พร้อมวิธีเก็บและข้อจำกัด
- [ ] ระบุวิธี/ตัวชี้วัดประเมินผลกระทบ แยกผลที่คาดหวังออกจากผลที่วัดได้จริง

## Presentation / Submission

- [ ] Final Slide
- [ ] Final Report (~20 pages according to course requirement)
- [ ] Presentation/Demo Video (~20 minutes according to course requirement)
- [ ] Rehearse live presentation flow
- [x] เก็บ logs/artifacts ของรุ่นที่ตรวจ พร้อมอธิบายความสัมพันธ์ SHA ของ controlled failure และแนบ diff
- [ ] Verify README Quick Start from clean clone
- [ ] Confirm GitHub repository/branch submitted is the final revision
- [ ] แนบ `PawFeed-Evidence.zip` และตรวจว่าผู้สอน/TA เข้าถึง GitHub, Slide, Report, Video และไฟล์หลักฐานได้
- [ ] ตรวจว่า Slide/Report/คำอธิบาย Demo ตรงกับ scope, known limitations และผลที่หลักฐานยืนยันจริง

## Final Gate

**Docker/Jenkins ผ่านและมีหลักฐานแล้ว**: #13 auto-trigger delivery, #14 full Course verification/public routing/publish/deploy และ #8 controlled fail gate ตามคำอธิบาย revision ด้านบน

รายการที่ต้องทำต่อคือเนื้อหาโครงงาน/ทีม, Slide/Report/Video, การซ้อม Demo และการจัดส่ง source/หลักฐานให้เข้าถึงได้ การแก้เอกสารสถานะครั้งนี้ไม่ได้รัน pipeline หรือ test ใหม่ หากภายหลังเปลี่ยน code/runtime/pipeline ให้ทบทวนว่าผลเดิมยังครอบคลุมหรือจำเป็นต้องเก็บผลของรุ่นใหม่ก่อนอ้างความสามารถนั้น

คู่มือการตั้งค่าและทำซ้ำสำหรับผู้ตรวจอยู่ใน [handoff.md](../devops/handoff.md) หลักฐานที่เก็บแล้วอ้าง tested SHA ชัดเจน และชุด ZIP แนบแยกจาก source
