# PawFeed — Course Container Verification

คู่มือปัจจุบัน: [handoff.md](handoff.md)

Formal image: `tuchsanai/devtools:2569_1`

Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1
```

Linux/macOS/WSL:

```bash
sh scripts/course-container-test.sh
```

รวม E2E โดย default ใช้ source bundle ที่ไม่พึ่ง `.env`, `.git`, node_modules, uploads หรือ build outputs จากเครื่องสมาชิก สร้าง config ทดสอบเองภายใน Course Container และส่งต่อ exit code ที่ล้มเหลวจริง

ผลล่าสุดของแต่ละรอบอยู่ที่ `.ci/results/` มี source SHA, clean/dirty state, image identity, logs, test reports และ summary ผลรอบก่อนถูกย้ายเป็น `.ci/results-.../`

Jenkins ใช้การตรวจชุดเดียวกันและเก็บ artifacts ก่อนลบกล่อง CI ส่วนกล่อง `pawfeed-course-demo` เป็น deployment แยกที่เก็บข้อมูลไว้ได้ข้าม build

งานปรับ DevOps รอบนี้ยังไม่ประกาศว่าผ่านทั้งชุด ผู้ใช้ขอหยุดการทดสอบและจะทดสอบเอง ผลเก่าที่เคยระบุ 16/16 หรือ 21/21 ไม่ยืนยัน source รุ่นที่ปรับครั้งนี้ ต้องรัน final committed revision ใหม่ก่อนส่ง
