-- Migration: Multi-Step Form widget schema
-- Standalone table (not tied to a Google business), mirroring the
-- before_after_widgets convention. Steps + fields live in the `steps` JSONB
-- column (nested, variable-length structure); global scalar settings stay as
-- flat columns so the editor's form-binding patterns and the bootstrap
-- payload shape stay consistent with the other widget kinds.

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

-- Captured leads. Contains PII — deliberately NO public policies. Inserts
-- happen server-side in POST /api/forms/[id]/submit using the service role
-- after validation. Admin reads via service role.
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

-- Seed: a demo repair-estimate form matching the SSR Autobody example the
-- widget architecture is modeled on. Lets new embed snippets and the e2e
-- harness work without setting up the dashboard first.
INSERT INTO form_widgets (id, name)
VALUES (
  'f3612ca6-8f49-4f0b-a687-96575cca2973',
  'SSR Autobody Repair Estimate Form (Demo)'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;