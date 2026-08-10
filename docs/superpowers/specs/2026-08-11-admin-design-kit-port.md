# Spec: Port agency-portal design kit to custom-widgets admin

**Date:** 2026-08-11
**Source kit:** `/Users/aliamin/Documents/Work/agency-portal` (`src/components/ui/`, `src/app/globals.css`, `tailwind.config.ts`)
**Target:** `/Users/aliamin/Documents/Work/custom-widgets` — **admin side only**

## Intent

Apply the finished agency-portal design kit to the custom-widgets admin experience: dashboard (`/`), widget CRUD/editors (`/widgets/*`), settings (`/settings`), login (`/login`), and the admin shell (layout + sidebar). The client gets one consistent design language across both products' admin surfaces.

## Problem

The custom-widgets admin is an ad-hoc dark theme built from raw Tailwind utilities (`bg-neutral-950`, `bg-[#ffffff0a]`, repeated class strings, triplicated editor shell chrome, local one-off modals). There is no shared component set beyond `src/components/editor/controls.tsx`. The agency-portal kit is now the client's canonical design system and this admin must match it.

## Goal

- Admin visually and behaviorally matches the agency-portal kit: light theme, Inter, accent `#00a86b`, same controls, motion, focus glow.
- All admin pages use kit primitives (Button, Card, Input, Select, Switch, Badge, Tabs, Modal, ConfirmDialog, Toast, MetricCard, Table, Pagination, DropdownMenu, LoadingSpinner, SearchSelect, MultiSearchSelect).
- Zero behavioral regressions: same data flows, same save fetches, same auth gating.

## Hard boundary (NON-NEGOTIABLE)

The kit applies **only** to the admin. The widget runtime and saved customization data are untouched:

**DO NOT TOUCH:**
- `src/components/{GoogleReviewsWidget, GoogleReviewsPanel, GoogleReviewsCarousel, BeforeAfterWidget, ReviewLightbox, WidgetSkeleton, GoogleReviewsEmbed, GoogleReviewsCarouselEmbed, BeforeAfterEmbed}.tsx`
- `src/styles/widget.css`, `src/embed.tsx`, `src/widget-registry.ts`, `scripts/build-widget.mjs`, `public/widget.js`
- `src/app/api/embeds/**`, `src/app/e2e/harness/page.tsx`, `embed-site/`
- `src/lib/{widget-config, before-after-config, widget-mappers, widget-queries, prefetch, bootstrap, reviews-data, cache-headers, e2e-widget-ids}.ts`
- Saved config data shapes (`configToDbRow`/`configFromDbRow` contracts) and all `fetch` save calls in editors
- Widget preview mounts inside admin (`GoogleReviewsWidget`, `BeforeAfterWidget`, `ScaledCarouselPreview` scaling logic) — restyle the chrome around them, never the renderers or their props
- `ErrorBoundary.tsx` (shared with embed runtime)

**Verification of boundary:** `shasum -a 256 public/widget.js` must be identical before and after the work + `npm run build`.

## Why this is safe

- The embed runtime is a physically separate esbuild/Preact bundle with inline styles + Shadow DOM; Tailwind never reaches it.
- Admin pages already run under Tailwind v4 preflight (margin/padding reset), and widget previews already render correctly in that light DOM. The kit's extra CSS is class-scoped (`.ui-*`), and the touch-target hammer is non-`!important`, so preview inline styles always win.
- The only admin e2e UI dependency is the login form (`#email`, `#password`, button "Sign in") — these selectors will be preserved.

## Options considered

- **Option A (chosen):** Port the kit 1:1, light theme, reskin admin to light. Pros: exact match with the "perfect" kit, zero new design decisions, proven components. Cons: admin flips dark→light (intended). Effort: Medium.
- **Option B:** Adapt kit tokens to a dark variant. Pros: keeps current dark feel. Cons: invents an unvetted theme, violates "apply the perfect kit as-is". Effort: Medium+.
- **Option C:** Adopt shadcn/radix instead. Rejected — the client kit already exists and is hand-rolled by design.

## Implementation plan

1. **Branch:** `feature/admin-design-kit` off `feat/testing-alerts-e2e` (current HEAD, clean tree).
2. **Baseline hash:** record `shasum -a 256 public/widget.js`.
3. **Deps:** add `clsx`, `tailwind-merge`, `framer-motion`, `lucide-react`.
4. **Port kit files** → `src/components/ui/` (Button, Card, Input, Select, Textarea, Checkbox, Switch, Label, Badge, Table, Tabs, Modal, ConfirmDialog, Toast, Pagination, DropdownMenu, LoadingSpinner, MetricCard, SearchSelect, MultiSearchSelect, select-shared, index.ts) and `src/lib/utils/cn.ts`. Skip app-specific/heavy pieces: KanbanLeadCard, RichTextEditor (tiptap/turndown), PhoneInput, JsonViewer.
5. **globals.css:** replace with kit tokens (`@theme` + `:root` duplicate, Inter import, motion/a11y, `.ui-control/.ui-btn*/.ui-badge*/.ui-listbox/.ui-option/.ui-tabs-*/.ui-nav-item`, touch hammer); keep `.editor-scroll`, `.editor-slider`, `.editor-tab-enter` restyled to light; drop the Geist/`prefers-color-scheme: dark` block.
6. **layout.tsx:** light shell (`bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]`), mount `<ToastContainer/>` + `<ConfirmDialog/>` inside the authed branch (and login-safe), keep auth conditional, `ErrorBoundary`, sidebar offset.
7. **Sidebar.tsx:** reskin to light using `.ui-nav-item` + tokens; keep nav items/logout behavior.
8. **login/page.tsx + LoginSubmitButton.tsx:** kit Card/Input/Button; preserve `id="email"`, `id="password"`, accessible name matching /sign in/i.
9. **editor/controls.tsx:** re-implement internals over kit primitives while keeping every exported name + prop signature identical (`Section`, `Card`, `Field`, `Select`, `TextInput`, `NumberInput`, `Toggle`, `Slider`, `ColorField`) so the three `*-tabs.tsx` files compile unchanged. `Slider`/`ColorField` keep native range/color inputs, restyled.
10. **Editor shells** (`WidgetEditor`, `BeforeAfterEditor`, `CarouselEditor`): reskin icon rail/header/save bar with kit (Tabs optional — keep existing tab state logic); extract the ~60 lines of shared chrome into a shared `EditorShell` to kill the ×3 duplication. Keep all config/update contracts and preview mounts untouched.
11. **WidgetsHome.tsx:** reskin dashboard with MetricCard/Card/Badge/Button; replace local `EmbedCodeModal`/`ConfirmDeleteModal` with kit `Modal`/`showConfirm` + `showToast`; keep thumbnail preview mounts and `buildEmbedCode` output byte-identical.
12. **SettingsPage.tsx:** reskin allowed-domains CRUD with kit (Card, Input, Button, Table, Badge, showConfirm/showToast).
13. **index.ts barrel** for the new ui folder.

## Verification

- `npm run lint`, `npm run build` green.
- `shasum -a 256 public/widget.js` identical to baseline after build.
- `npx vitest run` green (3 unit suites).
- `npx playwright test --project=local` green (crud.local, embed.local, security.api) — requires local env; at minimum crud.local login flow must pass.
- Manual smoke: `/login`, `/`, `/settings`, all three `/widgets/*` editors — create/edit/delete a `[TEST]` widget, confirm toast/confirm dialogs, preview renders unchanged.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Accidental edit to shared widget file ships in `public/widget.js` | shasum gate before/after build; file allowlist in review |
| Kit global CSS alters widget previews in admin light DOM | Preflight already active today; kit CSS is class-scoped; hammer is non-`!important` |
| e2e login breakage | Preserve `#email`/`#password`/Sign-in button |
| Barrel/name collisions | No existing `Button`/`Input`/`Modal` names in admin; `controls.tsx` keeps its own exports |
| Next.js 16 API drift | Consult `node_modules/next/dist/docs/` per AGENTS.md if unsure |

## Baselines (recorded 2026-08-11)

- `public/widget.js` sha256: `1f3a81d8aa30776ac492783a40954eff1ca1280b3f67428c898b0177857ab16a`
- `esbuild@0.28.1`, `react@19.2.4`, `next@16.3.0` — must remain unchanged after `npm install` of new deps (check `npm ls esbuild`; if esbuild drifts, fall back to git-diff allowlist + embed.local.spec as the boundary gate).
- agency-portal already runs `framer-motion@^12.23.24` on React 19.2 — proven compatible; use the same `framer-motion` package (not `motion`) for a 1:1 port.

## Critique resolutions (from OpenCode review 2026-08-11)

1. **Full file classification:** SAFE to change (admin): `src/app/page.tsx`, `src/app/settings/page.tsx`, `src/app/widgets/**/page.tsx`, `src/app/login/page.tsx` + `LoginSubmitButton.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/{Sidebar, SettingsPage, WidgetsHome, ScaledCarouselPreview}.tsx` (ScaledCarouselPreview: chrome only, keep ResizeObserver/scaling logic), all of `src/components/editor/**`, new `src/components/ui/**`, `src/lib/utils/cn.ts`, `package.json`/`postcss.config.mjs`. `login/actions.ts` and `logout/actions.ts` are classified SAFE but expected to remain unchanged. Everything on the DO-NOT-TOUCH list stands; `ErrorBoundary.tsx` stays untouched.
2. **body font override:** remove the hardcoded `body { font-family: Arial }` and the Geist `@theme inline` block; body uses the kit's Inter stack. No `prefers-color-scheme: dark` block anywhere (light-only, matches kit).
3. **controls.tsx collisions:** inside `controls.tsx`, import kit primitives with aliases (`KitCard`, `KitInput`, `KitSelect`, `KitSwitch`) and keep every existing exported name + prop signature. Do NOT re-export kit names from controls.tsx.
4. **Out-of-controls admin UI:** the business picker duplicated in `editor/tabs.tsx` / `editor/carousel-tabs.tsx` and `ImageField` in `editor/before-after-tabs.tsx` are admin chrome — reskin them too (SearchSelect is a natural fit for the business picker; keep value formats identical: business_id strings, image URL strings).
5. **Embed snippet integrity:** `buildEmbedCode` and the snippet text in `EmbedCodeModal` must stay byte-identical — only restyle the modal chrome around it (verify by copying snippet before/after).
6. **Value-format contracts:** `Slider` keeps emitting numbers via the same onChange signature; `ColorField` keeps emitting the same color string format; gradient-fill inline style on the range input stays inline.
7. **Toast/Confirm mounting:** mount `<ToastContainer/>` + `<ConfirmDialog/>` at the root for BOTH authed and unauthed renders (login page shows error toasts too).

## Open questions

- None blocking. (Dark-mode variant of the kit is explicitly out of scope.)
