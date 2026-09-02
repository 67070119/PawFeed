# PawFeed — Sustainability

## Technical Sustainability

- ใช้ stack ที่ดูแลต่อได้ทั่วไป: Next.js, Express, PostgreSQL, Docker
- มี migration, automated tests, health checks และ reproducible Compose
- Upload และ Database แยกออกจาก container lifecycle ด้วย persistent volumes
- Scope MVP ไม่เพิ่ม Redis/Queue/AI โดยไม่มี Requirement เพื่อลดภาระดูแล

## Operational Sustainability

ค่าใช้จ่ายหลักหากนำไป deploy จริงคือ compute, storage/database, bandwidth และ backup รูปภาพ โดย OpenStreetMap/Google Maps usage ต้องปฏิบัติตามข้อกำหนดของผู้ให้บริการตามรูปแบบการใช้งานจริง

## Product Sustainability

ระบบจะมีคุณค่าต่อเมื่อข้อมูลจุดและ Feeding ถูกอัปเดตต่อเนื่อง จึงออกแบบให้การ update ใช้ flow สั้น และให้ community ยืนยัน `STILL_HERE` / `NOT_FOUND` ได้

## MVP Limitation

PawFeed ยังไม่มี moderation workflow, reputation score, duplicate-point detection, automated stale-point policy หรือ organization dashboard สิ่งเหล่านี้เป็น future work และไม่ถูกอ้างเป็น capability รุ่นส่ง
