# AGENT_SCOPE — 67070233

## Identity
Student: `67070233`
Role: Backend Developer — Core API

This file is the operating boundary for any AI coding agent used on this branch. The agent may be Codex, Claude Code, Gemini CLI, Cursor Agent, or another tool. Tool choice does not change the rules below.

## Before Any Work
1. Confirm current branch is `67070233`.
2. Read `docs/team/67070233/TASK.md` completely.
3. Run `git status` and do not overwrite unrelated changes.
4. Work only inside the allowed scope below.
5. Do not commit or push unless explicitly requested by the student.

## Allowed Production Scope
The agent may modify these areas when needed for the assigned Backend Core work:

```text
backend/src/modules/auth/**
backend/src/modules/points/**
backend/src/modules/profile/**
backend/src/middlewares/auth.js
backend/src/utils/upload.js
backend/src/utils/validation.js
```

The agent may also modify tests directly related to this owned scope:

```text
backend/tests/unit/**
backend/tests/integration/**
```

Only change test cases that verify Auth, Point, Profile, Upload, or validation behavior owned by this branch.

## Forbidden Scope
Do not modify these areas:

```text
frontend/**
backend/src/modules/feedings/**
backend/src/modules/reports/**
backend/src/modules/navigation/**
tests/e2e/**
tests/routing-mock/**
Jenkinsfile
scripts/course-container-test.sh
docs/team/67070269/**
docs/team/67070151/**
docs/team/67070119/**
```

Do not implement Frontend, Navigation/Routing, Feeding, Report, or CI/CD features in this branch.

## Shared Files — Approval Required
These files can affect other members and must not be edited automatically:

```text
backend/src/app.js
backend/src/config/env.js
backend/src/middlewares/error-handler.js
backend/src/middlewares/request-log.js
backend/src/utils/app-error.js
backend/src/utils/response.js
backend/prisma/schema.prisma
backend/package.json
backend/package-lock.json
docker-compose*.yml
.env.example
```

If a shared file appears necessary, STOP before modifying it and report:
- exact file
- why the change is required
- proposed minimal change
- which teammate may be affected

Wait for explicit approval before editing.

## API Contract Rule
The current Frontend and tests already consume the existing Backend API contract. Do not rename endpoints, response fields, error codes, cookie names, or HTTP status behavior just to simplify implementation.

If a contract change is genuinely needed, document it first and coordinate with:
- Frontend owner: `67070119`
- Backend Feature owner: `67070269` when affected
- Tester/CI-CD owner: `67070151`

## Agent Safety Rules
Never:
- switch to another student's branch to make edits
- force-push, reset, rebase, or rewrite shared Git history
- delete working features outside assigned scope
- perform broad refactors unrelated to the requested task
- weaken validation/security to make tests pass
- modify tests only to hide a production defect
- add fake/mock production data to critical flows
- commit secrets, passwords, tokens, `.env`, or credentials
- run destructive Docker volume deletion unless explicitly requested

## When a Forbidden Change Is Needed
Do not make the change. Report using this format:

```text
BLOCKED BY SCOPE
Required file: <path>
Reason: <why it is needed>
Owner: <student id>
Proposed change: <minimal change>
```

## Verification Before Handoff
For Backend Core changes, prefer:

```text
cd backend && npm run lint
cd backend && npm test -- --runInBand
./scripts/test-integration.sh
git diff --check
```

If a test outside this branch's ownership fails, report it instead of editing another student's production scope.
