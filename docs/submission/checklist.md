# PawFeed — Submission Checklist

## Source / Runtime

- [x] Git repository structured and documented
- [x] Frontend + Backend + Database work End-to-End
- [x] Dockerfiles + Docker Compose
- [x] Persistent PostgreSQL + Upload volumes
- [x] Automated Unit / Integration / E2E tests
- [x] Jenkinsfile
- [ ] Course Container `tuchsanai/devtools:2569_1` full verification from final committed revision
- [ ] Jenkins `DELIVER=true`: publish SHA-tagged images + persistent course deployment + smoke evidence
- [ ] Jenkins successful pipeline run evidence
- [ ] Jenkins intentional-failure pipeline evidence
- [ ] Push final commits to GitHub

## Project Content

- [x] Problem
- [x] Solution / Scope
- [x] Target Users
- [x] Social Impact
- [x] Sustainability
- [x] System Design
- [x] Failure Cases
- [x] Known Limitations
- [x] AI usage disclosure
- [ ] Fill real team-member names and individual responsibilities

## Presentation / Submission

- [ ] Final Slide
- [ ] Final Report (~20 pages according to course requirement)
- [ ] Presentation/Demo Video (~20 minutes according to course requirement)
- [ ] Rehearse live presentation flow
- [ ] Capture screenshots/logs from final source revision only
- [ ] Verify README Quick Start from clean clone
- [ ] Confirm GitHub repository/branch submitted is the final revision

## Final Gate

ก่อนส่งให้รันอย่างน้อย:

```bash
sh scripts/course-container-test.sh
```

และ Jenkins job จริงต้องมีทั้ง successful run และ controlled failing run เพื่อปิด `REQ-NFR-DEVOPS-003/004`

ดูขั้นตอน Windows/Jenkins/Docker Hub ใน `docs/devops/handoff.md` ผล local snapshot หรือ dirty working tree ไม่แทนผลจาก commit สุดท้าย ส่วน Slide/Report/Video ยังไม่ทำในงานปรับ DevOps ครั้งนี้
