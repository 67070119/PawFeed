# PawFeed Jenkins

ดูคู่มือหลัก: [docs/devops/handoff.md](../docs/devops/handoff.md)

```bash
docker compose -f jenkins/docker-compose.yml up -d --build
docker compose -f jenkins/docker-compose.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

เปิด http://localhost:8080 สร้าง admin, ตั้ง node label `pawfeed-docker`, executor 1 และ Pipeline from SCM ที่อ่าน Jenkinsfile จาก GitHub

โหมดตรวจ: `DELIVER=false`
โหมดส่งมอบ: `DELIVER=true` พร้อม Docker Hub namespace และ credential ID `dockerhub-pawfeed`
โหมดพิสูจน์ fail gate: `FAILURE_DEMO=true`

Docker socket ให้สิทธิ์ควบคุม Docker host และ Course Container ใช้ privileged จึงใช้กับ code/branch ของทีมที่เชื่อถือได้เท่านั้น ไม่ให้ credentials กับ untrusted PR

User จะทดสอบและเก็บหลักฐานรอบสุดท้ายเองตามคู่มือ
