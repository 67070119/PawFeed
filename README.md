# PawFeed — คู่มือสำหรับผู้ตรวจ

PawFeed คือเว็บแผนที่แบ่งปันตำแหน่งสัตว์จรจัดและบันทึกการให้อาหาร สำหรับ Mini Project วิชา DevTools ธีม PetTech

## 1. เริ่มใช้งาน: clone แล้วรันสคริปต์เดียวใน image อาจารย์

**วิธีหลักสำหรับผู้ตรวจ:** ติดตั้ง Git และเปิด Docker Desktop แบบ Linux containers ให้พร้อม จากนั้นรันใน PowerShell:

```powershell
git clone https://github.com/67070119/PawFeed.git
cd PawFeed
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-start.ps1
```

รอคำสั่งจบแล้วเปิด **[http://localhost:3400](http://localhost:3400)** สมัครสมาชิกใหม่และทดลองระบบได้เลย ไม่มีบัญชีตั้งต้น

**การ clone เป็นการรับ source เท่านั้น** สคริปต์จะเปิด `tuchsanai/devtools:2569_1`, เปิด Docker ภายในกล่อง แล้ว copy/build/run แอปทั้งหมดภายใน image อาจารย์ให้เอง ไม่ต้องเข้าไปสั่งงานในกล่องหรือเปิด Jenkins ก่อน

สำหรับ Linux/macOS/WSL ที่ใช้ Docker ได้:

```bash
git clone https://github.com/67070119/PawFeed.git
cd PawFeed
sh scripts/course-start.sh
```

### สิ่งที่สคริปต์เตรียมให้

1. สร้าง persistent Course Container ชื่อ `pawfeed-course-source` ด้วย image รายวิชา
2. คัดลอก source เข้าไป โดยไม่ใช้ `.env` ส่วนตัว, node_modules, uploads หรือ build outputs ของผู้พัฒนา
3. สร้าง config และสุ่ม JWT secret/DB password ภายในกล่อง
4. Build และเปิด frontend, backend, PostgreSQL และ Mailpit ภายใน Docker ของ Course Container
5. รัน migrations และรอ health/smoke checks แล้วเปิดเว็บค้างให้ทดลอง

```text
เครื่องผู้ตรวจ: clone source → รัน course-start
└── tuchsanai/devtools:2569_1 (pawfeed-course-source)
    └── Docker Compose: frontend + backend + PostgreSQL + Mailpit
```

ไม่ต้องติดตั้ง Node.js/npm/PostgreSQL บนเครื่อง ไม่ต้องให้ `.env` หรือ secret ของผู้พัฒนา และไม่ต้องใช้ Docker Hub token คำสั่งนี้เปิดเว็บพร้อม health checks โดยไม่รัน Unit/Integration/E2E suite หรือ Publish images

### URL และการทดลองระบบ

| บริการที่รันใน Course Container | URL บน browser ของเครื่องผู้ตรวจ |
|---|---|
| PawFeed | [http://localhost:3400](http://localhost:3400) |
| Backend readiness | [http://localhost:3401/health/ready](http://localhost:3401/health/ready) |
| กล่องอีเมล Mailpit | [http://localhost:8425](http://localhost:8425) |

ตัวอย่าง flow: สมัคร/เข้าสู่ระบบ → เพิ่มจุดสัตว์พร้อมตำแหน่งและรูป → Navigation → บันทึกให้อาหาร → ดูประวัติ แผนที่/เส้นทางจริงต้องใช้ Internet; GPS ต้องอนุญาตตำแหน่งใน browser บน localhost หรือ HTTPS

**ทดสอบลืมรหัสผ่าน:** สมัครบัญชี เช่น `reviewer@example.com` → กด Forgot Password ด้วยอีเมลเดียวกัน → เปิด Mailpit พอร์ต 8425 → เปิดอีเมลและกดลิงก์ตั้งรหัสใหม่ → เข้าสู่ระบบด้วยรหัสใหม่

Mailpit รับอีเมลจาก backend ภายในชุด Demo โดยไม่ส่งต่อไป Gmail ภายนอก จึงไม่ต้องใช้ Gmail App Password ของผู้พัฒนา หากต้องการส่งออกไป Gmail จริงเพิ่มเติม ให้ผู้รันตั้ง SMTP credentials ของตนเองแยกจาก source

### หยุด เปิดใหม่ และดู logs

คำสั่งจาก terminal ของเครื่องผู้ตรวจ:

```bash
# หยุดและเปิดใหม่ โดยเก็บข้อมูลไว้
docker stop pawfeed-course-source
docker start pawfeed-course-source

# ดูสถานะแอปและ logs ภายในกล่อง
docker exec -w /workspace/PawFeed pawfeed-course-source docker compose -p pawfeed-source-demo ps
docker exec -w /workspace/PawFeed pawfeed-course-source docker compose -p pawfeed-source-demo logs --tail=100
```

หลังเปิดใหม่ให้รอ Docker daemon และบริการกลับมาพร้อม ข้อมูลอยู่ใน named volumes `pawfeed-course-source-docker` และ `pawfeed-course-source-workspace` หากอัปเดต source ให้เรียก start script เดิมอีกครั้งเพื่อ build รุ่นใหม่ โดยรักษา config/ข้อมูลและเก็บ source copy ก่อนหน้าไว้ใน workspace เพื่อกู้คืนได้

### สิ่งที่ต้องมีและกรณีพอร์ตชน

- Git, Docker Desktop แบบ Linux containers หรือ Docker Engine ที่รองรับ privileged/Docker-in-Docker
- Internet และทรัพยากร Docker เพียงพอสำหรับ Course image/dependencies การเปิดครั้งแรกอาจใช้เวลาจากการดาวน์โหลด/build
- เปิดจาก root checkout ของ PawFeed; ไม่ต้อง clone หรือ run แอปเองภายในกล่อง

หากต้องการใช้พอร์ตอื่นตั้งแต่ครั้งแรก:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-start.ps1 -WebPort 3500 -ApiPort 3501 -MailPort 8525
```

```bash
COURSE_WEB_PORT=3500 COURSE_API_PORT=3501 COURSE_MAIL_PORT=8525 sh scripts/course-start.sh
```

สคริปต์ตั้ง URL ของลิงก์อีเมลตาม WebPort ให้เอง หากมี container เดิมอยู่แล้ว port mapping จะคงเดิม เมื่อตั้งใจเปลี่ยนพอร์ตให้ลบเฉพาะ container ด้วย `docker rm -f pawfeed-course-source` แล้วเรียก start script ใหม่ โดยรักษา named volumes ทั้งสองไว้เพื่อเก็บข้อมูล

อย่าเปิดกล่องอื่นที่ใช้ host ports 3400/3401/8425 พร้อมกัน เช่น `pawfeed-course-review` จากคู่มือ manual รุ่นก่อน สคริปต์ใหม่นี้ใช้พอร์ตแยกจาก Jenkins Demo ที่ 3100/3101/8125

**สถานะคำสั่งนี้:** เพิ่มภายหลังชุดหลักฐาน #13/#14 และยังไม่ได้รันยืนยันใหม่ในการปรับคู่มือครั้งนี้ ผลเดิมใน ZIP ยังคงอ้าง source SHA เดิม ไม่มีการรัน pipeline หรือ test เพิ่ม

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

## 3. รันทดสอบอัตโนมัติใน Course Container (เพิ่มเติม)

ส่วนนี้ใช้เมื่อผู้ตรวจต้องการรัน automated verification เลือกแบบที่ต้องการจากสองข้อด้านล่าง การเปิดเว็บทดลองตามข้อ 1 ไม่ต้องรันคำสั่งเหล่านี้ก่อน

### 3.1 ชุดตรวจหลัก

จาก root checkout บนเครื่องผู้ตรวจ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1
```

Linux/macOS/WSL:

```bash
sh scripts/course-container-test.sh
```

สคริปต์สร้าง Course Container ชั่วคราวและทำ Install/Prisma → Lint → Unit → Integration → Build → Security Audit → Compose → Smoke → Persistence → Browser E2E → Cleanup

### 3.2 ชุดเดิมพร้อม Public routing จริง

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/course-container-test.ps1 -LiveRouting
```

Linux/macOS/WSL:

```bash
COURSE_RUN_LIVE_ROUTING=1 sh scripts/course-container-test.sh
```

รันชุดทดสอบทั้งหมดเหมือนข้อ 3.1 และเพิ่ม public routing DRIVING/WALKING/CYCLING ไม่ใช่การรัน routing อย่างเดียว E2E ใช้ routing mock สำหรับทำซ้ำ/จำลองข้อผิดพลาด ส่วน gate `live-routing` เชื่อมต่อ public provider จริง

ทั้งสองคำสั่งเป็น **การทดสอบแล้วเก็บกวาดกล่องชั่วคราว** ไม่เปิดเว็บค้างและไม่ลบ `pawfeed-course-source` ที่เปิดตามข้อ 1 ไม่เรียก Jenkins หรือ Publish images

### อ่านผล

ผลล่าสุดอยู่ใน `.ci/results/` บนเครื่องผู้ตรวจ ผลรอบก่อนถูกย้ายเป็น `.ci/results-.../` เช่น:

- `provenance.txt`: source SHA, clean/dirty state, Course image และเวลา
- `course-image.txt`: image identity
- `summary.txt`: exit code ของ gates และ `VERIFICATION_PASS` เมื่อผ่านครบ
- `unit.json`, `integration.json`, `e2e/e2e.xml`: test reports
- `smoke.log`, `persistence.log`, `live-routing.log` เมื่อเปิด flag

คำสั่งส่งต่อ exit code ล้มเหลวจริงเมื่อมี gate fail ใช้ log ของขั้นนั้นวินิจฉัย และระบุ SHA ที่ตรวจจริงเมื่ออ้างผล

## 4. แผนสำรอง: รันบน Docker ของเครื่องโดยตรง

วิธีนี้ใช้เมื่อ environment ของเครื่องผู้ตรวจไม่สามารถเปิด Course Container ได้ เป็นแผนสำรองสำหรับทดลองเว็บ ส่วนผลตรวจอย่างเป็นทางการยังต้องอ้างอิง Course Container/หลักฐานที่แนบหรือประสานผู้สอนเรื่อง environment

### 4.1 Clone และเริ่มระบบ

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

### 4.2 เปิดเว็บและทดลองใช้งาน

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

### 4.3 ดูสถานะ หยุด และเปิดใหม่

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

### 4.4 เปลี่ยนพอร์ตหรือแก้การเริ่มระบบ

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
