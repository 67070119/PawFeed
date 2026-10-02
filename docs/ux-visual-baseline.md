# PawFeed Visual QA Baseline

Phase 1 baseline for **PawFeed Visual QA & Responsive Repair**.

This audit intentionally treats rendered screenshots and real interaction geometry as the primary evidence. Passing lint/build/E2E alone is not considered sufficient UX evidence.

## Coverage

Routes captured:

- `/`
- `/login`
- `/register`
- `/points/create`
- `/points/:id`
- `/points/:id/navigate`
- `/profile`
- `/profile/points`
- `/profile/feedings`

Viewport coverage:

- 1440×900 desktop
- 1280×720 laptop
- 768×1024 tablet
- 430×932 mobile
- 390×844 mobile
- 375×667 mobile
- 320×568 narrow mobile
- 844×390 landscape for map/navigation interaction states

Interaction states additionally captured:

- mobile navigation menu open
- create-point map picker open
- point-detail image lightbox open
- navigation bottom sheet expanded
- navigation bottom sheet collapsed
- navigation landscape
- create map picker landscape

The capture set produced 88 screenshots plus structured viewport metrics. Screenshots were kept as temporary QA evidence rather than committed product assets.

## Environment note

The headless Chromium host used for capture does not currently have a Thai glyph font installed, so Thai text appears as fallback boxes in screenshots.

This is **not** treated as a PawFeed UI defect. Geometry, overlap, element bounds, scrolling behavior, map controls, cards, sheets and viewport clipping remain usable evidence. Typography must still be visually rechecked in a real client browser after layout fixes.

## Blocking / major findings

### VQA-01 — Navigation primary CTA leaves the viewport in mobile landscape

**Severity:** BLOCKING
**Route:** `/points/:id/navigate`
**Viewport:** 844×390 landscape

With the navigation sheet expanded:

- viewport height: **390 px**
- bottom sheet: top **191**, bottom **378**
- primary navigation CTA: top **427**, bottom **474**

The CTA exists in the DOM but is completely outside the visible viewport. This directly matches the reported problem where an action button is hidden/blocked on responsive layouts.

**Likely root cause:** the bottom sheet has multiple historical sizing/max-height rules split across `globals.css` and `theme.css`, but no low-height/landscape layout contract.

**Target phase:** Phase 2 foundation + Phase 6 Navigation.

---

### VQA-02 — Narrow navigation CTA touches/exceeds viewport bottom

**Severity:** MAJOR
**Route:** `/points/:id/navigate`
**Viewport:** 320×568

Expanded state:

- viewport height: **568 px**
- bottom sheet height: **261 px**
- primary CTA: top **523**, bottom **569**

The CTA extends one pixel beyond the measured viewport before accounting for real mobile browser chrome/safe-area behavior. This is fragile and can become partially obscured on actual devices.

The bottom sheet also consumes roughly 46% of the narrow viewport, leaving limited map context.

**Target phase:** Phase 2 foundation + Phase 6 Navigation.

---

### VQA-03 — Profile navigation silently clips items on small screens

**Severity:** MAJOR
**Routes:** `/profile*`

At 390 px:

- profile nav client width: **360 px**
- content scroll width: **407 px**
- third tab extends to x=414 while nav ends around x=376

At 320 px:

- profile nav client width: **290 px**
- content scroll width: **407 px**
- third tab again extends to x=414 while nav ends around x=306

The tab strip is horizontally scrollable with its scrollbar hidden. The final destination is partially off-screen with no strong affordance that the navigation must be swiped.

This does not create page-level horizontal overflow, but it hurts navigation discoverability.

**Target phase:** Phase 2 foundation + Phase 8 Profile.

---

### VQA-04 — Create Point primary action is buried by excessive vertical layout

**Severity:** MAJOR UX friction
**Route:** `/points/create`

Primary submit position from the top of the page:

| Viewport | Viewport height | Page height | Submit top |
|---|---:|---:|---:|
| 1440×900 | 900 | 1301 | 1186 |
| 390×844 | 844 | 1503 | 1405 |
| 320×568 | 568 | 1579 | 1481 |

The button is not being covered by another element, but the current step-card sizing and vertical spacing make the core action unusually distant, including on desktop.

The form should remain scrollable, but the information density and card heights need to be reduced so users can understand progress and reach the action without excessive scrolling.

**Target phase:** Phase 2 foundation + Phase 4 Create Point.

---

### VQA-05 — Point Detail puts the primary Navigate action below the first mobile viewport

**Severity:** MAJOR UX friction
**Route:** `/points/:id`

Measured Navigate CTA:

- 1440×900: top **625**, visible in first viewport
- 390×844: top **905**, below first viewport
- 320×568: top **905**, far below first viewport

The mobile hero/media area alone is approximately **250 px** high in the tested state, and the full mobile detail page is approximately **1999–2051 px** tall.

For a point-discovery product, Navigate is one of the primary user goals and should be surfaced earlier on mobile rather than requiring a long first scroll.

**Target phase:** Phase 5 Point Detail.

---

### VQA-06 — Responsive CSS has competing historical layers

**Severity:** MAJOR root-cause / maintainability

Navigation, Profile and overlay layout rules are repeated across many locations, including:

- early Navigation rules in `globals.css`
- several Navigation breakpoint blocks in `theme.css`
- multiple later `.navBottomSheet` and `.navSheetCollapsed` overrides
- multiple `.profileMiniNav` mobile definitions
- repeated `.locationPickerOverlay` grid definitions

Examples include `theme.css` rules around the Navigation sections near the 500–900, 1900–2050 and 3400+ regions, plus the compressed Navigation block in `globals.css`.

This makes viewport behavior dependent on late cascade order and explains why functional fixes can pass tests while another breakpoint still regresses.

Phase 2 should establish one clear responsive contract before page-specific polishing.

---

## Minor / polish findings

### VQA-07 — Home mobile overlay density is high

The Home map itself remains usable and has no page-level overflow, but mobile simultaneously presents:

- top brand/menu
- nearby-count badge
- locate control
- zoom control
- user marker/accuracy circle
- radius filter card
- attribution

At 320–390 px this creates a busy map chrome layer. Controls are still reachable, so this is polish rather than a blocking defect.

**Target phase:** Phase 3 Home.

### VQA-08 — Auth desktop composition leaves excessive unused space

Login/Register remain usable and responsive, but desktop compositions use a relatively narrow form area against a large empty canvas. The mobile layouts are more proportionate.

This should be reviewed as a visual-hierarchy issue, not redesigned into a new auth flow.

**Target phase:** Phase 7 Authentication.

## Interaction checks that passed

- No page-level horizontal overflow was detected on the captured primary routes across the seven main viewports.
- Mobile menu opens inside the viewport and can be dismissed.
- Create Point map picker opens and retains a visible confirmation CTA in portrait.
- After allowing map tiles time to load, the create location map renders correctly in both 390×844 portrait and 844×390 landscape.
- Point lightbox opens as a full-screen overlay.
- Navigation collapsed state retains a primary Start action.
- Navigation primary button text does not overflow its own collapsed button bounds at 390/320 in the current test environment.
- Home map controls remain reachable in the captured portrait layouts.

## Priority order for implementation

1. Establish global viewport/safe-area/overlay/bottom-sheet layout rules.
2. Fix Navigation low-height/landscape CTA visibility first.
3. Fix Profile small-screen navigation clipping.
4. Reduce Create Point vertical density and surface task progress/action better.
5. Surface Navigate earlier on mobile Point Detail.
6. Polish Home/Auth/Profile visual hierarchy only after the blocking layout rules are stable.

## Phase 1 conclusion

The earlier automated suite was correct about functional behavior, but it did not catch the most important responsive defect: an element can exist, be technically visible in CSS, and still sit outside the actual viewport.

The next phase must therefore repair the shared responsive layout contract before further page-level visual polish.

## Phase 2 responsive-contract validation

Phase 2 consolidated the late responsive/accessibility override layer instead of adding another page-specific patch. The shared contract now defines dynamic-viewport/safe-area behavior, consistent page gutters, shared touch targets, full-screen overlay height, mobile profile tabs, and a navigation sheet whose primary action remains reachable on low-height screens.

Measured after rebuilding the frontend runtime:

- Navigation 844×390 landscape: primary CTA moved from baseline `top 427 / bottom 474` outside a 390 px viewport to `top 324 / bottom 371`, fully visible.
- Navigation 320×568: primary CTA now measures `top 507 / bottom 553`, leaving usable bottom margin instead of touching/exceeding the viewport edge.
- Profile 390 px: mini-nav changed from `clientWidth 360 / scrollWidth 407` to `360 / 360`.
- Profile 320 px: mini-nav changed from `clientWidth 290 / scrollWidth 407` to `290 / 290`; all three destinations fit in the shared grid.
- Create location picker height matches the dynamic viewport exactly at both 390×844 and 320×568.
- Cross-route horizontal-overflow scan checked 9 routes × 7 viewports = 63 combinations with **0 page-level horizontal overflow findings**.
- Frontend lint, production build and `git diff --check` pass.

Direct execution of deterministic E2E specs against the ordinary dev stack was intentionally not used as a pass/fail signal because that stack calls the live routing provider; route maneuver/duration assertions therefore differed from the test fixture. The canonical isolated E2E environment remains scheduled for Phase 11.

Remaining page-specific density/hierarchy findings (Create Point length, Point Detail CTA placement, Home chrome density, Auth composition and Profile content polish) remain assigned to their later phases rather than being patched into the global contract.

## Phase 3 Home map validation

Home-specific visual QA focused on the actual map chrome rather than functional pass/fail only.

Resolved:

- Mobile Zoom controls no longer overlap the bottom radius panel. At 320×568 the radius panel starts at y=439 while Zoom ends at y=416.
- GPS-denied/error status no longer overlaps either Zoom or the radius panel. On 390×844 the status card ends at y=702, Zoom ends at y=692 in a separate right-side control rail, and the radius panel begins at y=749.
- Mobile status/error cards reserve the right-side map-control rail and use a full-width retry action within their own card.
- The mobile radius panel is more compact by removing redundant helper copy while keeping the radius value, slider and endpoint labels.
- Marker popups now auto-pan with top/bottom chrome padding, remain below the map topbar on narrow screens, and use a narrower popup width at 320 px.
- Zoom controls temporarily hide while a marker popup is open and return immediately after the popup closes, preventing popup/control overlap without changing map interaction or detail navigation.
- The mobile menu background is more opaque so map content behind it no longer competes with menu actions.

Validation:

- Home geometry matrix: desktop 1440×900, laptop 1280×720, tablet 768×1024, 430×932, 390×844, 375×667, 320×568 and 844×390 landscape all reported no page-level horizontal overflow, no home control outside the viewport, no summary/location overlap and no radius/Zoom overlap.
- Mobile menu at 390×844 stays fully inside the viewport.
- Marker popup at 320×568 stays inside the usable viewport below the topbar; the `ดูรายละเอียด` CTA remains visible.
- Popup open state has zero Zoom controls; after closing, one Zoom control group returns.
- GPS-denied state reports no status/Zoom, status/radius or radius/Zoom intersection.
- Frontend lint, production build and `git diff --check` pass.

The remaining Home map behavior and visual hierarchy is acceptable for this phase; Create Point, Point Detail and Navigation density issues remain assigned to their own phases.

## Phase 4 Create Point validation

Create Point was reflowed without changing the POST contract, required fields or location/image behavior.

Resolved:

- Desktop Step 1 and Step 2 now share a two-column row, while Step 3 remains full width.
- Desktop Step 3 places description and usual-time controls side by side, reducing unnecessary vertical length.
- Tablet/mobile/narrow layouts keep a persistent bottom action bar so Cancel and the primary Create action remain reachable without scrolling to the end of the form.
- Mobile controls use scroll margin so focused fields remain above the fixed action bar on reduced-height/keyboard-like viewports.
- Empty upload and selected image/location previews are shorter but preserve the same controls and data.
- Mobile time inputs use two columns when space permits and fall back to one column on very narrow screens.
- Low-height map picker layout reduces topbar/footer height to preserve more usable map area while keeping the confirmation action visible.

Measured improvement:

- Desktop 1440×900: page height reduced from **1301 px to 967 px**; primary Submit moved from `top 1186 / bottom 1231` to `top 852 / bottom 897`, fully inside the first viewport.
- Mobile 390×844: page height reduced from **1499 px to 1262 px**; fixed actions remain at `top 770 / bottom 836`.
- Narrow 320×568: page height reduced from **1575 px to 1425 px**; fixed actions remain at `top 496 / bottom 560`, with the primary Submit at `504–552`.
- Simulated short mobile viewport 390×500: focused description field measured `157–247`, while the fixed action bar remained `426–492`; no overlap.
- Landscape picker 844×390: map area increased from **245 px to 271 px**; topbar reduced from 74 px to 61 px and footer from 71 px to 58 px.

Interaction validation:

- Empty submit still focuses the first invalid control (location picker button) with `aria-invalid=true`.
- Location picker, current-location selection, image upload and validation remain functional.
- A real mobile-sized UI submission created a new CAT point and redirected to `/points/:id`.
- The newly created point detail rendered the submitted description `Phase 4 responsive create flow`, confirming the create payload and redirect path remained intact.
- No horizontal overflow was detected in the audited Create Point viewports.
- Frontend lint, production build and `git diff --check` pass.

## Phase 5 Point Detail validation

Point Detail was repaired around the real mobile task priority: navigate first, then inspect the photo/details, then record assistance/status activity. Product data and API behavior remain unchanged.

Resolved:

- Added a mobile-only primary `นำทางไปจุดนี้` action directly after the detail header so the primary task is visible before the hero image.
- The existing hero Navigate action remains unchanged for desktop/tablet and is hidden only on mobile, avoiding duplicate visible/focusable CTAs.
- Mobile header uses a compact two-column layout so the Back action no longer consumes a full extra row.
- Mobile hero/media height was reduced while keeping the full-screen image affordance.
- Mobile metadata remains complete but uses a denser two-column layout with the final item spanning the row.
- Feeding/status cards, textarea, report history and feeding history use tighter mobile spacing without removing information.
- Report confirmation stays two columns where space permits and falls back to one column on very narrow screens.
- Removed the duplicated legacy `.pointReportHistory` CSS rule that was present twice consecutively.

Measured improvement:

- Mobile 390×844: Navigate moved from baseline `top 885 / bottom 929` to `top 196 / bottom 244`, fully inside the first viewport.
- Narrow 320×568: Navigate moved from `top 905 / bottom 949` to `top 207 / bottom 255`.
- Mobile 390 page height reduced from **2084 px to 1718 px**.
- Narrow 320 page height reduced from **2156 px to 1794 px**.
- Mobile 390 action area reduced from **777 px to 646 px** while keeping feeding, status update and recent-report content.
- No horizontal overflow was detected across desktop 1440×900, laptop 1280×720, tablet 768×1024, 430×932, 390×844, 375×667 and 320×568.

Interaction validation:

- Mobile Navigate CTA at 320×568 measured 292×48 px and routed successfully to `/points/:id/navigate`.
- Feeding submission succeeded and the new note appeared first in feeding history.
- `ยังพบสัตว์อยู่` report succeeded and appeared first in recent reports.
- `ไม่พบแล้ว` confirmation opens and Cancel closes it correctly.
- Lightbox was revalidated with a real JPEG image: image remains inside both 390×844 and 320×568 viewports, close control receives focus, body scroll locks, and Escape closes the dialog.
- Frontend lint, production build and `git diff --check` pass.

## Phase 6 Navigation validation

Navigation was refined around map-first use, recovery clarity and low-height responsiveness without changing the routing API, GPS tracking rules, reroute behavior or manual-start fallback.

Resolved:

- Collapsed navigation is now a compact action pill instead of a nearly full-width dark panel.
- Mobile preview density was reduced while keeping travel mode, ETA/distance, GPS quality and the primary action visible.
- GPS recovery actions are displayed side by side on normal mobile widths, reducing sheet height without removing either recovery path.
- Manual-route actions use available horizontal space where practical and fall back to a single column on very narrow screens.
- Manual-pick guidance is offset below the recenter control instead of touching it.
- Low-height landscape now uses a right-side route panel rather than a centered bottom sheet, preserving substantially more map area.
- Landscape recenter control moves to the left control rail so it does not collide with the side panel.
- Route fitting now uses orientation-aware padding: portrait reserves bottom-sheet space, while landscape reserves right-side panel space.
- `NavigationMap` invalidates its Leaflet size and recomputes route fit when the viewport changes, so orientation/resize does not keep stale route padding.

Measured improvement:

- Mobile 390×844 expanded sheet reduced from **287 px to 269 px**.
- Mobile 390 collapsed sheet width reduced from **370 px to 210 px**.
- Narrow 320×568 collapsed sheet width reduced from **300 px to 210 px**.
- GPS-denied sheet at 390×844 reduced from **332 px to 259 px**, with both recovery actions remaining 46 px high and visible in one row.
- Active-navigation sheet at 390×844 reduced from **245 px to 234 px**.
- Landscape 844×390 changed from a centered 500 px-wide bottom sheet to a **388 px right-side panel**, leaving the left map region available for route context.

Interaction validation:

- Travel mode switched from Driving to Walking and the selected mode reported `aria-pressed=true`.
- Active navigation starts successfully and exposes `สิ้นสุดการนำทาง`.
- Dragging the active map shows the follow/recenter notice; pressing the recenter control removes that notice.
- Collapsing during active navigation keeps the Stop action fully inside the compact 210 px pill; expanding and stopping returns to preview mode.
- GPS-denied flow opens manual selection; clicking the map creates a manual origin, returns an OSRM road route, and exposes `ใช้ GPS เพื่อเริ่มนำทาง` plus `เปลี่ยนจุดเริ่มต้น`.
- Landscape route fit rendered both permanent endpoint tooltips entirely to the left of the route panel; no endpoint tooltip intersected the panel.
- Landscape map remains 844×390 with two road-route paths rendered and no page-level horizontal overflow.
- Frontend lint, production build and `git diff --check` pass.

## Phase 7 Authentication validation

Authentication was compacted and revalidated without changing registration/login payloads, password rules, safe redirect behavior or backend error handling.

Resolved:

- Desktop Register no longer forces page scrolling at 1440×900; the full registration card and primary action fit within the viewport.
- Mobile Register password requirements stay in a compact three-item row instead of becoming three tall stacked cards.
- Register spacing is reduced independently from Login so the shorter Login flow is not over-compressed.
- The narrow 320 px layout hides only redundant visual intro/help copy while preserving the name help text in the accessibility tree.
- Password show/hide controls retain clear 36 px controls inside the input without shrinking the input hit target.
- The earlier fixed/sticky Register CTA experiment was removed after visual QA showed it could overlap password requirements on short viewports; the final CTA stays in normal document flow.
- Mobile horizontal gutters are explicitly preserved at 16 px (390 px width) and 12 px (320 px width), preventing the form from touching viewport edges.

Measured improvement:

- Desktop Register 1440×900: document height reduced from **978 px to 900 px**; Submit moved from `753–798` to `696–741` and remains fully visible.
- Mobile Register 390×844: document height reduced from **919 px to 844 px**; Submit moved from `755–799` to `614–662`.
- Narrow Register 320×568: document height reduced from **924 px to 693 px**; Submit moved from `760–804` to `511–559`, fully inside the first viewport.
- Short viewport 390×500 keeps the form scrollable without overlay; after focusing Confirm Password, the field measured `261–308` and Submit `318–366` with no intersection.
- No horizontal overflow was detected on Login or Register at desktop, tablet, mobile, narrow or short-height viewports.

Interaction validation:

- Empty Register validation focuses `register-name` and exposes field-level errors.
- Password toggle changes the password input from `password` to `text` and all three password-requirement indicators become met for a valid password.
- Invalid Login still returns and displays `อีเมลหรือรหัสผ่านไม่ถูกต้อง`.
- A real Register submission succeeded and redirected to `/login`.
- Login layout remained usable at 320×568 with its primary action fully visible.
- Frontend lint, production build and `git diff --check` pass.

## Phase 8 Profile validation

Profile routes were repaired around compact activity review, predictable mobile navigation, trustworthy loading/error states and media that cannot dominate a card. Profile APIs and data semantics remain unchanged.

Resolved:

- `/profile`, `/profile/points` and `/profile/feedings` now suppress their normal data/empty content while an API error is active, so a failed request cannot be mistaken for a real zero/empty result.
- Profile tabs remain simultaneously visible on supported mobile widths and now provide at least a 44 px touch target.
- Mobile overview keeps all three activity stats in one row instead of stacking the third stat onto a second row.
- Mobile `จุดที่ฉันสร้าง` cards use a compact media/content split instead of placing a tall portrait image above the content.
- Desktop point-card media is bounded to 180 px so a portrait upload cannot force the whole card to follow the image's intrinsic aspect ratio.
- Mobile feeding history returns to a compact horizontal media/content card instead of a full-width 170 px image block.
- Feeding count is positioned beside the mobile heading, reducing the blank vertical step before profile navigation.
- Profile activity/detail links were normalized to a minimum 44 px interactive height.
- Empty and loading states remain available; error Retry stays visible while unreliable content is hidden.

Measured improvement:

- `/profile` at 390×844: page height reduced from **1149 px to 930 px**; first recent activity moved from `top 757` to `top 533`.
- `/profile` at 320×568: page height reduced from **1180 px to 950 px**; first recent activity moved from `top 776` to `top 541`.
- `/profile/points` at 390×844: one point card reduced from **511 px to 210 px**; page height reduced from **1022 px to 844 px**.
- `/profile/points` at 320×568: one point card reduced from **511 px to 195 px**; page height reduced from **1017 px to 642 px**.
- Desktop `/profile/points`: portrait-image card reduced from **392 px to 196 px** and the content panel from **485 px to 289 px**.
- `/profile/feedings` at 390×844: feeding card reduced from **288 px to 130 px**.
- `/profile/feedings` at 320×568: feeding card reduced from **288 px to 144 px**; page height reduced from **748 px to 568 px**.
- No page-level horizontal overflow was detected at 1440×900, 1280×720, 768×1024, 430×932, 390×844, 375×667 or 320×568 on any Profile route.

State and interaction validation:

- Fresh-account `/profile`, `/profile/points` and `/profile/feedings` show the expected actionable empty states (`เพิ่มจุดแรก` or `กลับไปดูแผนที่`).
- On 320 px width, all three profile tabs route correctly and the selected destination reports `aria-current="page"`.
- Forced API errors on all three Profile routes show the error + Retry while the normal content and empty state are not visible.
- Removing the forced error and pressing Retry clears the error and restores the real empty state.
- Delayed feeding-history response reports `aria-busy="true"` and renders three loading skeletons while waiting.
- Frontend lint, production build and `git diff --check` pass.

## Phase 9 Cross-page visual and interaction validation

Validated the repaired runtime as one product rather than as isolated screens. The test account used real register/login, point creation and feeding flows; route content was not replaced with mock UI data.

Portrait viewport matrix:

- Checked `/`, `/points/create`, `/points/:id`, `/points/:id/navigate`, `/login`, `/register`, `/profile`, `/profile/points` and `/profile/feedings` at 1440×900, 1280×720, 768×1024, 430×932, 390×844, 375×667 and 320×568.
- No page-level horizontal overflow was detected on any checked route/viewport.
- Each checked primary action could be brought into the viewport and its center point was not covered by another visible layer.
- The only fixed element intentionally outside the viewport during normal browsing is the skip link before keyboard focus.
- No unexpected page-level nested scroll container was found in the normal portrait screens.
- Every checked route exposed one visible page heading.

Overlay and focus validation:

- Mobile navigation opens with the first menu item focused; Escape closes it and restores focus to the menu button.
- Create-point map picker exactly follows the dynamic viewport at 390×844 and 667×375 landscape; its footer/Confirm action stays inside the viewport with no internal vertical scroller.
- Map picker initially focuses its Back action; Escape closes the dialog and returns focus to the opener.
- Point-detail lightbox locks body scrolling, focuses the Close action, closes on Escape and restores focus to the photo opener.
- Register at 390×500 keeps Confirm Password (`261–308`) and Submit (`318–366`) separated after focus/scroll; no CTA overlap occurs.

Map and navigation validation:

- Home marker popup was clicked using the marker's actual screen hit area. After Leaflet auto-pan completed on 320×568, the popup measured `top 96 / bottom 375`; its detail CTA measured `319–357`, remained inside the viewport and was unobscured.
- Navigation landscape was checked at 932×430, 844×390 and 667×375. The route sheet uses the intended right-side panel layout without horizontal overflow.
- Expanded navigation keeps Start Navigation above the viewport bottom (`364–411` at 932×430, `324–371` at 844×390, `311–357` at 667×375).
- Collapse/expand returns to the same reachable layout. The collapsed state intentionally retains a compact primary-action pill rather than hiding the action.
- At 844×390 and 667×375, pressing Start Navigation changed the primary action to `สิ้นสุดการนำทาง`; at 932×430 a follow-up wait confirmed the route becomes ready and exposes an enabled `เริ่มนำทาง` action at `364–411`.

Visual review:

- Representative post-repair screenshots were inspected for desktop, 390 px mobile, 320 px narrow mobile, Home popup and all three landscape navigation widths.
- Header/nav, content gutters, map controls, bottom controls, auth forms and Profile cards remain visually consistent across route transitions.
- No new blocking visual, responsive or interaction finding was identified in this phase.

Phase result: cross-page visual and interaction validation passes. Full automated regression remains scheduled for Phase 11, after the targeted visual guards in Phase 10.