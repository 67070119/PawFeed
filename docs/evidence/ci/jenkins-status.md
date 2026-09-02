# Jenkins Evidence Status

## Implemented

- `Jenkinsfile` exists as Pipeline as Code
- Stages: Checkout → Install → Lint → Unit → Integration → Build → Audit → Docker Compose → Smoke → Persistence → Browser E2E
- `post { always { ... } }` cleanup exists
- Any failing `sh` command stops the pipeline before later delivery stages

## Still Required Before Submission

A real Jenkins server/job must be run and evidence captured for:

1. Successful pipeline run from the final submitted revision
2. Controlled failing run showing that a failed test/build prevents later delivery stages

Until those two runs exist:

- `REQ-NFR-DEVOPS-003` = IMPLEMENTED
- `REQ-NFR-DEVOPS-004` = IMPLEMENTED

Do not label them VERIFIED in report/slide yet.
