# Jenkins Evidence Status

Pipeline และ infrastructure เตรียมไว้แล้ว ดู `docs/devops/handoff.md`

ต้องรันและเก็บหลักฐานเองจาก commit ที่ส่ง:

1. `DELIVER=true`, `FAILURE_DEMO=false`: Verify → Publish SHA-tagged images → Deploy in Course Container → Smoke → SUCCESS
2. `DELIVER=true`, `FAILURE_DEMO=true`: Unit FAIL → Publish/Deploy skipped → FAILURE
3. เก็บ build number/URL, source SHA, console log, `.ci/results/` และ stage view ตามที่ต้องใช้ในการส่ง

งานปรับนี้ไม่อ้างว่าการส่งมอบผ่าน Jenkins/Docker Hub จาก final revision ผ่านแล้ว ผู้ใช้ขอหยุดการทดสอบและจะรันเอง

REQ-NFR-DEVOPS-003 และ REQ-NFR-DEVOPS-004 คงเป็น IMPLEMENTED จนมีหลักฐานที่ตรงกับ revision ที่ส่ง
