# PawFeed — คู่มือสำหรับผู้ตรวจ

PawFeed คือเว็บแผนที่แบ่งปันตำแหน่งสัตว์จรจัดและบันทึกการให้อาหาร สำหรับ Mini Project วิชา DevTools ธีม PetTech ระบบประกอบด้วย Next.js frontend, Express backend, PostgreSQL และ Mailpit สำหรับรับอีเมล Demo

## วิธีหลัก: ใช้ image ของรายวิชา

**ให้เริ่มด้วย `tuchsanai/devtools:2569_1` ตามข้อ 1** แล้ว clone source, รันทดสอบและเปิดเว็บภายในกล่องนั้น การรัน Docker Compose บนเครื่องโดยตรงอยู่ท้ายคู่มือเป็นแผนสำรอง

| ลำดับ | วิธี | ผลที่ได้ | Docker Hub token |
|---|---|---|---|
| 1 | [Course Container — วิธีหลัก](#1-วิธีหลัก-course-container-ของรายวิชา) | ทดสอบใน image อาจารย์ และเปิดเว็บค้างที่พอร์ต 3400 | ไม่ต้องใช้ |
| 2 | [Jenkins CI/CD](#2-ตรวจ-cicd-ด้วย-jenkins) | ตรวจใน Course Container ก่อน Publish/Deploy เมื่อเปิด delivery | โหมดตรวจอย่างเดียวไม่ใช้; Publish/Deploy ใช้ token ของผู้รัน |
| 3 | [Docker บนเครื่อง — แผนสำรอง](#3-แผนสำรอง-รันบน-docker-ของเครื่องโดยตรง) | ทดลองเว็บพอร์ต 3000 หาก Course Container ใช้งานไม่ได้ | ไม่ต้องใช้ |

ยังต้อง clone เพื่อรับ source แต่ในวิธีหลัก **clone ภายใน image อาจารย์** ไม่ต้อง clone ลง host ก่อน และไม่ต้องใช้ `.env` ส่วนตัวของผู้พัฒนา

## สิ่งที่ต้องเตรียม

- Docker Desktop ที่เปิด **Linux containers** หรือ Docker Engine ที่อนุญาต privileged/Docker-in-Docker
- Internet สำหรับดึง image/source/dependencies และใช้งาน OpenStreetMap tiles / public routing
- Terminal บน host: PowerShell หรือ Linux/macOS terminal ที่สั่ง `docker` ได้
- Docker Compose v2.24+ บน host สำหรับส่วน Jenkins/แผนสำรอง; Docker Desktop มี Compose plugin มาให้
- Git บน host ใช้เฉพาะกรณี clone ลงเครื่องสำหรับ Jenkins/แผนสำรอง ส่วนวิธีหลักใช้ Git ที่มีใน Course image

ไม่ต้องลง Node.js, npm, PostgreSQL หรือ Java บน host สำหรับวิธีหลัก การตรวจครั้งแรกดาวน์โหลดหลาย images/dependencies จึงควรเผื่อเวลา พื้นที่ disk และหน่วยความจำ Docker ให้เพียงพอ

หาก PowerShell หา `docker` ไม่เจอ ให้เปิด terminal ใหม่หลังติดตั้ง หรือเพิ่ม PATH ของ Docker Desktop ในหน้าต่างนั้น:

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;$env:ProgramFiles\Docker\Docker\resources\bin;$env:PATH"
```

## 1. วิธีหลัก: Course Container ของรายวิชา

### 1.1 เปิด image อาจารย์ก่อน — คำสั่งบน host

เปิด Docker Desktop แล้วรันสองคำสั่งนี้บน PowerShell หรือ Linux/macOS terminal คำสั่ง `docker run` ด้านล่างเป็นบรรทัดเดียว:

```bash
docker pull tuchsanai/devtools:2569_1
docker run -d --privileged --name pawfeed-course-review --restart unless-stopped -p 127.0.0.1:3400:3000 -p 127.0.0.1:3401:3001 -p 127.0.0.1:8425:8025 -v pawfeed-course-review-docker:/var/lib/docker -v pawfeed-course-review-workspace:/workspace --entrypoint sh tuchsanai/devtools:2569_1 -c "dockerd > /var/log/dockerd.log 2>&1 & exec tail -f /dev/null"
docker exec -it pawfeed-course-review bash
```

หลัง `docker exec` จะอยู่ใน Bash ของ Course Container คำสั่งในข้อ 1.2–1.5 ให้รัน **ภายในกล่องนี้** ส่วน browser ยังคงเปิดบน host

ครั้งต่อไปถ้ามี container ชื่อนี้แล้ว ใช้ `docker start pawfeed-course-review` และ `docker exec -it pawfeed-course-review bash` แทนการ `docker run` ซ้ำ หากพอร์ต 3400/3401/8425 มีบริการอื่นใช้ ให้เลือกพอร์ต host ที่ว่างก่อนสร้างกล่อง พร้อมแก้ URL ในข้อ 1.4–1.5 ให้ตรงกัน

### 1.2 Clone source ภายในกล่องและรันทดสอบ

**ภายใน Course Container:**

```bash
cd /workspace
git clone https://github.com/67070119/PawFeed.git PawFeed
cd /workspace/PawFeed
docker info
```

ถ้า Docker daemon ภายในกำลังเริ่ม ให้รอสักครู่แล้วเรียก `docker info` จนแสดงข้อมูล server หากมี repository นี้อยู่แล้ว ให้ใช้ checkout เดิมที่ต้องการตรวจและไม่ต้อง clone ทับ

เตรียมข้อมูล revision และรันชุดตรวจ:

```bash
export SOURCE_REVISION="$(git rev-parse HEAD)"
export SOURCE_STATE="$(if [ -z "$(git status --porcelain)" ]; then echo clean; else echo dirty; fi)"
export COURSE_IMAGE=tuchsanai/devtools:2569_1
bash scripts/course-verify.sh
```

ลำดับตรวจคือ generated config → Install/Prisma → Lint → Unit → Integration → Build → Security Audit → Compose build/start → Health/Smoke → Persistence หลัง restart → Browser E2E → Cleanup

คำสั่งนี้เป็น **การรันชุดทดสอบ** ผลอยู่ที่ `/workspace/PawFeed/.ci/results/` เมื่อจบจะเก็บกวาด containers/volumes ของชุดทดสอบ โดย Course Container ชั้นนอกยังอยู่ และยังไม่เปิดเว็บ Demo ค้างไว้

ก่อนรันชุดทดสอบซ้ำ หากเปิดเว็บจากข้อ 1.4 อยู่ ให้หยุดแอป Demo ด้านในก่อนเพื่อไม่ให้แย่งพอร์ต โดยรักษาข้อมูล Demo ไว้:

```bash
docker compose -p pawfeed-course-review-app down
```

### 1.3 รันชุดทดสอบพร้อม Public routing จริง

**ภายใน Course Container** จาก `/workspace/PawFeed` และเตรียม revision ตามข้อ 1.2 แล้ว:

```bash
COURSE_RUN_LIVE_ROUTING=1 bash scripts/course-verify.sh
```

นี่คือ **ชุดทดสอบเดิมทั้งชุดพร้อมเพิ่ม Public routing DRIVING/WALKING/CYCLING** ไม่ใช่คำสั่งเปิดเว็บค้าง และไม่ใช่การรัน routing gate อย่างเดียว ต้องใช้ Internet และ public provider พร้อมให้บริการ

ชุด E2E ใช้ routing mock เพื่อทำซ้ำและจำลอง error ส่วน gate `live-routing` ตรวจ public provider จริง เมื่อผ่านครบ `summary.txt` มีทุก gate `exit=0`, `live-routing exit=0` และ `VERIFICATION_PASS`

### 1.4 เปิดเว็บค้างภายใน image อาจารย์

หลังรันทดสอบแล้ว (หรือเมื่อต้องการตรวจเว็บด้วยตนเอง) ให้รัน **ภายใน Course Container**:

```bash
cd /workspace/PawFeed
sh scripts/setup.sh
printf '\nCOMPOSE_PROJECT_NAME=pawfeed-course-review-app\nMAILPIT_BIND_HOST=0.0.0.0\nPUBLIC_FRONTEND_URL=http://localhost:3400\n' >> .env
sh scripts/start.sh
```

สคริปต์ build แอปและเปิด Compose ภายใน Docker daemon ของ image อาจารย์ พร้อม migration และ health/smoke checks โดยไม่รัน Unit/Integration/E2E suite ชุดใหม่

ให้เปิด browser **บนเครื่อง host**:

| บริการใน Course Container | URL บน host |
|---|---|
| PawFeed | [http://localhost:3400](http://localhost:3400) |
| Backend readiness | [http://localhost:3401/health/ready](http://localhost:3401/health/ready) |
| กล่องอีเมล Mailpit | [http://localhost:8425](http://localhost:8425) |

```text
Host Docker
└── pawfeed-course-review (tuchsanai/devtools:2569_1)
    └── Docker Compose: frontend + backend + PostgreSQL + Mailpit
```

เว็บจะเปิดค้างไว้ ข้อมูลใช้ named volumes ของ Demo แยกจาก `pawfeed-ci` และ `pawfeed-e2e` ที่ใช้ทดสอบ สมัครสมาชิกใหม่ผ่านหน้า Register ได้เลย ไม่มีบัญชีตั้งต้น

ตัวอย่าง flow: สมัคร/เข้าสู่ระบบ → เพิ่มจุดพร้อมพิกัด/รูป → Navigation → บันทึกให้อาหาร → ดูประวัติ แผนที่/เส้นทางจริงใช้ Internet และ GPS ใน browser ต้องอนุญาตตำแหน่งบน localhost หรือ HTTPS

### 1.5 ตรวจลืมรหัสผ่านโดยไม่รับ `.env` ของผู้พัฒนา

1. สมัครบัญชีบน [http://localhost:3400](http://localhost:3400) เช่น `reviewer@example.com` และกำหนดรหัสผ่านของตนเอง
2. เปิดหน้า Forgot Password แล้วกรอกอีเมลเดียวกับที่สมัคร
3. เปิด [Mailpit ที่ http://localhost:8425](http://localhost:8425) บน host
4. เปิดอีเมลของบัญชีนั้นและกดลิงก์ตั้งรหัสผ่านใหม่
5. ตั้งรหัสใหม่แล้วทดลองเข้าสู่ระบบด้วยรหัสใหม่

**Mailpit เป็น SMTP/inbox ภายในชุด Demo** รับอีเมลจริงจาก backend แต่ไม่ส่งต่อไปกล่อง Gmail ภายนอก จึงไม่ต้องใช้ Gmail App Password, Docker Hub token หรือ secret ของผู้พัฒนา

`.env.example` กำหนด `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, `SMTP_AUTH_REQUIRED=false` ไว้แล้ว `scripts/setup.sh` สร้าง `.env` และสุ่ม JWT secret/DB password บน environment ของผู้ตรวจเอง ให้เก็บไฟล์นั้นไว้กับ volumes ของ environment เดิม ไม่ต้องส่ง `.env` ส่วนตัวมาประกอบการตรวจ

ถ้าลิงก์ในอีเมลชี้พอร์ตผิด ให้ตรวจ `PUBLIC_FRONTEND_URL=http://localhost:3400` ใน `.env` ภายในกล่อง แล้วเรียก `sh scripts/start.sh` อีกครั้ง หากเปลี่ยนพอร์ต host ต้องใช้ URL ใหม่ให้ตรงกัน

หากจะตรวจส่งอีเมลไป Gmail จริงเพิ่มเติม ผู้รันต้องตั้ง SMTP credentials ของตนเองผ่าน environment/config ภายในกล่องที่ตรวจ ค่าดังกล่าวแยกจาก source และไม่ต้อง commit ลง GitHub หรือส่ง secret ของนักศึกษา

### 1.6 หยุด/เปิดใหม่ และนำผลออกจากกล่อง

**ภายใน Course Container** ดูสถานะหรือหยุดเฉพาะแอปโดยรักษาข้อมูล:

```bash
cd /workspace/PawFeed
docker compose -p pawfeed-course-review-app ps
docker compose -p pawfeed-course-review-app logs --tail=100
docker compose -p pawfeed-course-review-app down
```

เปิดแอปเดิมอีกครั้งด้วย `sh scripts/start.sh` ค่าพอร์ต/URL เก็บใน `.env` แล้ว ส่วนคำสั่ง `down -v` ลบข้อมูลของ Compose project นั้น ใช้เฉพาะเมื่อตั้งใจเริ่มข้อมูลใหม่

ออกจาก Bash ด้วย `exit` แล้วใช้คำสั่งเหล่านี้ **บน host**:

```bash
# เก็บผลทดสอบจากกล่องไว้บน host
docker cp pawfeed-course-review:/workspace/PawFeed/.ci/results ./PawFeed-Course-Results

# หยุด/เปิดกล่องโดยรักษาข้อมูล
docker stop pawfeed-course-review
docker start pawfeed-course-review
docker exec -it pawfeed-course-review bash
```

การออกจาก Bash ไม่หยุดกล่อง ข้อมูล Docker/app และ workspace อยู่ใน named volumes `pawfeed-course-review-docker` และ `pawfeed-course-review-workspace` หลังเปิดใหม่ให้รอ daemon/บริการพร้อม ถ้าเคยสั่ง app `down` ให้รัน start script ภายในอีกครั้ง

อ่านผลจาก `.ci/results/provenance.txt`, `summary.txt`, `unit.json`, `integration.json`, `e2e/e2e.xml`, `smoke.log`, `persistence.log` และ `live-routing.log` เมื่อเปิด flag

### 1.7 ทางลัดเมื่อมี checkout บน host อยู่แล้ว

หากมี source บน host แล้ว ใช้ scripts ที่สร้าง Course Container และ copy source ให้โดยอัตโนมัติได้ ผลการรันแอป/ทดสอบยังอยู่ภายใน image รายวิชา:

| จุดประสงค์ | Windows PowerShell จาก root checkout |
|---|---|
| เปิดเว็บค้าง | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-start.ps1` |
| ทดสอบทั้งชุด | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1` |
| ทั้งชุดรวม public routing | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1 -LiveRouting` |

Linux/macOS/WSL ใช้ `sh scripts/course-start.sh`, `sh scripts/course-container-test.sh` หรือ `COURSE_RUN_LIVE_ROUTING=1 sh scripts/course-container-test.sh`

`course-start` เปิดเว็บค้างใน `pawfeed-course-source` ที่พอร์ต 3400/inbox 8425 ส่วน `course-container-test` ใช้กล่องชั่วคราวและลบกล่องนั้นเมื่อจบ จึงไม่ปิด Demo ห้ามเปิด `pawfeed-course-source` และ `pawfeed-course-review` ด้วย host ports ชุดเดียวกันพร้อมกัน

ลำดับ manual/คำสั่งเปิดเว็บค้างในคู่มือส่วนนี้เพิ่มภายหลังหลักฐาน #13/#14 และยังไม่ได้รันยืนยันใหม่ ผลเดิมใน ZIP ยังคงอ้างรอบและ SHA เดิม การแก้คู่มือครั้งนี้ไม่รัน pipeline หรือ test เพิ่ม

## 2. ตรวจ CI/CD ด้วย Jenkins

### 2.1 เปิด Jenkins และสร้างบัญชีผู้ตรวจ

จาก root repository:

```bash
docker compose -f jenkins/docker-compose.yml up -d --build
docker compose -f jenkins/docker-compose.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

1. เปิด [http://localhost:8080](http://localhost:8080)
2. ใช้รหัสเริ่มต้นจากคำสั่งข้างบนปลดล็อก หากเป็น Jenkins environment ใหม่
3. ทำ setup wizard และสร้าง admin ของผู้ตรวจเอง Plugins ที่ pipeline ต้องใช้เตรียมผ่าน `jenkins/plugins.txt` ใน image แล้ว
4. เข้า **Manage Jenkins → Nodes → Built-In Node → Configure** ตั้ง **Labels = `pawfeed-docker`** และ **Number of executors = `1`** แล้ว Save

Jenkins home เก็บใน named volume จึงรักษาบัญชี/jobs เมื่อหยุดด้วยคำสั่งนี้:

```bash
docker compose -f jenkins/docker-compose.yml down
```

ตัวอย่างนี้ผูก Jenkins UI กับ localhost และใช้ Docker socket เพื่อจัดการ Course Containers เหมาะกับ trusted local coursework

### 2.2 สร้าง Pipeline from SCM

เข้า **New Item → ชื่อ `PawFeed` → Pipeline → OK** แล้วตั้งส่วน Pipeline:

| ช่อง | ค่า |
|---|---|
| Definition | `Pipeline script from SCM` |
| SCM | `Git` |
| Repository URL | `https://github.com/67070119/PawFeed.git` |
| Credentials | เว้นว่างสำหรับ Public repository |
| Branch Specifier | `*/main` หรือ branch ที่ส่งตรวจ |
| Script Path | `Jenkinsfile` |

Save แล้วกด **Build Now** ครั้งแรกเพื่อโหลด pipeline/parameters และเริ่มตรวจ ค่าเริ่มต้นของ Jenkins environment ใหม่เป็นโหมดตรวจอย่างเดียว

Jenkins checkout จาก SCM ของ job ไม่ได้ใช้ไฟล์ที่แก้ในเครื่องโดยยังไม่ push หาก repository ที่ส่งเป็น Private ให้เพิ่ม Git credentials สำหรับอ่าน repo แยกจาก Docker Hub credential

### 2.3 โหมดตรวจอย่างเดียว — ไม่ต้องใช้ Docker Hub token

สำหรับ Jenkins environment ใหม่ ใช้ค่าเริ่มต้น `PAWFEED_AUTO_DELIVER=false` แล้วใน **Build with Parameters** ตั้ง:

| Parameter | ค่า |
|---|---|
| DELIVER | ไม่เลือก |
| FAILURE_DEMO | ไม่เลือก |
| LIVE_ROUTING | เลือกเมื่อต้องการตรวจ public provider จริง |
| REGISTRY_NAMESPACE | เว้นว่างได้ |

ผลคือ Checkout → Docker Preflight → **Course Container Verification** → เก็บ artifacts/cleanup โดยข้าม Publish/Deploy ชุดตรวจ application ใช้เครื่องมือภายใน Course image จึงไม่ต้องลง Node/npm บน Jenkins controller

ถ้าใช้ Jenkins environment เดิมที่ตั้ง `PAWFEED_AUTO_DELIVER=true` ต้องปิดค่านี้และสร้าง Jenkins container ใหม่ก่อนใช้โหมดตรวจอย่างเดียว เพราะ runtime flag นี้เปิด delivery ได้แม้ไม่ติ๊ก DELIVER

### 2.4 โหมด Publish/Deploy — ใช้ Docker Hub token ของผู้รัน

สำหรับผู้ตรวจที่ต้องการทำซ้ำการส่งมอบครบเส้นทาง:

1. เตรียม Docker Hub namespace ที่ตนมีสิทธิ์ push และ repositories `<namespace>/pawfeed-backend`, `<namespace>/pawfeed-frontend`
2. สร้าง Docker Hub access token ที่มีสิทธิ์อ่าน/เขียน
3. Jenkins → **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**
4. Kind: **Username with password**; Username: Docker Hub login; Password: access token; ID: **`dockerhub-pawfeed`**
5. กด **Build with Parameters** ตั้ง `DELIVER=true`, `REGISTRY_NAMESPACE` เป็น namespace ของผู้รัน, `REGISTRY_CREDENTIALS_ID=dockerhub-pawfeed`, `FAILURE_DEMO=false` และเปิด `LIVE_ROUTING` เมื่อต้องการ
6. คง ports เริ่มต้น `3100`, `3101`, `8125` หรือเลือกพอร์ตที่ว่างก่อน deploy ครั้งแรก

Pipeline ตรวจให้ผ่านก่อน Publish images ที่ทดสอบแล้วด้วย tag **full commit SHA** จากนั้นดึง images รุ่นเดียวกันไป Deploy ด้วย `--no-build` ภายใน persistent Course Container `pawfeed-course-demo` และตรวจ Health/Smoke

หลังสำเร็จ เปิด [เว็บ Demo ที่พอร์ต 3100](http://localhost:3100) และ [กล่องอีเมลที่พอร์ต 8125](http://localhost:8125) ข้อมูล Demo ถูกแยกจากกล่อง CI และไม่ถูกลบโดย CI cleanup

**ไม่ต้องใช้หรือรับ token ส่วนตัวของผู้พัฒนา** ผู้ตรวจที่ต้องการอ่านผล delivery เดิมสามารถใช้ชุด `PawFeed-Evidence.zip` ที่แนบมากับงาน หากต้องการตั้ง auto delivery, เปลี่ยนพอร์ต Demo หรือดูรายละเอียดการตั้งค่าเพิ่มเติม อ่าน [คู่มือ DevOps](docs/devops/handoff.md)

### 2.5 ตรวจ fail gate และอ่านผล

ใช้ **Build with Parameters** ตั้ง `FAILURE_DEMO=true` จะเพิ่ม failing unit test เฉพาะ source copy ในกล่อง CI ผลที่คาดหวังคือ **FAILURE** และ Publish/Deploy ถูกข้าม ตัว source repository และ Demo เดิมไม่ถูกแก้เพื่อทำให้ fail รอบปกติให้ใช้ `FAILURE_DEMO=false`

อ่าน **Console Output** และ **Artifacts** ของแต่ละ build โดยดู `summary.txt`, `provenance.txt`, test reports และ `published.txt` / `deployment.txt` เมื่อเป็น delivery run

Pipeline ตั้ง Git polling ประมาณทุก 5 นาที เมื่อพบ revision ใหม่จะเริ่มตรวจอัตโนมัติ การเปิด delivery ใช้ `DELIVER=true` หรือ `PAWFEED_AUTO_DELIVER=true`; namespace ที่เว้นว่างในฟอร์มจะใช้ `PAWFEED_DOCKERHUB_NAMESPACE` แทน

## 3. แผนสำรอง: รันบน Docker ของเครื่องโดยตรง

วิธีนี้ใช้เมื่อ environment ของเครื่องผู้ตรวจไม่สามารถเปิด Course Container ได้ เป็นแผนสำรองสำหรับทดลองเว็บ ส่วนผลตรวจอย่างเป็นทางการยังต้องอ้างอิง Course Container/หลักฐานที่แนบหรือประสานผู้สอนเรื่อง environment

### 3.1 Clone และเริ่มระบบ

**Windows PowerShell** — เปิด Docker Desktop ให้พร้อม แล้วรัน:

```powershell
git clone https://github.com/67070119/PawFeed.git
cd PawFeed
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start.ps1
```

**Linux / macOS / WSL ที่ใช้งาน Docker ได้:**

```bash
git clone https://github.com/67070119/PawFeed.git
cd PawFeed
sh scripts/start.sh
```

สคริปต์จะทำตามลำดับนี้:

1. สร้าง `.env` จาก `.env.example` หากยังไม่มี และสุ่ม JWT secret / PostgreSQL password แทน placeholders
2. Build frontend/backend images จาก source ใน checkout นี้
3. เริ่ม PostgreSQL, backend, frontend และ Mailpit พร้อม persistent volumes
4. รัน Prisma migrations อัตโนมัติก่อน backend เริ่มรับงาน
5. รอ health checks และตรวจ frontend-to-backend proxy

ค่าที่ตั้งไว้แล้วใน `.env` จะถูกเก็บไว้ ไม่ต้องคัดลอก `.env` ของผู้พัฒนาหรือตั้ง Gmail ส่วนตัวสำหรับ Demo

### 3.2 เปิดเว็บและทดลองใช้งาน

| บริการ | URL เริ่มต้น |
|---|---|
| PawFeed | [http://localhost:3000](http://localhost:3000) |
| Backend readiness | [http://localhost:3001/health/ready](http://localhost:3001/health/ready) |
| กล่องอีเมล Demo | [http://localhost:8025](http://localhost:8025) |

**ไม่มีบัญชีผู้ใช้ตั้งต้น** ให้สมัครบัญชีใหม่จากหน้า Register แล้วเข้าสู่ระบบ

ตัวอย่าง flow สำหรับตรวจ:

1. เปิดแผนที่และสมัคร/เข้าสู่ระบบ
2. เพิ่มจุดสัตว์จรจัด โดยเลือกตำแหน่งและแนบรูป
3. เปิดรายละเอียดจุดและทดลอง Navigation
4. บันทึกการให้อาหาร แล้วตรวจ Feeding History
5. ทดลอง Forgot Password และเปิดอีเมลใน Mailpit ที่พอร์ต 8025 เพื่อกดลิงก์ตั้งรหัสผ่านใหม่

Mailpit รับอีเมลไว้ในเครื่องสำหรับ Demo จึงใช้ที่อยู่อีเมลทดสอบของตนเองได้ โดยอีเมลไม่ได้ถูกส่งออกไปยัง Gmail จริง แผนที่และการคำนวณเส้นทางจริงต้องเชื่อมต่อ Internet ส่วน GPS ใน browser ต้องอนุญาตตำแหน่งและใช้ localhost หรือ HTTPS

### 3.3 ดูสถานะ หยุด และเปิดใหม่

คำสั่งต่อไปนี้ใช้ได้ทั้ง PowerShell และ Linux terminal:

```bash
# ดูสถานะและ logs
docker compose ps
docker compose logs --tail=100

# หยุดระบบโดยรักษาฐานข้อมูล รูป และอีเมล
docker compose down

# เปิดระบบเดิมอีกครั้ง
docker compose up -d --wait --wait-timeout 240
```

เมื่อนำ source รุ่นใหม่มาใช้ ให้เรียก `scripts/start.ps1` หรือ `sh scripts/start.sh` อีกครั้งเพื่อ build และเริ่มระบบตาม source ที่ checkout

**การเริ่มใหม่แบบลบข้อมูลทั้งหมด** ให้ใช้เฉพาะเมื่อตั้งใจล้าง environment Demo:

```bash
docker compose down -v --remove-orphans
```

คำสั่งที่มี `-v` ลบข้อมูลใน volumes ของ Compose project นี้ รวม DB, รูป และ inbox ส่วนคำสั่ง `down` ปกติเก็บข้อมูลไว้

### 3.4 เปลี่ยนพอร์ตหรือแก้การเริ่มระบบ

หากพอร์ตชน หลังสคริปต์สร้าง `.env` แล้วให้แก้ `FRONTEND_PORT`, `BACKEND_PORT`, `MAILPIT_PORT` ในไฟล์นั้น เช่น `3300`, `3301`, `8325` แล้วเรียก start script อีกครั้ง ใช้ URL ตามพอร์ตใหม่

| อาการ | วิธีตรวจ/แก้ |
|---|---|
| PowerShell หา `docker` ไม่เจอ | เปิด terminal ใหม่หลังติดตั้ง Docker Desktop หรือเพิ่ม PATH ตามตัวอย่างด้านล่าง |
| Docker Engine ไม่พร้อม | เปิด Docker Desktop และเลือก Linux containers แล้วเรียก start ใหม่ |
| Backend หรือ frontend ไม่ healthy | อ่าน `docker compose logs --tail=100 backend frontend postgres` |
| Login/DB มีปัญหาหลังเปลี่ยน config | ตรวจว่าใช้ DB password เดิมของ volume นั้น การแก้ `POSTGRES_PASSWORD` ไม่เปลี่ยน password ใน DB ที่สร้างแล้วโดยอัตโนมัติ |
| แผนที่/เส้นทางโหลดไม่ได้ | ตรวจ Internet และ logs ของ backend; ผู้ให้บริการภายนอกอาจไม่พร้อมชั่วคราว |

ตัวอย่าง PATH สำหรับ Docker Desktop บน Windows (ใช้กับ PowerShell หน้าต่างปัจจุบัน):

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;$env:ProgramFiles\Docker\Docker\resources\bin;$env:PATH"
```

หากตรวจผ่าน LAN/HTTPS ให้ตั้ง `PUBLIC_FRONTEND_URL` ใน `.env` เป็น URL ที่ browser ใช้จริงเพื่อให้ลิงก์ในอีเมลถูกต้อง สำหรับ production HTTPS ให้ตั้ง `COOKIE_SECURE=true` ด้วย

## หลักฐานที่แนบกับงาน

**Docker/Jenkins ผ่านพร้อมหลักฐานแล้ว** สำหรับ source commit `185336097f42445c3d08fad69b1efdbb2920af4a` ตามผลที่เก็บเมื่อ 12 พฤศจิกายน 2026 การแก้ README นี้เป็นการปรับคู่มือ ไม่มีการรัน pipeline/test ใหม่และไม่เปลี่ยน SHA ที่ผลเดิมอ้างอิง

| หลักฐาน | ผล |
|---|---|
| #13 SUCCESS | SCM-triggered automatic Verify/Publish/Deploy/Smoke |
| #14 SUCCESS | Clean source ใน `tuchsanai/devtools:2569_1`; Unit 54/54, Integration 7/7, E2E 22/22, Lint/Build/Audit, Compose/Smoke/Persistence/Cleanup ผ่าน |
| #14 Public routing | DRIVING/WALKING/CYCLING ผ่าน |
| Docker Hub | Backend/frontend tag ตรง source SHA และ digest ตรง push log ของ #14 |
| #8 controlled FAILURE | Intentional unit assertion fail แล้ว Publish/Deploy ถูกข้าม ใช้ยืนยัน fail gate ได้ |

#8 ใช้ SHA `0dfe66844bbd1d98a967d21bbd31539546cbe8fb` ซึ่งต่างจาก #13/#14 เฉพาะ `docs/evidence/README.md` เพิ่ม 2 บรรทัด code/scripts/Compose/Jenkinsfile ไม่เปลี่ยน มี metadata และ source diff กำกับ โดยระบุ SHA จริงของแต่ละรอบ

ชุด **`PawFeed-Evidence.zip` แนบแยกจาก repository** เปิด `SUBMISSION-SUMMARY.txt` เป็นสารบัญ มี console, artifacts, public registry snapshots และ checksums ลิงก์ Jenkins แบบ localhost ใช้ได้เฉพาะเครื่องเจ้าของระบบ แต่ไฟล์หลักฐานอ่านได้โดยไม่ต้องเข้าลิงก์เหล่านั้น

หากต้องการทำซ้ำ source ที่ตรงกับผลแนบโดยเฉพาะ ให้ checkout revision นั้นใน repository ภายใน Course Container ก่อนรันชุดทดสอบ หรือใน local clone ของแผนสำรอง:

```bash
git checkout --detach 185336097f42445c3d08fad69b1efdbb2920af4a
```

กลับ branch ปัจจุบันด้วย `git switch main` คำสั่งเปิดเว็บค้าง `course-start` เพิ่มภายหลัง tested SHA นี้ จึงให้ใช้คู่มือปัจจุบันกำกับเมื่อทำซ้ำ revision เดิม สำหรับ Jenkins ให้เลือก revision/branch ใน SCM ของ job ตามรุ่นที่จะตรวจ

## ข้อมูลระบบและเอกสารประกอบ

- User flow: แผนที่ → สมัคร/เข้าสู่ระบบ → เพิ่มจุดพร้อมรูป → Navigation → บันทึกให้อาหาร → ดูประวัติ
- Stack: Next.js/React/Leaflet/OpenStreetMap, Express/Prisma/PostgreSQL, HttpOnly JWT cookie, Docker persistent volumes
- Tests: Jest/Supertest และ Playwright; CI/CD: Jenkins/Docker Compose
- Scope และข้อจำกัด: ไม่มี admin moderation, duplicate detection, voice guidance หรือ live traffic; พึ่ง map/routing providers ภายนอก ดูรายละเอียดในเอกสารด้านล่าง

| หัวข้อ | เอกสาร |
|---|---|
| Specification / User Flow | [Spec](docs/spec.md), [User Flow](docs/user_flow.md) |
| Requirements / Acceptance / Traceability | [Requirements](docs/requirements/requirements.md), [Acceptance Criteria](docs/requirements/acceptance-criteria.md), [Traceability](docs/requirements/traceability-matrix.md) |
| Architecture / Data / Security | [System Design](docs/architecture/system-design.md), [Data Flow](docs/architecture/data-flow.md), [Database](docs/architecture/database-design.md), [API](docs/architecture/api-contract.md), [Security](docs/architecture/security-privacy.md), [Failure Modes](docs/architecture/failure-modes.md) |
| Verification / Demo | [Status](docs/verification/final-status.md), [Automated Tests](docs/verification/automated-tests.md), [Demo Scenario](docs/verification/demo-scenario.md), [Failure Cases](docs/verification/failure-cases.md), [Known Limitations](docs/verification/known-limitations.md) |
| Evidence / Submission | [Evidence Register](docs/evidence/README.md), [Submission Checklist](docs/submission/checklist.md) |
| Project / Team / AI usage | [Problem](docs/project/problem-evidence.md), [Target Users](docs/project/target-users.md), [Social Impact](docs/project/social-impact.md), [Team](docs/project/team-network.md), [Sustainability](docs/project/sustainability.md), [AI Usage](docs/project/ai-usage.md) |
| Development | [Backend](backend/README.md), [Frontend](frontend/README.md), [Docker](docs/devops/docker.md), [Jenkins](docs/devops/jenkins.md) |

รายการก่อนส่งที่ยังเหลือ ได้แก่ ชื่อสมาชิก/หน้าที่จริง, หลักฐานปัญหา/ผู้ใช้และการประเมินผลกระทบ, Slide, Report ประมาณ 20 หน้า, Video ประมาณ 20 นาทีรวม Demo, การซ้อมและตรวจสิทธิ์ไฟล์ส่ง ติดตามที่ [Submission Checklist](docs/submission/checklist.md)
