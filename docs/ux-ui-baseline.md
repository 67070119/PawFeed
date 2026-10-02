# PawFeed UX/UI Baseline

> Phase 1 baseline for the **PawFeed UX/UI Improvement** task.
>
> Review mode: code-based UX audit using `skills/microsoft-frontend-design-review/SKILL.md` and `skills/ux/SKILL.md`.
> This phase records findings only and does not intentionally change product behavior.

## 1. Current visual direction

PawFeed already has a usable visual identity: dark gunmetal surfaces, muted sand accent, map-first presentation, compact cards, responsive breakpoints, and dedicated map/navigation UI. The goal of the following phases is to **polish and normalize the existing direction**, not redesign the product from scratch.

The strongest existing areas are:
- map-first home experience with current-location/radius controls,
- clear point-detail hero and primary navigation CTA,
- dedicated full-screen navigation experience,
- responsive rules across several breakpoints,
- profile feeding history with skeleton, grouping, empty state, and useful deep links,
- global `:focus-visible` support and mobile form font-size guardrail.

## 2. Screen inventory

| Route / area | Main implementation | Current states observed | Baseline priority |
|---|---|---|---|
| `/` | `app/page.js`, `PawMap`, `RadiusFilter` | loading, map error, geolocation error, disabled radius | High |
| `/login` | `app/login/page.js` | submit loading, API error | High |
| `/register` | `app/register/page.js` | submit loading, password mismatch/API error | High |
| `/points/create` | `app/points/create/page.js`, `MapPicker` | protected, validation error, locating, image preview, location modal, submit loading | High |
| `/points/:id` | `app/points/[id]/page.js` | loading, fetch error, success/error feedback, empty histories, photo lightbox, action busy | High |
| `/points/:id/navigate` | `app/points/[id]/navigate/page.js`, `NavigationMap` | GPS/route loading, GPS/route/reroute errors, off-route, recovery, active navigation, collapsed sheet | High |
| `/profile` | `app/profile/page.js`, `ProfileNav` | protected, error, empty lists | Medium |
| `/profile/points` | `app/profile/points/page.js`, `ProfileNav` | protected, error, empty list | Medium |
| `/profile/feedings` | `app/profile/feedings/page.js`, `ProfileNav` | protected, skeleton loading, error, grouped history, empty state | Medium |
| Global navigation/layout | `layout.js`, `NavBar.js`, shared CSS | auth-aware desktop/mobile nav | High |
| Global visual system | `globals.css`, `theme.css` | tokens, buttons, inputs, cards, responsive/map/navigation overrides | High |

## 3. Prioritized findings

### MAJOR — fix during planned implementation phases

1. **CSS has multiple competing visual layers**
   - `globals.css` still contains an older light/green system while `theme.css` overrides it with several later dark palette passes.
   - `theme.css` is over 2,000 lines and contains repeated overrides for the same selectors/tokens.
   - Risk: inconsistent states, hard-to-predict cascade, and future UI changes producing page-specific regressions.
   - Target: Phase 2.

2. **Form semantics and field feedback need normalization**
   - Login/Register labels are not explicitly associated with inputs via `htmlFor/id`.
   - Auth inputs have no explicit autocomplete intent.
   - Errors are mostly page-level rather than field-level; users must infer which input caused a validation failure.
   - Create-point validation is also mostly global after submit.
   - Target: Phases 2, 6, 8.

3. **Custom dialogs do not fully manage keyboard focus**
   - Create-point location picker uses `role="dialog"` but has no Escape handling, initial focus management, focus trap, or focus restoration.
   - Point photo lightbox supports Escape but does not trap/restore focus.
   - Target: Phases 5 and 6.

4. **Reduced-motion preference is not implemented**
   - UI uses transitions/animations and Leaflet `flyTo/flyToBounds`, but no `prefers-reduced-motion` rule is present.
   - Target: Phases 2 and 10.

5. **Profile overview and point list have weak loading-state visibility**
   - `/profile` initially renders zero counts/empty content before requests resolve.
   - `/profile/points` can similarly show an empty list while loading.
   - `/profile/feedings` already has the stronger skeleton pattern and should be the reference.
   - Target: Phase 9.

6. **Navigation recovery is heavily GPS-dependent**
   - `NavigationMap` supports manual picking, but the current navigate page does not expose that path.
   - When location permission fails, the visible recovery path mainly asks the user to retry GPS.
   - This should be reconciled with the documented PawFeed flow that allows manual origin selection, without changing backend contracts.
   - Target: Phase 7.

7. **System messages are not announced consistently**
   - Some navigation messages correctly use `role="status"`, but shared `.errorBox/.successBox` usages generally have no alert/status semantics.
   - Target: Phases 2, 5, 6, 8, 9.

8. **File upload controls need keyboard review**
   - Create-point uses clickable `label` wrappers around hidden file inputs for the empty and replace-image states.
   - The visible upload surface is not guaranteed to behave as a clear keyboard-focusable control.
   - Target: Phase 6.

### MINOR — polish while touching each area

- Mobile navigation should expose clearer active-page state and stronger menu dismissal behavior.
- Home map error state should offer a clearer retry/recovery action instead of message-only feedback.
- Raw backend enum text such as `DOG` / `ACTIVE` is still visible in some profile views while other screens use Thai labels.
- Profile empty states should include a useful next action where appropriate.
- Auth pages contain two visually prominent headings; heading hierarchy should be reviewed semantically.
- Point-detail success/error feedback can be more contextual and consistently announced.
- Map/custom icon accessibility should be verified with keyboard and screen-reader-oriented testing rather than assumed from Leaflet defaults.
- Navigation bottom sheet density/internal scrolling needs viewport testing on short mobile screens.

## 4. Design-review principles for implementation

All following phases should preserve these priorities from the installed skills:

1. **Task completion first** — one obvious primary action per screen/step where practical.
2. **Consistent action hierarchy** — primary, secondary, destructive, and disabled states must mean the same thing across routes.
3. **Visible system status** — loading, locating, saving, rerouting, success, and error states should always be understandable.
4. **Recovery over dead ends** — errors should provide a next action when recovery is possible.
5. **Shared design tokens/components** — avoid adding another page-specific layer to the existing CSS cascade.
6. **WCAG-oriented interaction quality** — visible focus, labels, keyboard access, semantic status messages, adequate touch targets, and reduced motion.
7. **Map-first usability** — overlays must not block essential map content or controls on small screens.
8. **Preserve current business behavior** — UX improvements must not silently change API contracts or PawFeed core flows.

## 5. Phase mapping

- **Phase 2:** consolidate visual foundation, tokens, shared states, reduced-motion baseline.
- **Phase 3:** navigation/layout consistency and active/mobile behavior.
- **Phase 4:** home/map feedback, controls, marker/popup interaction.
- **Phase 5:** point detail hierarchy, feedback, lightbox accessibility.
- **Phase 6:** create-point form, validation, upload, location-dialog accessibility.
- **Phase 7:** navigation status hierarchy, recovery/manual-origin UX, map overlay density.
- **Phase 8:** auth labels, autocomplete, validation, feedback, hierarchy.
- **Phase 9:** profile loading/empty/error patterns and localized labels.
- **Phase 10–12:** responsive/accessibility validation, regression testing, and fixes.

## 6. Phase 1 conclusion

No product-flow redesign is needed. PawFeed already has a solid visual base; the biggest quality gain will come from **reducing design-system inconsistency and improving interaction/accessibility states**, then polishing each route using the same shared patterns.
