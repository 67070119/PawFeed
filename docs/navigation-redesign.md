# PawFeed Navigation Redesign

Goal: make the PawFeed in-web navigation experience map-first and familiar to users of modern map apps while keeping PawFeed branding and avoiding misleading routing claims.

## Phase 1 — Navigation UX Foundation — COMPLETED

Implemented:
- full-screen map experience that overlays the normal PawFeed header
- floating origin/destination route card
- mobile bottom sheet for distance, GPS state, and navigation actions
- floating recenter control
- current-position accuracy circle when GPS accuracy is available
- preserved HTTPS GPS and manual map-position fallback
- mobile viewport verification at 390×844

## Phase 2 — Route Preview UX — COMPLETED

Implemented:
- backend OSRM-compatible routing adapter behind `GET /api/navigation/route`
- road-route geometry rendered as a solid route polyline
- route distance and ETA from routing response
- DRIVING, WALKING, and CYCLING preview modes
- routing validation, timeout, and transient retry
- direct-line fallback only when road routing is unavailable
- deterministic Docker routing mock for E2E/CI plus separate live provider smoke verification

## Phase 3 — Active Navigation Mode — COMPLETED

Implemented:
- explicit Start/Stop active navigation state
- GPS-follow map behavior during active navigation
- remaining distance and ETA derived from progress along route geometry
- next maneuver/instruction derived from normalized route steps
- arrival state near the destination
- user map drag pauses follow; Recenter resumes GPS follow
- mobile Playwright flow verifies movement, maneuver progression, recenter, arrival, and stop

Current limitation: Phase 3 does not detect off-route movement or automatically request a replacement route; those failure/recovery behaviors remain Phase 4.

## Phase 4 — Mobile UX, GPS & Failure Handling

Planned:
- safe-area and compact-screen polish
- bottom-sheet interaction/collapse behavior
- GPS denied/low-accuracy messaging
- off-route handling and route recalculation
- route/GPS/network failure UX

## Phase 5 — Verification & Polish

Planned:
- expanded Playwright navigation coverage
- route API failure tests
- start/stop navigation tests
- mobile viewport coverage
- final lint/build/Course Container verification
- synchronize requirements, acceptance criteria, traceability, and evidence

## Design boundary

PawFeed may use interaction patterns familiar from map applications while keeping its own visual identity. Active in-web navigation with route-step guidance is integrated and verified in Phase 3. Off-route detection, automatic rerouting, voice guidance, and deeper mobile failure polish remain outside the completed Phase 3 scope.
