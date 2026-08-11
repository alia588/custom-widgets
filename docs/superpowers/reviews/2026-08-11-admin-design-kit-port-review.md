# Review: Port agency-portal design kit to custom-widgets admin

**Spec:** `docs/superpowers/specs/2026-08-11-admin-design-kit-port.md`  
**Date:** 2026-08-11  
**Scope:** Critique only — no implementation.

---

## 1. Gaps in the widget-runtime boundary allowlist

### 1.1 Files that are admin-only but not classified

The spec’s "DO NOT TOUCH" list is clear, but the inverse "safe to touch" set is implicit. Several admin files will be edited yet are never mentioned, which makes branch review and the shasum gate harder to audit:

| File / pattern | Why it matters |
| --- | --- |
| `src/app/page.tsx` | The dashboard shell that wraps `<WidgetsHome />`. It will inherit the light theme via `layout.tsx`, but if the page-level `p-10` / `max-w-6xl` chrome needs kit spacing it is not discussed. |
| `src/app/widgets/*/page.tsx` | These server pages mount the editors. They are not widget runtime files, but they are also not in the implementation plan. If the kit changes the editor prop contract or SSR data flow, these pages are in the blast radius. |
| `src/app/login/page.tsx` + `src/app/login/LoginSubmitButton.tsx` | Listed for reskinning, but `login/actions.ts` (the server action) is not. The action is safe to leave untouched; still, the boundary doc should state it explicitly. |
| `src/app/logout/actions.ts` | Mounted by `<Sidebar />`. Same as above: admin-only, but omitted from either list. |
| `src/components/ScaledCarouselPreview.tsx` | Used only by `CarouselEditor.tsx` for the admin preview. It is not a widget runtime file, but it is also not listed as safe to touch. |
| `src/components/editor/ExcludeReviewsPicker.tsx` | Imported by `tabs.tsx` and `carousel-tabs.tsx`. Its UI is not covered by the `controls.tsx` re-skin; it will remain dark unless addressed. |

**Recommendation:** Add a "SAFE TO TOUCH (admin-only)" section that names these files, or at least name the directories `src/app/page.tsx`, `src/app/widgets/`, `src/app/login/`, `src/app/logout/`, and `src/components/editor/*` (excluding `controls.tsx` internals which are being re-implemented, not removed).

### 1.2 Fuzzy boundary around preview mounts

The spec says:

> "Widget preview mounts inside admin (`GoogleReviewsWidget`, `BeforeAfterWidget`, `ScaledCarouselPreview` scaling logic) — restyle the chrome around them, never the renderers or their props."

In `WidgetsHome.tsx`, the preview is **not** wrapped in chrome before the widget component is rendered:

```tsx
<BeforeAfterWidget config={item.config} compact />
```

and

```tsx
<GoogleReviewsWidget widgetId={item.id} config={item.config} business={item.business} reviews={item.reviews} preview />
```

These are direct renderer invocations inside a card. The "chrome" is the `WidgetCard` border, but the renderer itself fills the card body. There is a real risk that the renderer’s own internal dark styles (e.g., `bg-neutral-800` in `GoogleReviewsWidget`) will clash with the new light card. The spec should clarify whether `WidgetsHome` previews are in scope for chrome-only changes or whether the renderer components themselves are expected to self-adjust to a light host.

**Recommendation:** Either (a) explicitly state that preview instances of `GoogleReviewsWidget` / `BeforeAfterWidget` are expected to look acceptable on a light background, or (b) add a lightweight light-themed wrapper around each preview in `WidgetsHome` so the renderer’s own palette does not need to change.

### 1.3 Hash gate is necessary but not sufficient

The spec’s only automated runtime boundary check is `shasum -a 256 public/widget.js` before/after. That proves the final bundle did not change, but it does not catch a class-name or CSS change inside a shared component that happens to be tree-shaken identically. Because `ErrorBoundary.tsx` and `src/styles/widget.css` are shared with the embed runtime, touching them can change runtime behavior without changing the bundle hash if the change is not imported by `embed.tsx`.

**Recommendation:** Add a secondary gate: diff the list of files under `src/components/` and `src/styles/` that are imported by `embed.tsx` / `widget-registry.ts` / `scripts/build-widget.mjs` and fail if any changed.

---

## 2. Tailwind v4 / Next.js 16 pitfalls

### 2.1 `@theme` syntax and token migration

The current `src/app/globals.css` uses Tailwind v4 syntax already:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

The plan says:

> "replace with kit tokens (`@theme` + `:root` duplicate, Inter import, motion/a11y, `.ui-control/.ui-btn*/.ui-badge*/.ui-listbox/.ui-option/.ui-tabs-*/.ui-nav-item`, touch hammer)"

There is no source kit file shown, but porting a kit designed around a different project may have used a `tailwind.config.ts` + `@tailwind base` pattern. If the ported tokens rely on `@tailwind utilities` or arbitrary Tailwind v3 plugin APIs, they will break under the `@import "tailwindcss"` / `@theme inline` v4 pipeline.

**Recommendation:** Add a verification step that runs `npm run build` immediately after porting `globals.css` and before any JSX changes, so v4 incompatibilities surface early. Also require that no `tailwind.config.ts` be introduced unless it is confirmed to work with `tailwindcss` v4.

### 2.2 Font stack change from Geist to Inter

The current layout/font setup uses `--font-geist-sans`. The plan switches to Inter but does not state how the font is loaded. In Next.js 16 with the App Router, the idiomatic way is `next/font/google` imported in `layout.tsx` and the CSS variable passed to `:root`/`@theme`.

**Recommendation:** Explicitly specify whether Inter is loaded via `next/font/google` or via a raw `@import` in CSS. If the kit expects `font-family: Inter`, ensure the `--font-sans` custom property is updated in `layout.tsx` and that the old Geist variable references are removed.

### 2.3 Dark-mode media query removal

Current `globals.css` has:

```css
@media (prefers-color-scheme: dark) {
  :root { --background: #0a0a0a; --foreground: #ededed; }
}
```

The plan drops this block. That is correct for an always-light admin, but verify that no admin component depends on `--background` / `--foreground`. Today they are only used on `body`, and most admin components use explicit `bg-neutral-950` / `text-neutral-100`. The transition to `--color-bg-secondary` etc. must therefore be exhaustive; any leftover `bg-neutral-950` inside admin pages will create dark islands in the new light theme.

**Recommendation:** Add a lint or grep gate for `bg-neutral-950`, `text-neutral-100`, `bg-[#ffffff0a]`, `bg-[#ffffff08]`, `bg-[#ffffff06]`, `ring-neutral-800`, etc. inside `src/app/` (admin) and `src/components/` (excluding widget runtime files) and require them to be removed or mapped to kit tokens.

### 2.4 `next.config.ts` `turbopack.root` setting

`next.config.ts` currently contains:

```ts
turbopack: {
  root: path.resolve(process.cwd()),
},
```

This is non-standard and, in Next.js 16 + Tailwind v4 + PostCSS, can cause HMR/build issues if the root is misinterpreted. Because the spec explicitly calls out "Next.js 16 API drift" as a risk, this config should be reviewed before the new CSS is introduced.

**Recommendation:** Add a verification step that `npm run dev` and `npm run build` both succeed with the new CSS, and note that `turbopack.root` may need to be removed if it conflicts with Tailwind v4 scanning.

### 2.5 `body` font-family override

Current CSS:

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  overflow-x: hidden;
}
```

The hardcoded `Arial, Helvetica, sans-serif` overrides any `--font-sans` token. The kit plan does not mention removing it. If Inter is imported but `body` still sets Arial, the admin will not actually use Inter.

**Recommendation:** Remove or replace `font-family` in `body` with `var(--font-sans)` or rely on Tailwind’s `font-sans` utility.

### 2.6 Native input restyling for `Slider` / `ColorField`

The current `.editor-slider` and `.editor-scroll` classes style native range inputs and scrollbars with dark colors. The plan says "keep `.editor-scroll`, `.editor-slider`, `.editor-tab-enter` restyled to light." That is correct, but the existing `.editor-slider` uses inline `background: linear-gradient(... rgba(255,255,255,...) ...)` for the fill, which will look broken on a light panel if not also updated to a dark-to-light accent gradient.

**Recommendation:** Explicitly specify the light-theme slider fill colors and scrollbar thumb colors, and verify the range thumb still has enough contrast against the new panel background.

---

## 3. Missing verification steps

The verification list is thin for a change of this surface area. Missing items:

1. **Automated boundary diff.** Before/after list of touched files should be compared against the "DO NOT TOUCH" set. A simple `git diff --name-only` against the allowlist would catch accidental edits.

2. **Visual regression / screenshot baseline.** Not required to implement, but the spec should at least require a manual screenshot of `/login`, `/`, `/settings`, and each `/widgets/*` route to confirm no dark remnants exist.

3. **Login flow end-to-end.** The e2e test uses `#email`, `#password`, and a `/sign in/i` button. The spec mentions preserving these selectors, but the verification section only says "at minimum crud.local login flow must pass." It should also require that the accessible name of the submit button remains matched by `/sign in/i` and that the form `action={login}` is unchanged.

4. **Toast / confirm imperative APIs.** The plan mounts `<ToastContainer/>` and `<ConfirmDialog/>` "inside the authed branch (and login-safe)." The verification section does not say how to confirm `showToast`/`showConfirm` actually render. Add: create a `[TEST]` widget and trigger a save error/success toast and a delete confirmation dialog.

5. **`ErrorBoundary` fallback in light admin.** `ErrorBoundary.tsx` is shared and has hardcoded dark fallback colors. The spec lists it as DO NOT TOUCH, so its error box will remain dark. Verification should note this as an accepted visual inconsistency, or decide whether the fallback can be left as-is.

6. **Embed code byte-identical output.** The goal states `buildEmbedCode` output must be byte-identical. The verification list does not include a check. Add a unit test or at least a manual assertion that the generated snippet matches the baseline.

7. **`framer-motion` + React 19 runtime check.** `framer-motion` is being added to a React 19 project. The latest stable `framer-motion` has been superseded by `motion` for React 19. The spec should state the exact package and version to install and verify `npm run build` does not warn about peer-dependency mismatches.

8. **`lucide-react` tree-shaking.** Adding `lucide-react` is fine, but Next.js 16 / React 19 compatibility should be checked. Also verify that the build does not bundle every icon.

9. **Type-check gate.** The implementation plan changes many JSX files and adds new components. The verification should explicitly include `npx tsc --noEmit` (or rely on `next build` if it type-checks) in addition to `npm run lint`.

10. **Widget preview render check.** Because the admin flips from dark to light, verify that `GoogleReviewsWidget`, `GoogleReviewsCarousel`, and `BeforeAfterWidget` previews still render correctly (not just that their props are unchanged).

---

## 4. Risks in re-skinning `editor/controls.tsx` while keeping prop contracts

### 4.1 Name collisions with kit primitives

`controls.tsx` currently exports:

```ts
Section, Card, Field, Select, TextInput, NumberInput, Toggle, Slider, ColorField
```

The kit also contains `Card`, `Input`, `Select`, `Switch`, etc. The plan says:

> "re-implement internals over kit primitives while keeping every exported name + prop signature identical"

If the new `controls.tsx` internally imports the kit’s `Card` and `Select`, it will have local name collisions unless every import is aliased (e.g., `import { Card as KitCard } from '@/components/ui/card'`). The risk table says "`controls.tsx` keeps its own exports," but it does not say how to avoid import-name conflicts.

**Recommendation:** Mandate that `controls.tsx` uses aliased kit imports or that the kit directory is imported via an internal-only namespace, and add a lint rule or code-review checklist item to prevent accidental re-export of kit names from `controls.tsx`.

### 4.2 `ColorField` hex-string contract

`ColorField` receives and emits a hex color string (e.g., `#00a86b`). The current implementation uses a native `<input type="color">`. If the kit’s color input (or any replacement) normalizes to lowercase, removes `#`, or returns `rgb(...)`, the `configToDbRow` / `configFromDbRow` contracts could break.

**Recommendation:** Require that the re-implemented `ColorField` continues to emit `#RRGGBB` exactly, and add a quick unit test or prop-type check.

### 4.3 `Slider` value fidelity

Current `Slider` calls `onChange(Number(e.target.value))` on every native `input` event. A kit `Slider` may debounce, only fire on `onPointerUp`, or return a string. That would change editor responsiveness and saved values.

**Recommendation:** Preserve the immediate `number` emission behavior, or document if it changes.

### 4.4 `Select` option contract

Current `Select` accepts:

```ts
{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }
```

The kit `Select` may use a different option shape (`label`/`value` is common, but not guaranteed) or may require a `children` API. If the kit’s API differs, the wrapper in `controls.tsx` must translate it without leaking new prop types.

**Recommendation:** Before porting, confirm the kit `Select` API shape or commit to keeping a hand-rolled `Select` inside `controls.tsx`.

### 4.5 `Toggle` / kit `Switch` API

Current `Toggle` props: `checked, onChange, label, description`. Kit may call it `Switch` with `checked`, `onCheckedChange`, `children` label, etc. The wrapper must map `onChange` to the kit switch handler.

**Recommendation:** Same as above — confirm API or keep `Toggle` self-contained.

### 4.6 Duplicated business picker UI outside `controls.tsx`

`tabs.tsx` and `carousel-tabs.tsx` contain a custom business-search dropdown with hardcoded dark classes:

```tsx
<div className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl bg-black shadow-2xl">
  <input className="... bg-[#ffffff0a] ... text-neutral-100 ..." />
  ...
</div>
```

This UI is **not** implemented via `controls.tsx`. The plan only mentions re-implementing `controls.tsx`, so these pickers will remain dark and visually broken in the new light admin.

**Recommendation:** Either extract the business picker into `controls.tsx` (or a new `BusinessPicker` primitive) so it gets the kit treatment, or explicitly schedule it as a separate reskin task.

### 4.7 `ImageField` in `before-after-tabs.tsx`

`ImageField` is an inline component inside `before-after-tabs.tsx` with its own dark styling (`bg-[#ffffff0a]`, `text-neutral-200`, etc.). It is not mentioned in the plan. It will remain dark.

**Recommendation:** Add `before-after-tabs.tsx` ImageField reskin to the implementation plan, or extract it to a shared component.

### 4.8 `Field` label semantics

The current `Field` renders:

```tsx
<div className="mb-4 last:mb-0">
  <label className="...">{label}</label>
  {children}
</div>
```

The `<label>` is not associated with the child input via `htmlFor`. The kit `Label` likely expects an `htmlFor` prop or to wrap the input. Preserving the existing prop contract while improving accessibility is possible, but it must be intentional.

**Recommendation:** Decide whether the re-skin fixes the missing `htmlFor` association. If yes, verify it does not break any consumer.

### 4.9 Native input props not forwarded

`TextInput` and `NumberInput` currently do not forward `id`, `name`, `disabled`, `autoComplete`, etc. If the kit `Input` requires an `id` for label association or exposes different props, the wrapper must silently ignore or forward them without changing the public API.

**Recommendation:** Keep the public prop surface minimal as today, but forward unknown native attributes to the underlying `<input>` so the kit input behaves correctly.

---

## 5. Additional architectural concerns

### 5.1 `framer-motion` vs `motion` for React 19

The plan adds `framer-motion`, but the React 19 / Next 16 ecosystem is moving toward the `motion` package (`motion/react`). `framer-motion` v11+ supports React 19, but peer-dependency warnings are common. The spec should name a minimum version and require `npm run build` to complete without peer-dependency errors.

**Recommendation:** Consider `motion` instead of `framer-motion`, or pin `framer-motion` to a React-19-compatible version.

### 5.2 `EditorShell` extraction timing

The plan says:

> "extract the ~60 lines of shared chrome into a shared `EditorShell` to kill the ×3 duplication"

This is a good refactor, but it is bundled into the same branch as the visual re-skin. Because the editor shells also contain business logic (save fetch, `configToDbRow`, tab state), extracting a shared `EditorShell` risks accidentally changing that logic. It should be done in a separate commit before or after the re-skin, or at minimum be called out as a discrete change with its own regression test.

**Recommendation:** Split `EditorShell` extraction into its own commit with a clear diff, and verify save behavior unchanged before applying cosmetic changes.

### 5.3 Global imperative dialog/toast containers in an async layout

`layout.tsx` is an async server component. Mounting `<ToastContainer/>` and `<ConfirmDialog/>` there is fine if they are `'use client'` wrappers. However, the plan says "inside the authed branch (and login-safe)." If these containers are omitted on the login route, `showToast` called from `login/actions.ts` or from a future login error handler will fail silently. Conversely, if they are rendered globally, they may flash briefly before auth state resolves.

**Recommendation:** Clarify whether toast/confirm are global or auth-only, and ensure the chosen mount point matches every call site.

### 5.4 `ErrorBoundary` hardcoded dark fallback

`ErrorBoundary.tsx` is shared and on the DO-NOT-TOUCH list. Its fallback is:

```tsx
div style={{ background: '#1c1917', color: '#fca5a5', ... }}
```

That will render a dark error box inside the light admin. This is visually jarring but technically correct given the boundary. The spec should explicitly accept this trade-off.

**Recommendation:** Note in "Risks & mitigations" that `ErrorBoundary` retains its dark fallback because it is shared with the embed runtime.

### 5.5 Light-theme mock components in `WidgetsHome`

The stylized mocks (`BeforeAfterMock`, `GoogleReviewsMock`, `CarouselMock`, `MiniReviewCard`) use hardcoded `bg-neutral-600/70`, `bg-neutral-700/60`, `text-neutral-300`, etc. These appear on the dashboard type cards. They are not widget runtime components, so they must be reskinned or they will look dark against the light page.

**Recommendation:** Add these mocks to the implementation plan or accept that dashboard cards will keep dark thumbnails.

---

## 6. Suggested additions to the spec

1. **Explicit safe-to-touch file list** covering `src/app/page.tsx`, `src/app/widgets/`, `src/app/login/`, `src/app/logout/`, `src/components/editor/*`, `src/components/ScaledCarouselPreview.tsx`.
2. **Boundary enforcement script** that diffs changed files against the DO-NOT-TOUCH set and checks `public/widget.js` hash.
3. **CSS token mapping table** showing old dark utilities → new kit tokens/classes.
4. **Font-loading decision** (Next.js `next/font/google` Inter vs CSS import) and removal of `body { font-family: Arial ... }`.
5. **Kit dependency versions** for `framer-motion`/`motion`, `lucide-react`, `clsx`, `tailwind-merge`.
6. **Prop-contract test** for `controls.tsx` exports: render each, simulate interaction, assert callback payloads.
7. **Reskin tasks for non-`controls.tsx` inline UI:** business picker, `ImageField`, dashboard mocks.
8. **Visual regression checklist** (manual screenshots) for `/login`, `/`, `/settings`, `/widgets/google-reviews`, `/widgets/google-reviews-carousel`, `/widgets/before-after`.
9. **Commit ordering:** `EditorShell` extraction as a separate commit before the kit re-skin.

---

## 7. Overall assessment

The spec is directionally correct and the boundary intent is well understood, but it under-specifies several important details:

- **High risk:** name collisions between `controls.tsx` exports and kit primitives; duplicated picker/ImageField UI that is not covered by the `controls.tsx` re-skin; `framer-motion` React 19 compatibility.
- **Medium risk:** Tailwind v4 `@theme` syntax mismatches; hardcoded dark mocks and `ErrorBoundary` fallback; `body` font-family override blocking Inter; `turbopack.root` config interaction with Tailwind v4.
- **Low risk:** missing safe-to-touch file list; thin verification section.

**Do not implement until the spec addresses at least the high-risk items above.**

---

## Code review (post-implementation)

**Branch:** `feature/admin-design-kit`  
**Base for diff:** `feat/testing-alerts-e2e`  
**Files reviewed:** `src/app/layout.tsx`, `src/components/Sidebar.tsx`, `src/components/WidgetsHome.tsx`, `src/components/SettingsPage.tsx`, `src/components/editor/EditorShell.tsx`, `src/components/editor/controls.tsx`, `src/components/editor/WidgetEditor.tsx`, `src/components/editor/CarouselEditor.tsx`, `src/components/editor/BeforeAfterEditor.tsx`, `src/app/login/page.tsx`.

Per-file diffs were gathered with `git diff feat/testing-alerts-e2e..HEAD -- <path>`.

**Build / type-check / tests:**
- `npm run build` passes.
- `npx tsc --noEmit` passes.
- `npm run test:unit` passes.

### Findings

#### 1. Critical (kit-side, but impacts reviewed callers): `showConfirm` auto-executes on SSR

- **Location:** `src/components/ui/ConfirmDialog.tsx` is called from `WidgetsHome.tsx` and `SettingsPage.tsx`.
- **Issue:** `showConfirm` contains:
  ```ts
  if (typeof window === 'undefined') {
    onConfirm();
    return;
  }
  ```
  During any SSR/pre-render path, the destructive callback runs immediately without user confirmation.
- **Impact:** Latent but severe. The current reviewed callers invoke `showConfirm` only inside client event handlers, so the fallback is not exercised today. If a future refactor calls it from a server action or server component, data will be deleted without confirmation.
- **Recommendation:** Change the kit fallback to a no-op (or throw) rather than auto-confirming. Until then, audit that `showConfirm` is never imported into server code.

#### 2. High: Delete/confirm flow lost the `busy` guard

- **Locations:**
  - `WidgetsHome.tsx`: `requestDelete` / `confirmDelete` / duplicate flows.
  - `SettingsPage.tsx`: `requestDelete` / `doDelete`.
- **Issue:** The original inline `ConfirmDeleteModal` received `busy={busy}` and disabled its Cancel/Delete buttons while the async operation was in flight. The new imperative `showConfirm` / `ConfirmDialog` has no `busy`/`isLoading` prop and is not wired to the component's `busy` state.
- **Impact:** Rapid double-clicking **Confirm** can fire multiple delete/duplicate fetches. For deletes the second fetch 404s and shows an error toast; for duplicates it may create a second copy.
- **Category:** This is a regression in **lost state/handlers vs base**.
- **Recommendation:** Extend `showConfirm`/`ConfirmDialog` to accept an `isLoading` flag, or track a local `pendingDeleteId` / `pendingAction` state and suppress additional clicks until the promise settles.

#### 3. Medium: Manual `<head>` injection in App Router layout

- **Location:** `src/app/layout.tsx`.
- **Issue:** The diff adds:
  ```tsx
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  ```
  inside an App Router `RootLayout`. Next.js 16 App Router manages `<head>` automatically; the canonical path is `next/font/google`. A manually rendered `<head>` can cause hydration warnings, duplicate head elements, and bypasses Next.js font optimization/self-hosting.
- **Impact:** Build passes, but runtime may produce hydration mismatches or layout shift.
- **Recommendation:** Load Inter via `next/font/google` in `layout.tsx` and remove the manual `<head>` block.

#### 4. Low: Lost Escape-key stacking handler

- **Location:** `WidgetsHome.tsx`.
- **Issue:** The base code had a single `useEffect` Escape listener that closed the topmost popup in order: `deleteTarget` → `embedTarget` → `openType`. The diff removes this effect and relies on each `Modal` to handle Escape independently.
- **Impact:** In the current UI only one modal is open at a time, so behavior is equivalent. If stacked modals are introduced later, Escape will be handled by all listeners instead of the topmost one, and `document.body.style.overflow` toggles may fight.
- **Category:** Minor **lost state/handlers vs base** regression.
- **Recommendation:** Acceptable for the current scope; reintroduce a single Escape manager if modals ever stack.

#### 5. Low/Nit: `EditorShell` active tab uses a hardcoded dark palette

- **Location:** `src/components/editor/EditorShell.tsx`.
- **Issue:** The active tab button uses inline `bg-[#1d1d1f] text-white`. The rest of the admin is light-themed, so the rail active state is a dark patch. The kit's `.ui-nav-item[data-active="true"]` also hardcodes the same colors, but `EditorShell` does not use `.ui-nav-item` and duplicates the value.
- **Impact:** Visual inconsistency only; not functional.
- **Recommendation:** If the dark active rail is intentional, document it in the design kit migration notes; otherwise map it to a light-kit token.

### Prop-contract verification

- `controls.tsx` keeps all exported names and signatures (`Section`, `Card`, `Field`, `Select`, `TextInput`, `NumberInput`, `Toggle`, `Slider`, `ColorField`).
- `controls.contract.test.ts` passes for all primitives.
- `Toggle` correctly maps to `KitSwitch` via `onCheckedChange`.
- `ColorField` preserves hex casing.
- `NumberInput` still emits `Number(e.target.value)` (note: empty input becomes `0`, same as base).
- `Select` still emits string values.
- No broken prop contracts were found in the reviewed files.

### Fetch/save-flow verification

- `WidgetEditor.tsx`, `CarouselEditor.tsx`, and `BeforeAfterEditor.tsx` preserve their original `save()` implementations and pass the same props to preview mounts.
- `SettingsPage.tsx` preserves fetch URLs, HTTP methods, and state updates.
- `WidgetsHome.tsx` preserves duplicate/delete fetch URLs and `router.refresh()` calls; only the confirmation UI changed.
- No fetch/save regressions were detected beyond the confirm `busy` guard issue noted above.

### Null-safety notes

- `EditorShell` defensively falls back to `{ title: '', subtitle: '' }` when `tabMeta[activeTab]` is missing.
- `Controls.tsx` wrappers do not add null-safety beyond the original implementations; callers are still expected to provide values.
- `showConfirm` and `showToast` are safe to call from client event handlers in the reviewed files.

(End of code review)
