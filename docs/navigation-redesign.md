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

Current limitation: Route Preview is not yet Active turn-by-turn navigation; next-maneuver UI, off-route detection, and navigation start/stop state belong to Phase 3.

## Phase 3 — Active Navigation Mode

Planned:
- Start/Stop navigation state
- follow current position while navigating
- remaining distance and ETA
- next maneuver/instruction from route steps
- recenter behavior after the user moves the map

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

PawFeed may use interaction patterns familiar from map applications while keeping its own visual identity. Road Route Preview is integrated and verified in Phase 2, but PawFeed must not claim Active turn-by-turn navigation until Phase 3 capabilities are implemented and verified.
