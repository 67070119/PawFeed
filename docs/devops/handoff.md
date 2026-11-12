# คู่มือเริ่มระบบและส่งมอบ PawFeed

## 1. สิ่งที่ต้องติดตั้งเอง

- Git
- Docker Desktop ที่เปิด Linux containers หรือ Docker Engine บน Linux
- Docker Compose v2.24 ขึ้นไป (`docker compose version`)
- Internet สำหรับ npm, Docker Hub, Microsoft Container Registry, map tiles และ routing provider
- Windows ใช้ PowerShell ได้ ไม่จำเป็นต้องติดตั้ง Node.js หรือ WSL/Ubuntu เพื่อรันแอปและ course verification
- เผื่อ disk สำหรับ Course image, Next.js builds และ Playwright หลาย GB; ถ้าหน่วยความจำไม่พอให้เพิ่มทรัพยากร Docker Desktop

## 2. Clone ใหม่และเปิดเว็บ

PowerShell:

```powershell
git clone https://github.com/67070119/PawFeed.git
cd PawFeed
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start.ps1
```

Linux/macOS/WSL ที่ใช้ Docker ได้:

```bash
git clone https://github.com/67070119/PawFeed.git
cd PawFeed
sh scripts/start.sh
```

สคริปต์สร้าง `.env` จาก `.env.example` หากยังไม่มี และสุ่ม JWT secret / DB password แทน placeholder โดยไม่เปลี่ยน secret เดิม จากนั้น build, migrate DB, start และตรวจ readiness/proxy อัตโนมัติ ไม่ต้องลง npm ที่เครื่องผู้ตรวจ

| บริการ | URL ปกติ |
|---|---|
| แอป | http://localhost:3000 |
| Backend readiness | http://localhost:3001/health/ready |
| กล่องอีเมล Demo | http://localhost:8025 |

สร้างบัญชีผ่านหน้า Register ได้เลย ไม่มีบัญชีตั้งต้น การขอรีเซ็ตรหัสผ่านจะส่งเข้ากล่อง Mailpit ในเครื่อง ไม่ได้ส่งออกไปยัง Gmail จริง

หากมี `.env` เดิม สคริปต์จะรักษาค่าเดิมไว้ ตรวจว่าค่าฐานข้อมูลตรงกับ volume เดิมก่อนเปลี่ยน ห้ามเปลี่ยน `POSTGRES_PASSWORD` แล้วคาดว่าจะเปลี่ยน password ในฐานข้อมูลที่ถูกสร้างไปแล้วอัตโนมัติ

ถ้า `.env` เดิมชี้ Gmail และต้องการใช้กล่อง Demo ให้แก้:

```dotenv
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_AUTH_REQUIRED=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="PawFeed <no-reply@pawfeed.local>"
```

แล้วรัน start ใหม่ สำหรับ Gmail จริงให้ใช้ `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_AUTH_REQUIRED=true`, username และ App Password ของตนเอง ห้าม commit `.env` หรือใส่รหัสผ่านในคู่มือ/ภาพหลักฐาน

เปลี่ยน host ports ผ่าน `.env`: `FRONTEND_PORT`, `BACKEND_PORT`, `MAILPIT_PORT` ถ้าเปิดจาก LAN/HTTPS ให้ตั้ง `PUBLIC_FRONTEND_URL` เป็น URL ที่ browser ใช้จริงเพื่อให้ลิงก์ในอีเมลถูกต้อง GPS ใน browser ต้องใช้ localhost หรือ HTTPS; HTTP บน LAN อาจใช้ GPS ไม่ได้

หยุด/เปิดใหม่โดยรักษาข้อมูล:

```bash
docker compose down
docker compose up -d --wait --wait-timeout 240
docker compose logs --tail=100
```

ล้างข้อมูลเพื่อเริ่มใหม่ **เฉพาะเมื่อตั้งใจลบ DB รูป และอีเมลทั้งหมด**:

```bash
docker compose down -v --remove-orphans
```

## 3. ตรวจในกล่องอาจารย์

Formal environment คือ `tuchsanai/devtools:2569_1` ไม่ใช่เพียงแอปที่รันบน Docker Desktop

PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1
```

Linux/macOS/WSL:

```bash
sh scripts/course-container-test.sh
```

ค่า default รัน E2E ด้วยแล้ว ลำดับคือ clean source bundle → Course Container (privileged) → Docker-in-Docker → generated test config → Install/Prisma → Lint → Unit → Integration → Build → Audit → Compose → Smoke → Persistence → Browser E2E → Cleanup

ไม่คัดลอก `.env`, `.env.*`, `.git`, dependencies, uploads, build outputs หรือ evidence เก่าจากเครื่องพัฒนา แต่คัดลอก `.env.example` แยกเพื่อสร้าง config ใหม่ อ่านผลที่ `.ci/results/summary.txt`, provenance, logs และ E2E XML/screenshots/traces สคริปต์ส่ง exit code ที่ล้มเหลวออกมาจริง แม้จะเก็บ logs/cleanup แล้ว ก่อนแชร์ trace ของ failed auth/email test ให้ตรวจและปิดบัง session/reset tokens หรือข้อมูลผู้ใช้ที่อาจอยู่ใน network trace

แต่ละรอบเก็บผลล่าสุดที่ `.ci/results/` และย้ายผลรอบก่อนเป็น `.ci/results-.../` ให้ตรวจ `provenance.txt`: `source` คือ HEAD, `state=dirty` หมายถึงมีการแก้ที่ยังไม่ commit จึงยังใช้เป็นหลักฐาน final commit ไม่ได้

ตรวจ public routing เพิ่ม (CI ใช้ deterministic mock สำหรับทดสอบ failures):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1 -LiveRouting
```

```bash
COURSE_RUN_LIVE_ROUTING=1 sh scripts/course-container-test.sh
```

## 4. เปิด Jenkins เองครั้งแรก

จาก root repository หลัง Docker พร้อมแล้ว:

```bash
docker compose -f jenkins/docker-compose.yml up -d --build
docker compose -f jenkins/docker-compose.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

เปิด http://localhost:8080 ใช้รหัสจากคำสั่งสร้าง admin ของตนเอง Plugins ที่ pipeline ต้องใช้ถูกติดตั้งจาก `jenkins/plugins.txt` ใน image แล้ว หาก setup wizard เสนอให้ติดตั้งเพิ่ม สามารถเลือกตามต้องการ

Manage Jenkins → Nodes → Built-In Node → Configure:

- Labels: `pawfeed-docker`
- Number of executors: `1`
- Save

ตัวอย่างนี้เป็น Jenkins สำหรับโปรเจกต์รายวิชาบนเครื่องที่เชื่อถือได้ รัน controller เป็น root เพื่อใช้ Docker socket และผูก UI กับ localhost เท่านั้น Docker socket/privileged Course Container ควบคุม Docker host ได้ จึงให้รันเฉพาะ repository และ branch ของทีมที่เชื่อถือได้ หากรับ PR จากบุคคลภายนอกให้ใช้ agent ที่แยกเครื่องและอย่าให้ credentials แก่ build นั้น

หยุด Jenkins โดยเก็บ jobs/users:

```bash
docker compose -f jenkins/docker-compose.yml down
```

ไม่เติม `-v` หากต้องการรักษา Jenkins home

## 5. ตั้ง Jenkins Job

New Item → `PawFeed` → Pipeline → OK

ใน Pipeline:

- Definition: **Pipeline script from SCM**
- SCM: Git
- Repository URL: `https://github.com/67070119/PawFeed.git`
- Credentials: ไม่ต้องใส่เมื่อ repo public; ถ้า private ใช้ credentials สำหรับอ่าน GitHub แยกจาก Docker Hub
- Branch Specifier: `*/main` หรือ branch ที่จะส่งจริง
- Script Path: `Jenkinsfile`
- Save → Build Now ครั้งแรกเพื่อโหลด parameters

Pipeline poll Git ทุกประมาณ 5 นาทีหลัง job โหลด Jenkinsfile แล้ว จึงใช้งานได้กับ Jenkins บน localhost โดยไม่ต้องเปิด webhook จาก Internet ถ้าใช้ webhook แทนให้ตั้ง GitHub integration และ URL ที่ GitHub เข้าถึงได้เอง

รอบตรวจอย่างเดียว: `DELIVER=false`, `FAILURE_DEMO=false` จะจบหลัง Course verification พร้อมเก็บ artifacts ยังไม่ใช่หลักฐาน Publish/Deploy ครบเส้นทาง

## 6. ตั้ง Docker Hub และส่งมอบครบเส้นทาง

ทำเองครั้งเดียว:

1. มี Docker Hub account/namespace ที่ทีมมีสิทธิ์ push
2. เตรียม repositories `<namespace>/pawfeed-backend` และ `<namespace>/pawfeed-frontend` (แนะนำ public สำหรับผู้ตรวจ)
3. สร้าง Docker Hub access token ที่มีสิทธิ์ Read/Write
4. Jenkins → Manage Jenkins → Credentials → System → Global credentials → Add Credentials
5. Kind: **Username with password**; Username: Docker Hub login; Password: access token; ID: **dockerhub-pawfeed**

Build with Parameters:

| Parameter | ค่าที่ใช้ส่งมอบ |
|---|---|
| DELIVER | true |
| REGISTRY_NAMESPACE | namespace ของทีม เช่น `yourdockerhubname` |
| REGISTRY_CREDENTIALS_ID | `dockerhub-pawfeed` |
| FAILURE_DEMO | false |
| LIVE_ROUTING | true สำหรับเก็บหลักฐาน provider จริงเมื่อพร้อม; รอบปกติ false ได้ |
| DEPLOY_FRONTEND_PORT | 3100 |
| DEPLOY_BACKEND_PORT | 3101 |
| DEPLOY_MAILPIT_PORT | 8125 |

ผลที่ต้องได้:

```text
Git checkout (commit SHA)
→ Course Container verification รวม E2E ทั้งหมดผ่าน
→ Tag/push images ที่ทดสอบแล้วด้วย full commit SHA (ไม่ rebuild หลัง test)
→ Persistent Course Container pawfeed-course-demo ดึง images tag เดิม
→ docker compose up --no-build
→ Health / frontend-to-backend smoke
→ เก็บ artifacts และ cleanup เฉพาะกล่อง CI
```

Demo หลัง pipeline สำเร็จ: http://localhost:3100, อีเมล: http://localhost:8125 กล่อง Demo มี named volumes เก็บ Docker data, workspace/config, PostgreSQL, uploads และ inbox ข้อมูลจึงอยู่ข้าม build และหยุด/เปิดกล่อง Course ใหม่ ไม่ถูกล้างโดย `post` ของ Jenkins

### เปิดส่งมอบอัตโนมัติเมื่อ Push

หลังตั้ง credentials และลอง delivery สำเร็จแล้ว ให้คัดลอก `jenkins/.env.example` เป็น `jenkins/.env` แล้วตั้ง `PAWFEED_AUTO_DELIVER=true` และ `PAWFEED_DOCKERHUB_NAMESPACE` เป็น namespace ของทีม จากนั้นสร้าง Jenkins container ใหม่โดยคง home volume:

```bash
docker compose --env-file jenkins/.env -f jenkins/docker-compose.yml up -d --build
```

กด Build with Parameters อีกหนึ่งครั้งด้วย `DELIVER=true` และ namespace ถูกต้องเพื่อโหลด default ใหม่ หลังจากนั้น Git polling ที่พบ commit ใหม่จะใช้ค่า default สำหรับส่งมอบโดยอัตโนมัติ ตรวจหน้า parameters ว่า DELIVER ถูกเลือกและ namespace ถูกต้องก่อนใช้จริง หากยังตั้ง `PAWFEED_AUTO_DELIVER=false` รอบที่ trigger อัตโนมัติจะตรวจอย่างเดียว

หาก port 3100/3101/8125 ชน ให้เปลี่ยน parameter **ก่อน deploy ครั้งแรก** หากมี Demo container เดิมแล้ว script จะปฏิเสธ port ใหม่เพื่อไม่ทำลาย environment เดิม ถ้าตั้งใจเปลี่ยน port ให้หยุดและลบเฉพาะ container `docker rm -f pawfeed-course-demo` แล้ว build ใหม่ โดยรักษา volumes `pawfeed-course-demo-docker` และ `pawfeed-course-demo-workspace` ไว้

## 7. หลักฐาน Fail Stops Delivery

ใช้ job เดิม Build with Parameters:

- `DELIVER=true` พร้อม namespace/credential ตามรอบสำเร็จ
- `FAILURE_DEMO=true`

ระบบเพิ่ม failing unit test เฉพาะ source copy ในกล่อง CI จะได้ Unit FAIL, Pipeline FAILURE และ Publish/Deploy ถูก skipped ตัว repository จริงและ Demo ที่ใช้งานอยู่ไม่ถูกแก้/ล้าง เก็บภาพ stage view + console log + SHA/build number จากนั้นรันอีกครั้งด้วย `FAILURE_DEMO=false` ให้ผ่าน

## 8. ตรวจ/หยุด Demo และส่งต่อให้ผู้ตรวจ

```bash
docker exec -w /workspace/PawFeed pawfeed-course-demo docker compose -p pawfeed-demo ps
docker exec -w /workspace/PawFeed pawfeed-course-demo docker compose -p pawfeed-demo logs --tail=100
docker stop pawfeed-course-demo
docker start pawfeed-course-demo
```

หลัง start รอ Docker-in-Docker และ health กลับมาพร้อม หากต้องการ rollback image tag ให้ใช้ revision ที่เคยผ่าน โดยระวัง migration ใหม่ที่อาจไม่รองรับ schema เก่า ไม่มี automatic database rollback

สิ่งที่ส่งผ่าน GitHub: source, lockfiles, Dockerfiles, Compose, Jenkinsfile, scripts, docs และหลักฐานที่เลือกแล้ว ห้ามส่ง `.env`, Docker Hub token, Jenkins home, DB volume หรือ node_modules

ก่อนส่งจริง: commit/push ทุกไฟล์ที่เปลี่ยน → clone ใหม่ → start และ Course verification → Jenkins delivery success + failure demo จาก revision เดียวกัน → เก็บ commit SHA/build IDs/artifacts และอัปเดต evidence ใน repo

Slide/Report/Video อยู่นอกงานรอบนี้ คำสั่งเริ่มระบบไม่สร้าง Jenkins account หรือ Docker Hub token ให้เอง และการตรวจบน working tree นี้ไม่แทนหลักฐานจาก commit สุดท้ายที่ push แล้ว

## สถานะการส่งต่อครั้งนี้

ผู้ใช้ขอหยุดการทดสอบระหว่างทำงานและจะรันทดสอบเอง จึงยังไม่รับรองว่า source ที่ปรับครั้งนี้ผ่านครบทุกขั้นตอน รวมถึง full E2E, Jenkins delivery และ Docker Hub publish/deploy ต้องเก็บผลใหม่จาก final commit ตามขั้นตอนข้างบน ไม่มีการสร้างภาพหน้าเว็บหรือภาพประกอบเป็น deliverable

Dependency audit ยังคงหยุดที่ high/critical ไม่ลดเกณฑ์เพื่อให้ผ่าน แต่ยังมีรายการ low/moderate ใน development dependencies ให้อ่านรายงาน audit ในรอบที่รันเองด้วย

## อ้างอิง

- [Jenkins: Pipeline from SCM](https://www.jenkins.io/doc/book/pipeline/getting-started/)
- [Jenkins: Docker installation](https://www.jenkins.io/doc/book/installing/docker/)
- [Jenkins: Pipeline syntax / parameters / credentials](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Docker: Compose environment variables](https://docs.docker.com/compose/how-tos/environment-variables/envvars/)
