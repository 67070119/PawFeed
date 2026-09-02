# PawFeed

PawFeed คือระบบแผนที่แบ่งปันตำแหน่งและติดตามการให้อาหารสัตว์จรจัด พัฒนาสำหรับ Mini Project วิชา DevTools ภายใต้ธีม PetTech

> เป้าหมายหลักของ repository นี้คือให้ระบบสามารถพัฒนา ทดสอบ Build Deploy และ Verification ได้แบบทำซ้ำ โดยสอดคล้องกับ Requirement และ Acceptance Criteria ที่ตรวจสอบได้

## Project Status

สถานะปัจจุบัน: **Phase 8 — Verification, Evidence & Submission: COMPLETED (repository-side)**

Development Plan **8/8 Phase เสร็จแล้ว**

Final verification ล่าสุดผ่าน Unit 15/15, Integration 7/7, Playwright E2E 16/16, Live Routing Smoke ครบ DRIVING/WALKING/CYCLING และ Full Course Container `tuchsanai/devtools:2569_1` ด้วย exit code 0. Navigation Redesign เสร็จ 5/5 Phase แล้ว; submission blockers ภายนอก repository ยังมี Jenkins job run จริง, รายชื่อทีมจริง และการจัดทำ final Slide/Report/Video

## Core MVP

PawFeed จะรองรับ User Flow หลักดังนี้:

1. ผู้ใช้เปิดแผนที่และดูจุดสัตว์จรจัด
2. ผู้ใช้เปิดรายละเอียดของจุด
3. ผู้ใช้สมัครสมาชิกและเข้าสู่ระบบ
4. ผู้ใช้ที่ Login แล้วสร้างจุดสัตว์จรจัดพร้อมตำแหน่งและรูปภาพ
5. จุดใหม่ปรากฏบนแผนที่
6. ผู้ใช้เปิด Navigation ภายใน PawFeed เพื่อดู Road Route Preview และเริ่ม Active Navigation พร้อม GPS/ETA/คำแนะนำเส้นทาง
7. ผู้ใช้บันทึกว่าให้อาหารแล้ว
8. ระบบแสดง Feeding History และเวลาที่ให้อาหารล่าสุด
9. ข้อมูลสำคัญต้อง Persist หลัง Container Restart

รายละเอียด Scope ปัจจุบันดูได้ที่ [docs/spec.md](docs/spec.md)

## Technology Baseline

| Layer | Technology |
|---|---|
| Frontend | Next.js + React |
| Map | Leaflet + OpenStreetMap |
| Backend | Node.js 22 + Express |
| API | REST + JSON |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT ผ่าน HttpOnly Cookie |
| Image Storage | Local persistent Docker volume สำหรับ MVP |
| Backend Test | Jest + Supertest |
| E2E Test | Playwright |
| Container | Docker + Docker Compose |
| CI/CD | Jenkins |
| AI/LLM Runtime Feature | ไม่ใช้ใน PawFeed MVP |

Technology baseline สามารถเปลี่ยนได้เฉพาะเมื่อมีเหตุผลด้าน Requirement, Compatibility หรือ Course Container และต้องอัปเดตเอกสารที่เกี่ยวข้องให้ตรงกัน

## Repository Structure

```text
PawFeed/
├── README.md
├── .gitignore
├── .env.example
├── frontend/
│   ├── src/
│   └── tests/
├── backend/
│   ├── src/
│   └── tests/
├── tests/
│   └── e2e/
├── scripts/
└── docs/
    ├── spec.md
    ├── user_flow.md
    ├── wireframe-mvp.html
    └── project/
        └── ai-usage.md
```

โครงสร้างย่อยเพิ่มเติมสำหรับ Requirements, Architecture, DevOps และ Verification จะเพิ่มใน Phase ที่เกี่ยวข้อง เพื่อไม่สร้างเอกสารเปล่าที่ไม่มีเนื้อหาจริง

## Environment Variables

ค่าที่ระบบจะใช้ในอนาคตถูกกำหนดชื่อไว้เบื้องต้นใน `.env.example`

ห้าม Commit `.env`, Password, Token, Secret หรือข้อมูลอ่อนไหวจริงเข้า Repository

## Quick Start

ต้องมี Docker + Docker Compose เท่านั้นสำหรับ runtime หลัก

```bash
./scripts/start.sh
```

เปิดระบบที่:

```text
http://localhost:3000
```

ตรวจ health/smoke:

```bash
./scripts/smoke-test.sh
```

ตรวจ persistence แบบสร้างข้อมูลจริงและ restart containers:

```bash
./scripts/verify-persistence.sh
```

หยุดระบบโดยไม่ลบข้อมูล:

```bash
./scripts/stop.sh
```

ลบ environment และ named volumes แบบตั้งใจเท่านั้น:

```bash
./scripts/reset.sh --yes
```

## DevTools Delivery Requirements

ระบบรุ่นส่งต้องรองรับอย่างน้อย:

- Git และ GitHub workflow
- Web Interface + Backend/Service + Database ที่ทำงาน End-to-End
- Docker และ Docker Compose
- Persistent database และ image storage
- Jenkins CI/CD
- Automated Verification
- Health / Smoke verification หลัง Deploy
- Failure Case ที่แสดงผลต่อผู้ใช้ได้
- Traceability จาก Requirement → Acceptance Criteria → Implementation → Test → Evidence
- การทดสอบซ้ำใน Course Container `tuchsanai/devtools:2569_1`

## Documentation

- [Specification](docs/spec.md)
- [User Flow](docs/user_flow.md)
- [MVP Wireframe](docs/wireframe-mvp.html)
- [AI Tool Usage](docs/project/ai-usage.md)
- [Requirements Baseline](docs/requirements/requirements.md)
- [Acceptance Criteria](docs/requirements/acceptance-criteria.md)
- [Traceability Matrix](docs/requirements/traceability-matrix.md)
- [System Design](docs/architecture/system-design.md)
- [Data Flow](docs/architecture/data-flow.md)
- [Database Design](docs/architecture/database-design.md)
- [API Contract](docs/architecture/api-contract.md)
- [Security & Privacy](docs/architecture/security-privacy.md)
- [Failure Modes](docs/architecture/failure-modes.md)
- [Development Environment](docs/devops/development-environment.md)
- [Docker & Reproducibility](docs/devops/docker.md)
- [Jenkins CI/CD](docs/devops/jenkins.md)
- [Course Container](docs/devops/course-container.md)
- [Automated Verification](docs/verification/automated-tests.md)
- [Final Verification Status](docs/verification/final-status.md)
- [Demo Scenario](docs/verification/demo-scenario.md)
- [Failure Cases](docs/verification/failure-cases.md)
- [Known Limitations](docs/verification/known-limitations.md)
- [Evidence Register](docs/evidence/README.md)
- [Submission Checklist](docs/submission/checklist.md)
- [Report Outline](docs/submission/report-outline.md)
- [Slide Outline](docs/submission/slide-outline.md)
- [Video Outline](docs/submission/video-outline.md)
- [Problem & Evidence](docs/project/problem-evidence.md)
- [Target Users](docs/project/target-users.md)
- [Social Impact](docs/project/social-impact.md)
- [Team & Network](docs/project/team-network.md)
- [Sustainability](docs/project/sustainability.md)
- [Backend Implementation](backend/README.md)
- [Frontend Implementation](frontend/README.md)

## Planned Development Phases

1. Project Baseline & Repository Structure
2. Requirements & Acceptance Criteria
3. System Design & Dev Environment
4. Backend Core
5. Frontend & End-to-End User Flow
6. Docker, Persistence & Reproducibility
7. Automated Test, Jenkins & Course Container
8. Verification, Evidence & Submission

## Submission Targets

ก่อนส่งงานจะต้องเตรียม:

- GitHub Source Code
- Slide
- Report ประมาณ 20 หน้า
- Video Presentation ประมาณ 20 นาทีรวม Software Demo

รายละเอียดหลักฐานและ Submission จะจัดทำใน Phase 8
