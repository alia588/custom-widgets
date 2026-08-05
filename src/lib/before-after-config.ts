// Before/After Slider widget configuration types + defaults.
// Mirrors the `before_after_widgets` table columns in
// supabase/migrations/003_before_after_widgets.sql.

export type BackgroundType = 'transparent' | 'solid';
export type Shadow = 'default' | 'none' | 'soft' | 'strong';
export type WidthType = 'percentage' | 'fixed';
// Presets plus 'auto' (natural image height); any other 'W:H' string is a
// custom ratio (e.g. '2.35:1') chosen via the editor's Custom option.
export type AspectRatio = '16:9' | '21:9' | '4:3' | '3:2' | '1:1' | 'auto' | (string & {});

export interface BeforeAfterConfig {
  // Content
  beforeImageUrl: string;
  afterImageUrl: string;

  // Style
  useSiteTheme: boolean;
  backgroundType: BackgroundType;
  backgroundColor: string;
  labelBackgroundColor: string;
  labelTextColor: string;
  fontFamily: string;
  shadow: Shadow;
  borderRadius: number;

  // Layout
  beforeLabel: string;
  afterLabel: string;
  widthType: WidthType;
  widthValue: number;
  aspectRatio: AspectRatio;
  sliderPosition: number;
  showLabels: boolean;
  showInstructionText: boolean;
  instructionText: string;
  instructionSize: number;

  // Settings
  captureTouchMode: boolean;
}

export const defaultBeforeAfterConfig: BeforeAfterConfig = {
  beforeImageUrl: '',
  afterImageUrl: '',

  useSiteTheme: false,
  backgroundType: 'transparent',
  backgroundColor: '#FFFFFF',
  labelBackgroundColor: '#E42709',
  labelTextColor: '#FFFFFF',
  fontFamily: 'Poppins',
  shadow: 'default',
  borderRadius: 24,

  beforeLabel: 'Before',
  afterLabel: 'After',
  widthType: 'percentage',
  widthValue: 100,
  aspectRatio: '4:3',
  sliderPosition: 70,
  showLabels: true,
  showInstructionText: true,
  instructionText: 'Drag to compare',
  instructionSize: 14,

  captureTouchMode: true,
};

// ---------------------------------------------------------------------------
// DB row <-> config mapping
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

export function beforeAfterFromDbRow(row: Record<string, any>): BeforeAfterConfig {
  return {
    beforeImageUrl: row.before_image_url ?? '',
    afterImageUrl: row.after_image_url ?? '',

    useSiteTheme: row.use_site_theme ?? false,
    backgroundType: row.background_type ?? 'transparent',
    backgroundColor: row.background_color ?? '#FFFFFF',
    labelBackgroundColor: row.label_background_color ?? '#E42709',
    labelTextColor: row.label_text_color ?? '#FFFFFF',
    fontFamily: row.font_family ?? 'Poppins',
    shadow: row.shadow ?? 'default',
    borderRadius: row.border_radius ?? 24,

    beforeLabel: row.before_label ?? 'Before',
    afterLabel: row.after_label ?? 'After',
    widthType: row.width_type ?? 'percentage',
    widthValue: row.width_value ?? 100,
    aspectRatio: row.aspect_ratio ?? '4:3',
    sliderPosition: row.slider_position ?? 70,
    showLabels: row.show_labels ?? true,
    showInstructionText: row.show_instruction_text ?? true,
    instructionText: row.instruction_text ?? 'Drag to compare',
    instructionSize: row.instruction_size ?? 14,

    captureTouchMode: row.capture_touch_mode ?? true,
  };
}

export function beforeAfterToDbRow(config: BeforeAfterConfig): Record<string, unknown> {
  return {
    before_image_url: config.beforeImageUrl,
    after_image_url: config.afterImageUrl,

    use_site_theme: config.useSiteTheme,
    background_type: config.backgroundType,
    background_color: config.backgroundColor,
    label_background_color: config.labelBackgroundColor,
    label_text_color: config.labelTextColor,
    font_family: config.fontFamily,
    shadow: config.shadow,
    border_radius: config.borderRadius,

    before_label: config.beforeLabel,
    after_label: config.afterLabel,
    width_type: config.widthType,
    width_value: config.widthValue,
    aspect_ratio: config.aspectRatio,
    slider_position: config.sliderPosition,
    show_labels: config.showLabels,
    show_instruction_text: config.showInstructionText,
    instruction_text: config.instructionText,
    instruction_size: config.instructionSize,

    capture_touch_mode: config.captureTouchMode,

    updated_at: new Date().toISOString(),
  };
}

// Height as a percentage of width for any 'W:H' ratio string (custom values
// included). Falls back to 4:3 for unparseable input.
export function aspectRatioPadding(ratio: string): number {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h || w <= 0 || h <= 0) return 75;
  return (h / w) * 100;
}
