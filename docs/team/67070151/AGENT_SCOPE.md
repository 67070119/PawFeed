# AGENT_SCOPE — 67070151

## Identity
Student: `67070151`
Role: Tester & CI/CD Engineer

This file defines the hard boundary for any AI coding agent used on this branch. The agent may be Codex, Claude Code, Gemini CLI, Cursor Agent, or another tool. The same rules apply regardless of agent.

## Before Any Work
1. Confirm current branch is `67070151`.
2. Read `docs/team/67070151/TASK.md` completely.
3. Run `git status` and preserve unrelated work.
4. Work only inside the testing/CI/CD scope below.
5. Do not commit or push unless explicitly requested.

## Allowed Scope
The agent may modify:

```text
backend/tests/**
tests/e2e/**
tests/routing-mock/**
scripts/**
Jenkinsfile
docker-compose.test.yml
docker-compose.e2e.yml
docs/verification/**
docs/evidence/**
docs/devops/**
docs/team/67070151/**
```

The agent may update test dependencies/config directly related to test execution when necessary, but must avoid changing production dependencies without approval.

## Primary Responsibility
This branch verifies the product. It does not own product feature implementation.

When a test exposes a production defect, identify the owner and report it instead of fixing the production feature yourself:
- Frontend defect → `67070119`
- Backend Auth/Point/Profile/Upload defect → `67070233`
- Feeding/Report/Navigation defect → `67070269`

## Forbidden Production Scope
Do not modify:

```text
frontend/src/**
backend/src/modules/**
backend/src/middlewares/**
backend/src/utils/**
backend/src/config/**
backend/prisma/schema.prisma
```

Do not change application behavior to make tests pass.

## Shared Files — Approval Required
These may affect the whole repository and must not be changed automatically unless the task explicitly requires CI/test infrastructure changes:

```text
backend/package.json
backend/package-lock.json
frontend/package.json
frontend/package-lock.json
docker-compose.yml
.env.example
README.md
```

If a shared-file change is necessary, report the exact reason and minimal proposed change before editing.

## Testing Integrity Rules
Tests must verify actual behavior. Never:
- weaken assertions to hide a defect
- skip a mandatory test because it fails
- change expected values to match a bug without confirming the requirement
- add artificial delays when a deterministic condition can be awaited
- use public routing services directly in deterministic E2E tests when routing mock exists
- convert mandatory CI failures into warnings or `|| true`
- report PASS when a required command exits non-zero

## CI/CD Rules
Mandatory verification stages must fail the pipeline when they fail. Preserve fail-fast behavior for required checks such as:
- install
- lint
- unit
- integration
- build
- Docker/runtime verification
- smoke
- E2E when configured as mandatory

Do not add deployment-success messaging after a failed mandatory stage.

## Evidence Rules
Evidence must correspond to the source revision actually tested. Do not reuse outdated PASS counts or screenshots/log claims after code materially changes.

When updating evidence:
- record real test counts
- record real exit status
- distinguish deterministic mock E2E from live external-provider smoke
- keep Jenkins requirements as pending until real Jenkins evidence exists

## Git Safety Rules
Never:
- switch to another student's branch to edit their files
- force-push
- rewrite shared Git history
- reset another student's commits
- automatically merge feature branches
- commit generated secrets or credentials

## When a Production Fix Is Needed
Stop and report:

```text
DEFECT FOUND
Observed failure: <behavior>
Failing test: <test>
Likely owner: <student id>
Likely production path: <path>
Expected behavior: <requirement/contract>
```

Do not edit the production feature yourself unless the student explicitly changes the scope.

## Verification Before Handoff
Depending on the task, use the repository runners:

```text
cd backend && npm test -- --runInBand
./scripts/test-integration.sh
./scripts/test-e2e.sh
./scripts/smoke-test.sh
./scripts/smoke-routing.sh
./scripts/verify-persistence.sh
COURSE_RUN_E2E=1 ./scripts/course-container-test.sh
git diff --check
```

Clean up test/runtime containers after verification unless the user explicitly asks to keep a test environment running.
