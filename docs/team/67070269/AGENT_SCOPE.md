# AGENT_SCOPE — 67070269

## Identity
Student: `67070269`
Role: Backend Developer — Feeding, Report & Navigation

This file defines the hard boundary for any AI coding agent used on this branch. The agent may be Codex, Claude Code, Gemini CLI, Cursor Agent, or another tool. The same rules apply regardless of agent.

## Before Any Work
1. Confirm current branch is `67070269`.
2. Read `docs/team/67070269/TASK.md` completely.
3. Run `git status` and preserve unrelated work.
4. Work only inside the allowed scope.
5. Do not commit or push unless explicitly requested.

## Allowed Production Scope
The agent may modify:

```text
backend/src/modules/feedings/**
backend/src/modules/reports/**
backend/src/modules/navigation/**
```

The agent may modify tests directly related to these owned features:

```text
backend/tests/unit/navigation.test.js
backend/tests/integration/**
```

Only change integration assertions when they verify Feeding, Report, or Navigation behavior owned by this branch.

## Forbidden Scope
Do not modify:

```text
frontend/**
backend/src/modules/auth/**
backend/src/modules/points/**
backend/src/modules/profile/**
tests/e2e/**
tests/routing-mock/**
Jenkinsfile
docs/team/67070233/**
docs/team/67070151/**
docs/team/67070119/**
```

Do not implement Frontend, Auth Core, Point Core, Profile, or CI/CD features in this branch.

## Shared Files — Approval Required
These files can affect multiple owners and must not be edited automatically:

```text
backend/src/app.js
backend/src/config/env.js
backend/src/middlewares/error-handler.js
backend/src/middlewares/request-log.js
backend/src/utils/app-error.js
backend/src/utils/response.js
backend/src/utils/validation.js
backend/prisma/schema.prisma
backend/package.json
backend/package-lock.json
docker-compose*.yml
.env.example
```

If a shared-file change appears necessary, STOP and report:
- exact file
- why the change is required
- minimal proposed change
- which teammate may be affected

Wait for explicit approval.

## Routing Contract Rule
Do not change the existing Navigation API contract casually. Preserve:
- `GET /api/navigation/route`
- supported travel-mode behavior
- geometry/distance/duration/steps response shape
- controlled failure behavior
- no fake road route on provider failure

Do not replace the routing provider or architecture unless explicitly requested.

## Cross-Team Contract Rule
If Feeding, Report, or Navigation requires a change in Auth, Point, or Frontend contracts, do not edit those areas directly. Coordinate with:
- Backend Core owner: `67070233`
- Frontend owner: `67070119`
- Tester/CI-CD owner: `67070151`

## Agent Safety Rules
Never:
- switch to another student's branch to edit code
- force-push, reset, rebase, or rewrite shared history
- perform unrelated repository-wide refactors
- remove fallback/error handling to make a test pass
- weaken routing validation or retry limits
- alter tests simply to hide a production defect
- add fake production data or fake success responses
- commit secrets, tokens, passwords, `.env`, or credentials
- delete Docker volumes unless explicitly requested

## When a Forbidden Change Is Needed
Stop and report:

```text
BLOCKED BY SCOPE
Required file: <path>
Reason: <why it is needed>
Owner: <student id>
Proposed change: <minimal change>
```

Do not make the modification automatically.

## Verification Before Handoff
Prefer:

```text
cd backend && npm run lint
cd backend && npm test -- --runInBand
./scripts/test-integration.sh
git diff --check
```

For routing-related work, verify provider failure remains controlled. Do not modify E2E infrastructure yourself; report E2E needs to `67070151`.
