# PawFeed — Known Limitations

รุ่นส่ง MVP มีข้อจำกัดที่เปิดเผยดังนี้:

- ไม่มี moderation/admin workflow สำหรับตรวจรายงานจากชุมชน
- `NOT_FOUND` ไม่ auto-inactive จุดใน v1
- ไม่มี duplicate-point detection
- ไม่มี reputation/trust score ของผู้รายงาน
- ไม่มี notification หรือ background job
- ไม่มีระบบรับเลี้ยง/โรงพยาบาลสัตว์/shelter management
- ไม่มี self-hosted routing engine; Backend ใช้ external OSRM-compatible routing provider แต่ Navigation UI ทั้งหมดอยู่ภายใน PawFeed
- OpenStreetMap tiles และ OSRM-compatible routing provider เป็น external dependencies; Road Route Preview, Active Navigation และ off-route automatic rerouting มีแล้ว แต่ยังไม่มี voice guidance, live traffic-aware routing หรือ background navigation เมื่อผู้ใช้ออกจากหน้าเว็บ
- Upload ใช้ local persistent volume เหมาะกับ MVP single-node; production scale ควรใช้ object storage
- Auth รุ่นนี้เป็น access cookie แบบง่าย ไม่มี refresh-token/session-management ขั้นสูง
- Geolocation permission denied, insecure-LAN fallback, poor GPS, GPS loss และ reroute recovery มี automated browser coverage แล้ว
- Jenkinsfile ถูก implement แล้ว แต่ ณ Phase 8 ยังไม่มี Jenkins server/job run จริงใน evidence; `REQ-NFR-DEVOPS-003/004` จึงยังไม่ควรถูกนับ VERIFIED จนกว่าจะรัน successful และ intentional-failure pipeline บน Jenkins จริง
- รายชื่อสมาชิกทีมจริงยังต้องกรอกในเอกสารก่อนส่ง

ข้อจำกัดเหล่านี้ห้ามถูกนำไปกล่าวใน Slide/Report ว่าเป็น capability ที่ทำเสร็จแล้ว
- Browser Geolocation ต้องใช้ secure context ใน production (HTTPS; localhost ใช้ได้สำหรับ local demo)
