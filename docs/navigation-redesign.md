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

Current limitation: the dashed connection is still straight-line guidance. It is not a road route.

## Phase 2 — Route Preview UX — NEXT

Planned:
- integrate a road-routing engine
- request route geometry between current position and destination
- show route polyline following roads
- distance and ETA from routing response
- travel-mode selection supported by the chosen routing engine
- clear route loading/unavailable states

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

PawFeed may use interaction patterns familiar from map applications, but it should keep its own visual identity and must not claim road routing or turn-by-turn navigation until those capabilities are actually integrated and verified.
