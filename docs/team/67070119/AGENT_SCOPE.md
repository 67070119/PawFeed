# AGENT_SCOPE — 67070119

## Identity
Student: `67070119`
Role: Frontend Developer

This file defines the hard boundary for any AI coding agent used on this branch. The agent may be Codex, Claude Code, Gemini CLI, Cursor Agent, or another tool. The same rules apply regardless of agent.

## Before Any Work
1. Confirm current branch is `67070119`.
2. Read `docs/team/67070119/TASK.md` completely.
3. Run `git status` and preserve unrelated work.
4. Work only inside the allowed Frontend scope below.
5. Do not commit or push unless explicitly requested.

## Allowed Production Scope
The agent may modify Frontend implementation and Frontend-specific documentation:

```text
frontend/**
docs/team/67070119/**
```

Typical owned areas include:

```text
frontend/src/app/**
frontend/src/components/**
frontend/src/lib/**
frontend/src/app/globals.css
frontend/README.md
```

The agent owns UI/UX for Map, Auth screens, Create Point, Point Detail, Feeding/Report UI, Profile, and In-web Navigation.

## Limited Testability Exception
The Frontend agent may propose small changes that improve stable testability, such as semantic roles/labels or deterministic UI states, but should not take ownership of E2E test logic.

Do not edit `tests/e2e/**` unless explicitly approved by the Tester/CI-CD owner or the user.

## Forbidden Scope
Do not modify:

```text
backend/src/**
backend/prisma/**
backend/tests/**
tests/e2e/**
tests/routing-mock/**
Jenkinsfile
scripts/**
docker-compose.test.yml
docker-compose.e2e.yml
docs/team/67070233/**
docs/team/67070269/**
docs/team/67070151/**
```

Do not implement Backend business logic, routing provider logic, database schema changes, or CI/CD work in this branch.

## Shared Files — Approval Required
These can affect other owners and must not be edited automatically:

```text
README.md
docker-compose.yml
.env.example
backend API contract documentation
docs/requirements/**
docs/architecture/**
```

If a shared change is required, STOP and report:
- exact file
- reason
- proposed minimal change
- teammate(s) affected

Wait for explicit approval before editing.

## Backend API Contract Rule
Frontend must consume the existing Backend API contract. Do not directly change Backend code when the API seems inconvenient.

If the required UI cannot be implemented with the current contract, report the needed contract change and route it to:
- Backend Core (`Auth / Point / Profile / Upload`) → `67070233`
- Backend Feature (`Feeding / Report / Navigation`) → `67070269`
- E2E/CI verification impact → `67070151`

## Critical Flow Integrity
Never fake a successful product state. Production Frontend must not:
- hard-code fake Point/Feeding/Profile data in critical flow
- display success before Backend confirmation
- draw a fake road route after routing failure
- hide API errors to make the flow appear successful
- bypass authentication checks with client-only state

Fallback UI is allowed only when it truthfully communicates the limitation, such as manual map position when GPS is unavailable.

## Navigation UX Rules
Preserve the implemented navigation architecture unless explicitly requested:
- In-web PawFeed Navigation
- Road Route Preview
- DRIVING / WALKING / CYCLING selection
- Active Navigation Start/Stop
- Follow/Recenter
- GPS quality/recovery
- remaining distance/ETA
- maneuver guidance
- off-route/reroute UI
- mobile bottom sheet
- privacy disclosure

Do not claim voice guidance, live traffic, or background navigation unless those features are actually implemented and verified.

## Agent Safety Rules
Never:
- switch to another student's branch to edit code
- force-push, reset, rebase, or rewrite shared history
- refactor Backend or CI/CD outside assigned scope
- weaken frontend validation/error states simply to make a demo pass
- remove accessibility labels/roles used for testing without coordination
- commit secrets, tokens, passwords, or `.env`
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
cd frontend && npm run lint
cd frontend && npm run build
git diff --check
```

For UI changes affecting critical user flow, coordinate browser verification with `67070151` rather than weakening tests yourself.
