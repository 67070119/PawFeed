# PawFeed — Jenkins CI/CD

ขั้นตอนตั้ง Jenkins, GitHub SCM, node label, Docker Hub credentials, ports, delivery และ failure demo อยู่ใน [handoff.md](handoff.md)

## Infrastructure

`jenkins/docker-compose.yml` สร้าง Jenkins พร้อม Docker CLI/Compose และ plugins จาก source ใช้ named volume เก็บ Jenkins home ผูก UI กับ localhost:8080 และใช้ Docker socket สำหรับสร้าง Course Containers ตัวอย่างนี้สำหรับ trusted local coursework เท่านั้น

ตั้ง node label `pawfeed-docker` และสร้าง Pipeline script from SCM โดยใช้ `Jenkinsfile` ที่ root ไม่ต้องลง Node/npm บน controller เพราะงาน application verification รันใน Course image

## Pipeline

Checkout → Docker Preflight → Course Container Verification → Publish Tested Images → Deploy and Verify in Course Container → Archive/Cleanup

Course gate ครอบคลุม install, explicit Prisma generate, lint, unit/integration, build, audit, Compose, smoke, persistence และ Browser E2E หาก gate ใด fail จะไม่เข้า Publish/Deploy

`DELIVER=false` ตรวจอย่างเดียว ส่วน `DELIVER=true` ต้องตั้ง Docker Hub namespace และ Jenkins Username/Password credential ID `dockerhub-pawfeed` (ใช้ access token เป็น password)

Publish ใช้ images ที่ถูกทดสอบแล้วและ tag ด้วย full commit SHA ไม่ rebuild หลัง test Deploy ดึง images รุ่นนั้นเข้ากล่องรายวิชาแบบ persistent และใช้ `up --no-build` แล้วตรวจ health/proxy จริง

`FAILURE_DEMO=true` เพิ่ม failing unit test เฉพาะ source copy ชั่วคราว เพื่อแสดงว่า pipeline fail และข้าม Publish/Deploy โดยไม่แก้ repository หรือ Demo เดิม

## Cleanup and evidence

`post` ลบเฉพาะ verification container ที่มี label ตรงกัน ไม่สั่ง down -v กับ Demo เก็บ `.ci/results/` เป็น Jenkins artifacts และอ่าน E2E XML ด้วย junit Git polling ทุกประมาณ 5 นาที ไม่ต้องเปิด localhost webhook จาก Internet

ผู้ใช้จะรันและเก็บหลักฐานเอง งานปรับครั้งนี้ไม่ยืนยัน successful delivery / failure demo / Docker Hub push จาก final submitted revision แล้ว
