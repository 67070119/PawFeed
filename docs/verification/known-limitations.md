# PawFeed — Known Limitations

รุ่นส่ง MVP มีข้อจำกัดที่เปิดเผยดังนี้:

- ไม่มี moderation/admin workflow สำหรับตรวจรายงานจากชุมชน
- `NOT_FOUND` ไม่ auto-inactive จุดใน v1
- ไม่มี duplicate-point detection
- ไม่มี reputation/trust score ของผู้รายงาน
- ไม่มี notification หรือ background job
- ไม่มีระบบรับเลี้ยง/โรงพยาบาลสัตว์/shelter management
- ไม่มี internal routing engine; Navigation เปิดบริการแผนที่ภายนอก
- OpenStreetMap tiles เป็น external dependency; Navigation Mode อยู่ใน PawFeed แต่ยังไม่ใช่ road routing/turn-by-turn
- Upload ใช้ local persistent volume เหมาะกับ MVP single-node; production scale ควรใช้ object storage
- Auth รุ่นนี้เป็น access cookie แบบง่าย ไม่มี refresh-token/session-management ขั้นสูง
- ไม่มี automated browser test สำหรับ geolocation permission denied โดยตรง แต่ UI fallback ถูก implement และตรวจด้วย code review
- Jenkinsfile ถูก implement แล้ว แต่ ณ Phase 8 ยังไม่มี Jenkins server/job run จริงใน evidence; `REQ-NFR-DEVOPS-003/004` จึงยังไม่ควรถูกนับ VERIFIED จนกว่าจะรัน successful และ intentional-failure pipeline บน Jenkins จริง
- รายชื่อสมาชิกทีมจริงยังต้องกรอกในเอกสารก่อนส่ง

ข้อจำกัดเหล่านี้ห้ามถูกนำไปกล่าวใน Slide/Report ว่าเป็น capability ที่ทำเสร็จแล้ว
- Browser Geolocation ต้องใช้ secure context ใน production (HTTPS; localhost ใช้ได้สำหรับ local demo)
