# Multi-Step Form Widget — Plan

Status: **planning only — no implementation yet**

A new embeddable widget kind (`form`) for lead-capture / quote-request multi-step
forms (example: SSR Autobody repair-estimate form). Follows the same architecture
as the existing widget kinds (`reviews`, `carousel`, `before-after`): a config row
in Supabase, a typed config + defaults in `src/lib`, an embed component in
`src/components`, bootstrap payload support, and a settings/editor UI.

---

## 1. Core concept: fully config-driven steps and fields

The form is defined by an ordered list of **steps**; each step contains an ordered
list of **fields**. Both must be editable at runtime from the widget settings —
no code changes to add/remove/reorder.

### Steps
- Add / remove / **reorder** steps (drag handles in the editor).
- Each step has its own: heading text, description text (multi-paragraph
  supported — see step 3 of the example), and optional per-step style overrides.
- Step visibility rules (see Conditional Logic, §4).

### Fields
Each field is a typed object in the step's field list. Supported field types
(covers everything in the screenshots plus the obvious extras):

| Type | Notes |
|---|---|
| `text` | single-line input |
| `phone` | input with phone formatting/validation |
| `email` | input with email validation |
| `textarea` | multi-line |
| `radio` | single choice ("How do you plan on paying?") |
| `checkbox-group` | multi choice with optional min/max selections ("Where was your vehicle damaged?") |
| `select` | dropdown |
| `number` / `date` | nice-to-haves, cheap to include |
| `hidden` / `static-text` | for injecting values or extra copy mid-form |

Per-field config:
- Label text, placeholder text, required flag, default value.
- Options list for radio/checkbox/select (add/remove/reorder options, each with
  its own label text).
- Validation: required, pattern (regex), min/max length, min/max selections for
  checkbox groups.
- Optional per-field style overrides (otherwise inherits from global styles, §3).

---

## 2. Content editability (from requirements)

- **Logo**: image upload/URL, width/height (size), alignment (left/center/right),
  and a **show/hide per step** toggle (recommendation — some forms hide the logo
  on the final step).
- **Header (step heading)**: text, font family, font size, font weight, color,
  alignment, text transform (the example uses all-caps).
- **Description (per step)**: rich/multi-paragraph text, font family, size,
  weight, color, line height, alignment.
- **Input fields**: label (font, size, weight, color), placeholder text + placeholder
  color, input background color, text color, border (color, width, radius),
  focus-state colors, padding/height.
- **Checkbox / radio / select**: box/circle size, border color, checked/fill color,
  checkmark color, hover state; label font, size, weight, color, spacing between
  options; layout direction (vertical/horizontal).
- **Placeholders**: text and color per field.

## 3. Global style config (theme)

Everything above inherits from a widget-level theme so a user can restyle the
whole form from one place, with per-step/per-field overrides:

- Font family (global default; each text element can override).
- Colors: primary/accent color, background, surface, text, muted text, error color.
- **Container/card**: background color, border radius, border, shadow, max width,
  padding — the example form is a rounded card with a red footer bar.
- **Navigation footer** (visible in all screenshots):
  - Button labels editable: `PREV`, `NEXT`, final-step label (`SUBMIT` or custom),
    optional arrow icons (on/off, arrow direction/style).
  - Button colors: background, text, hover; prev vs next styled independently
    (the example has a full-width split red bar).
  - Footer bar layout: full-width bar vs inline buttons.
- **Spacing**: gap between fields, gap between options, step padding.

## 4. Recommendations — things missing from the original requirements

These are **recommended additions** beyond the original list. They come from the
screenshots and from what multi-step forms always end up needing. Items marked
**(v1)** should be in the first implementation; the rest can be phased.

1. **Conditional logic / branching (v1)** — the most important gap. In the example,
   step 4 ("Which insurance company?") only makes sense if step 3's answer was an
   insurance option. At minimum: *show this step/field only if field X equals
   value Y*. Recommend a simple rule format: `{ field, operator: 'equals'|'not-equals'|'contains'|'selected', value }` on steps and fields.
2. **Submit behavior (v1)** — where does the data go?
   - Destination: webhook URL, email, and/or store submissions in a Supabase table
     (recommend storing — enables a submissions viewer later and avoids data loss).
   - Spam protection option (honeypot at minimum; Turnstile/reCAPTCHA optional).
   - Note: submissions come from third-party sites via the embed, so the submit
     endpoint must handle CORS and rate limiting.
3. **Success / thank-you step (v1)** — configurable heading, text, optional redirect
   URL, and optional auto-redirect delay. Also a configurable **error message**
   if submission fails (with retry).
4. **Validation & error UX (v1)** — inline error messages per field, error text +
   color styling, block `NEXT` until the current step is valid (the example
   marks fields with `*`).
5. **Progress indicator** — optional "Step 2 of 5" text or progress bar, with
   style controls. Even if off by default, users ask for it.
6. **Partial-data capture** (phase 2) — save answers as the user
   progresses so abandons still leave a lead; also browser-local resume.
7. **Accessibility (v1)** — real `<label>`s, keyboard navigation (Enter = next),
   focus-visible styles, `aria-invalid` on errors. Cheap if built in from the start.
8. **Responsive behavior (v1)** — the embed must work in narrow iframes; buttons and
   option layouts should stack cleanly.
9. **Analytics hooks** (phase 2) — events for step view / step complete /
   submit, so drop-off per step can be measured.
10. **Per-step footer note / disclaimer (v1)** — e.g. the privacy line on the last
    step ("We don't share your info…") is arguably description text, but a
    dedicated small-print field with its own smaller styling is cleaner.
11. **Select dropdown styling (v1)** — worth restating: dropdowns need their
    own styling surface (trigger, option list, chevron icon) separate from
    radio/checkbox.
12. **Logo link** — optional URL the logo links to (often the business homepage).

## 5. Schema updates

Two new tables in a new migration `supabase/migrations/017_form_widgets.sql`,
following the conventions of `003_before_after_widgets.sql` (transaction,
`IF NOT EXISTS`, RLS enabled, named policies).

### 5.1 `form_widgets` — one row per form widget instance

Design decision: existing widget tables (`before_after_widgets`,
`carousel_widgets`) use one flat column per setting. That doesn't fit here —
steps and fields are a nested, variable-length structure — so **steps live in a
single `steps` JSONB column**, while global scalar settings stay as flat columns
(keeps the editor's form-binding patterns and the bootstrap payload shape
consistent with the other widget kinds).

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS form_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Multi-Step Form',

  -- Steps + fields (the core of the form). Array of step objects:
  --   { id, heading, description, footerNote, visibilityRule?,
  --     styleOverrides?, fields: [{ id, type, label, placeholder, required,
  --     defaultValue, options?, validation?, visibilityRule?,
  --     styleOverrides? }] }
  -- Order of steps/fields in the array IS the display order
  -- (reorder = reorder the array).
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Logo
  logo_url TEXT NOT NULL DEFAULT '',
  logo_link_url TEXT NOT NULL DEFAULT '',
  logo_width INT NOT NULL DEFAULT 160,               -- px
  logo_alignment TEXT NOT NULL DEFAULT 'left',       -- left | center | right

  -- Global typography / colors (per-element overrides live inside `steps`)
  font_family TEXT NOT NULL DEFAULT 'Poppins',
  primary_color TEXT NOT NULL DEFAULT '#B01E1E',     -- headings, checked state, buttons
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  text_color TEXT NOT NULL DEFAULT '#1A1A1A',
  muted_text_color TEXT NOT NULL DEFAULT '#6B7280',  -- descriptions, placeholders
  error_color TEXT NOT NULL DEFAULT '#DC2626',
  heading_font_size INT NOT NULL DEFAULT 28,
  heading_font_weight INT NOT NULL DEFAULT 700,
  body_font_size INT NOT NULL DEFAULT 16,
  body_font_weight INT NOT NULL DEFAULT 400,
  label_font_size INT NOT NULL DEFAULT 15,
  label_font_weight INT NOT NULL DEFAULT 600,

  -- Container / card
  border_radius INT NOT NULL DEFAULT 24,
  shadow TEXT NOT NULL DEFAULT 'soft',               -- default | none | soft | strong
  max_width INT NOT NULL DEFAULT 560,                -- px
  padding INT NOT NULL DEFAULT 32,                   -- px

  -- Inputs
  input_background_color TEXT NOT NULL DEFAULT '#F3F4F6',
  input_border_color TEXT NOT NULL DEFAULT '#D1D5DB',
  input_border_radius INT NOT NULL DEFAULT 10,

  -- Choice controls (checkbox / radio / select)
  option_gap INT NOT NULL DEFAULT 16,                -- px between options
  checked_color TEXT NOT NULL DEFAULT '#B01E1E',

  -- Nav footer
  prev_label TEXT NOT NULL DEFAULT 'PREV',
  next_label TEXT NOT NULL DEFAULT 'NEXT',
  submit_label TEXT NOT NULL DEFAULT 'SUBMIT',
  show_arrows BOOLEAN NOT NULL DEFAULT true,
  button_background_color TEXT NOT NULL DEFAULT '#B01E1E',
  button_text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  button_hover_color TEXT NOT NULL DEFAULT '#8F1818',

  -- Progress indicator
  show_progress BOOLEAN NOT NULL DEFAULT false,
  progress_style TEXT NOT NULL DEFAULT 'bar',        -- bar | steps ('Step 2 of 5')

  -- Submission behavior
  submit_webhook_url TEXT NOT NULL DEFAULT '',       -- POST payload here if set
  submit_email TEXT NOT NULL DEFAULT '',             -- notify this address if set
  store_submissions BOOLEAN NOT NULL DEFAULT true,   -- write to form_submissions
  honeypot_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Success / failure screens
  success_heading TEXT NOT NULL DEFAULT 'Thank you!',
  success_message TEXT NOT NULL DEFAULT 'We received your request and will be in touch shortly.',
  success_redirect_url TEXT NOT NULL DEFAULT '',     -- optional; empty = stay on success screen
  success_redirect_delay INT NOT NULL DEFAULT 0,     -- seconds; 0 = no auto-redirect
  error_message TEXT NOT NULL DEFAULT 'Something went wrong. Please try again.',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE form_widgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read form_widgets" ON form_widgets;
CREATE POLICY "Public read form_widgets" ON form_widgets FOR SELECT USING (true);

COMMIT;
```

Public read is safe here (same as the other widget tables): the config contains
no secrets — webhook URLs are delivery config, not credentials. Writes go
through the admin editor (service role / existing admin guard).

### 5.2 `form_submissions` — captured leads

```sql
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_widget_id UUID NOT NULL REFERENCES form_widgets(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,            -- { [fieldId]: value | value[] }
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,  -- referrer URL, user agent, origin domain
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_widget
  ON form_submissions(form_widget_id, created_at DESC);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
-- No public SELECT policy. Inserts happen server-side in
-- POST /api/forms/[id]/submit using the service role after validation,
-- so no public INSERT policy is needed either. Admin reads via service role.
```

This table contains PII (names, phone numbers) — deliberately **no public
policies**, consistent with the spirit of `014_lockdown_rls.sql`.

### 5.3 No changes to existing tables

- `allowed_domains` (012) already governs which origins may call widget APIs —
  the submit endpoint reuses it.
- The `widgets` / `widget_type` conventions (002) are per-kind tables, so
  `form_widgets` slots in the same way; the embed registry maps IDs to the
  `'form'` kind. If the generic widgets table (011) is the preferred discovery
  path, insert rows there as with the other kinds.

## 6. Architecture sketch (matches existing widget kinds)

Following the `before-after` pattern:

1. **DB**: migration `017_form_widgets.sql` as specified in §5.
2. **Types + defaults**: `src/lib/form-config.ts` with `FormConfig`,
   `FormStep`, `FormField` types and `defaultFormConfig` (mirrors
   `src/lib/before-after-config.ts`); `FormStep`/`FormField` types describe the
   `steps` JSONB shape from §5.1.
3. **Embed component**: `src/components/FormEmbed.tsx` (+ internal step renderer,
   field renderers per type, conditional-rule evaluation, validation, submit
   handler). Register kind `'form'` in `src/widget-registry.ts` and extend
   `getBootstrappedWidgetKind` in `src/lib/bootstrap.ts`.
4. **API**:
   - Extend `/api/embeds/widget/[id]/data.js` to serve the `form` bootstrap payload.
   - New public `POST /api/forms/[id]/submit` — origin-checked against
     `allowed_domains`, CORS-enabled, rate-limited, honeypot check, re-validates
     answers against the row's `steps` config (including visibility rules),
     then stores and/or delivers per the row's submission settings.
5. **Editor UI**: new settings page section (steps list with add/remove/reorder,
   field editor per step, style panels grouped as in §2–3, live preview like the
   existing editors).
6. **Widget bundle**: `npm run build-widget` already compiles the embed; the form
   widget ships in the same `public/widget.*.js` bundle.

## 7. Open questions to resolve before implementation

- Submission destination(s) for v1: store-only, email, webhook, or all three?
- Is conditional branching in v1, or deferred? (Recommend v1 — the example form
  already needs it.)
- Do we need file upload fields (damage photos)? Common for body-shop quote
  forms; big scope addition (storage, size limits), recommend explicitly deciding.
- Multi-paragraph descriptions: plain text with line breaks, or minimal rich text
  (bold/links)? The example uses `-` separators, so plain text with newlines
  likely suffices.
