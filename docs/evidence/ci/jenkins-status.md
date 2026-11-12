# Jenkins Evidence Status — VERIFIED

อัปเดตจากหลักฐานที่เก็บแล้วใน `PawFeed-Evidence.zip` โดยไม่มีการรัน pipeline/test เพิ่ม

- **#13 SUCCESS**: SCMTriggerCause / Started by an SCM change; automatic Verify → Publish → Deploy/Smoke ผ่าน
- **#14 SUCCESS**: Source `185336097f42445c3d08fad69b1efdbb2920af4a`, full Course verification รวม public routing และ Publish/Deploy ผ่าน
- **#8 controlled FAILURE**: `FAILURE_DEMO=true`, intentional unit assertion fail และ Publish/Deploy skipped ใช้เป็นหลักฐาน fail gate ได้

#8 ใช้ `0dfe66844bbd1d98a967d21bbd31539546cbe8fb` โดยต่างจาก #13/#14 เฉพาะเอกสาร 2 บรรทัด โค้ด/scripts/Compose/Jenkinsfile ไม่เปลี่ยน มี source diff และ metadata ใน ZIP กำกับ ไม่อ้างว่าทุก run ใช้ SHA เดียวกัน

`REQ-NFR-DEVOPS-003/004` = **VERIFIED** ตามหลักฐานและความสัมพันธ์ revision นี้

อ่าน `SUBMISSION-SUMMARY.txt` และ `failure/build-8/FAIL-GATE-EXPLANATION.txt` ในชุด ZIP ดูรายการก่อนส่งทั้งหมดที่ [checklist](../../submission/checklist.md) และวิธีตั้งค่าระบบที่ [handoff](../../devops/handoff.md)
