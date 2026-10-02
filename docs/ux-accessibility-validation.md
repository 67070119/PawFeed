# PawFeed Accessibility & Responsive Validation

> Phase 10 validation for **PawFeed UX/UI Improvement**.
>
> Mode: UX AUDIT / accessibility + responsive validation using `skills/ux/SKILL.md` and `skills/microsoft-frontend-design-review/SKILL.md`.
> This phase records findings for Phase 12; it does not intentionally change product behavior.

## Validation coverage

Runtime validation used the production Docker build and Chromium/Playwright with reduced-motion enabled.

Routes checked:
- `/`
- `/login`
- `/register`
- `/profile`
- `/profile/points`
- `/profile/feedings`
- `/points/create`
- `/points/:id`
- `/points/:id/navigate`

Viewports checked:
- 1440 × 900 desktop
- 768 × 1024 tablet
- 390 × 844 mobile
- 320 × 568 narrow mobile / reflow proxy

The protected/detail/navigation checks used a temporary audit account and point in the local E2E stack.

## Passed checks

- **Reflow / overflow:** no horizontal document overflow was detected on any checked route at 1440, 768, 390, or 320 px.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, no visible audited element retained animation/transition duration above 50 ms.
- **Skip navigation:** the skip link to `#main-content` was present on every checked route.
- **Images:** no visible `img` element was missing an `alt` attribute in the runtime scan.
- **Form semantics:** visible login/register/create-point text controls were associated with labels or equivalent accessible names, aside from the hidden file input finding below.
- **Page headings:** all content routes except the map home had one visible `h1`.
- **Mobile navigation:** at 390 px and 320 px, opening the mobile menu moved focus into the menu; Escape closed it and restored focus to the menu button.
- **Location picker dialog:** at 390 px and 320 px, the dialog opened with focus on its back button; Escape closed it and restored focus to the opener.
- **Map/navigation reflow:** home and in-web navigation did not create page-level horizontal overflow at the tested mobile widths.

## Actionable findings

### MAJOR — A11Y-01: visually hidden file input remains an invisible keyboard stop

**Location:** `frontend/src/app/points/create/page.js`, image upload input around the `visuallyHidden` file control.

The file input is reduced to approximately 1 × 1 px by `.visuallyHidden`, has no accessible label, and is still a native focusable file control. The visible upload button already triggers the input programmatically.

**Impact:** keyboard/switch users can encounter a focusable control that is effectively invisible and unnamed.

**Relevant criteria:** WCAG 2.4.7 Focus Visible; form control naming/operability expectations.

**Phase 12 fix:** remove the implementation-only file input from the sequential tab order and accessibility tree while keeping the visible upload button as the accessible interaction surface, or explicitly label and expose the input if it is meant to be independently operable.

### MAJOR — A11Y-02: small helper text has insufficient contrast

Several 9–10 px helper/counter labels use colors below the 4.5:1 requirement for normal text on the dark surface:

| Selector / use | Foreground | Background | Ratio | Required |
| --- | --- | --- | ---: | ---: |
| `.pointFieldHint`, `.fieldHint` | `#7f8789` | `#202428` | 4.26:1 | 4.5:1 |
| `.fieldLabelRow > span` | `#747d80` | `#202428` | 3.71:1 | 4.5:1 |
| `.fieldMetaRow > small:last-child` | `#70797c` | `#202428` | 3.51:1 | 4.5:1 |

Reference colors that already pass include `--muted #92989a` on `#202428` at about 5.34:1 and `#838c8f` on `#202428` at about 4.55:1.

**Relevant criterion:** WCAG 2.1 1.4.3 Contrast (Minimum).

**Phase 12 fix:** move helper/optional/counter text to a shared accessible-muted token with at least 4.5:1 contrast.

### MAJOR — UX-01: important touch targets are too short

Runtime bounding-box checks found:
- navigation bottom-sheet handle button: about **72 × 18 px** desktop and **72 × 16 px** mobile while expanded;
- radius range control: about **22 px high**, with an 18 px Chromium thumb.

These are important controls on map/navigation-heavy screens and are substantially below the UX skill's 48 × 48 target guideline.

**Impact:** harder touch acquisition, especially on small screens or for users with motor impairments.

**Phase 12 fix:** preserve the small visual handle/slider appearance but enlarge the interactive hit area to roughly 44–48 px minimum.

### MINOR — UX-02: inline navigation links have small tap areas

Examples observed at runtime:
- Login/Register switch link: about 15 px high.
- Profile `ดูทั้งหมด →` link: about 16 px high.
- Leaflet attribution is also very small, but it is third-party attribution rather than a PawFeed task control.

**Phase 12 fix:** add vertical padding/min-height to PawFeed inline action links without making them visually heavy.

### MINOR — SEM-01: map home has no page heading

The home map route has a labelled `main` landmark but no visible or screen-reader-only `h1`; other checked content routes have one visible `h1`.

**Impact:** page structure is less explicit for heading-based screen-reader navigation.

**Phase 12 fix:** add an appropriately hidden or unobtrusive `h1` describing the map page without adding visual clutter.

## Notes

- The hidden file input's 1 × 1 size is intentional visually, but its focusability is the issue; it should not be treated as a normal visible touch target.
- The tiny Leaflet attribution link is not considered a blocking PawFeed UX issue.
- The 320 px checks also act as a practical reflow stress test for narrow/mobile layouts; no page-level horizontal overflow was found.
- Full functional regression and existing Playwright suite execution belong to Phase 11.
- Full functional regression and existing Playwright suite execution belong to Phase 11.

## Phase 12 resolution

All PawFeed-owned actionable findings above were addressed:

- **A11Y-01 resolved:** the implementation-only file input is removed from sequential keyboard navigation with `tabIndex={-1}` and hidden from the accessibility tree; the visible upload button remains the user-facing control.
- **A11Y-02 resolved:** helper/optional/counter text now uses `#92989a` on the dark surface, approximately 5.34:1 contrast.
- **UX-01 resolved:** the radius slider now exposes a 48 px-high interaction area and the navigation sheet handle uses an enlarged touch target.
- **UX-02 resolved:** PawFeed auth-switch and profile section links now expose at least a 44 px-high tap area.
- **SEM-01 resolved:** the map home includes a visually hidden `h1` without adding visual clutter.
- A Phase 12 runtime spot check at 390 × 844 measured the radius slider at 48 px, the auth switch link at 44 px, and confirmed one `h1` on the map home.
- The location-picker grid was also corrected after regression testing exposed a zero-height map state when no error notice was present.
- The collapsed navigation sheet was corrected so collapsing retains the primary action instead of leaving only the handle.

Final functional verification is recorded in `docs/ux-regression-validation.md`.