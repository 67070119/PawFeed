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

## Phase 4 — Mobile UX, GPS & Failure Handling — COMPLETED

Implemented:
- collapsible mobile navigation bottom sheet while keeping the primary action accessible
- GPS quality tiers (good/fair/poor) and explicit low-accuracy messaging
- off-route distance detection with accuracy-aware threshold and consecutive-fix debounce
- automatic rerouting from the latest GPS position with cooldown protection
- poor GPS accuracy suppresses automatic rerouting to avoid jitter-driven route churn
- reroute failure keeps the previous route and provides manual retry recovery
- GPS loss during Active Navigation preserves route/navigation context and allows GPS retry
- Playwright recovery coverage for auto-reroute, poor GPS, provider failure, GPS loss, and mobile sheet interaction

## Phase 5 — Verification & Polish — COMPLETED

Verified and finalized:
- Playwright navigation regression expanded to 16/16 tests
- route provider failure, reroute retry, GPS loss/recovery, poor-GPS guard and Start/Stop flows verified
- mobile portrait layout guards at 375×667, 390×844 and 430×932
- live configured routing provider smoke passed for DRIVING, WALKING and CYCLING
- Full Course Container `tuchsanai/devtools:2569_1` with E2E passed with exit code 0
- lint/build/audit/integration/smoke/persistence gates remain green
- requirements, acceptance criteria, traceability, architecture, evidence and README synchronized to the final navigation behavior

## Design boundary

PawFeed uses familiar map-app interaction patterns while keeping PawFeed visual identity. Navigation Redesign 5/5 is complete with Road Route Preview, Active Navigation, Follow/Recenter, GPS quality/recovery and off-route automatic rerouting. Remaining non-goals are voice guidance, live traffic-aware routing, background navigation after leaving the page, and a self-hosted routing engine.
