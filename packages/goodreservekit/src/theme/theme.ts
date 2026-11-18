export interface GoodReserveThemeColors {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  primary: string;
  primaryForeground: string;
  danger: string;
  border: string;
}

export interface GoodReserveToastTheme {
  background: string;
  foreground: string;
  border: string;
  shadow: string;
  durationMs: number;
  offset: string;
}

export interface GoodReserveTheme {
  colors: GoodReserveThemeColors;
  radii: {
    widget: string;
    control: string;
  };
  borderWidth: string;
  shadow: string;
  fontFamily: string;
  toast: GoodReserveToastTheme;
}

export type GoodReserveThemeOverride = {
  colors?: Partial<GoodReserveThemeColors>;
  radii?: Partial<GoodReserveTheme["radii"]>;
  borderWidth?: string;
  shadow?: string;
  fontFamily?: string;
  toast?: Partial<GoodReserveToastTheme>;
};

const FLAT_SHADOW =
  "0 0 0 1px rgba(0,0,0,.06), 0 5px 15px rgba(0,0,0,.08), 0 15px 35px -5px rgba(25,28,33,.2)";

/** White card, 1px borders, soft shadow, Celo forest green as the only brand color. */
export function flatTheme(override?: GoodReserveThemeOverride): GoodReserveTheme {
  return mergeTheme(
    {
      colors: {
        background: "#ffffff",
        surface: "#f9fafb",
        foreground: "#18181b",
        muted: "#71717a",
        primary: "#476520",
        primaryForeground: "#ffffff",
        danger: "#b91c1c",
        border: "#e4e4e7",
      },
      radii: {
        widget: "12px",
        control: "8px",
      },
      borderWidth: "1px",
      shadow: FLAT_SHADOW,
      fontFamily: '"Sen", ui-sans-serif, system-ui, sans-serif',
      toast: {
        background: "#ffffff",
        foreground: "#18181b",
        border: "#e4e4e7",
        shadow: "0 0 0 1px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.12)",
        durationMs: 4000,
        offset: "16px",
      },
    },
    override,
  );
}

export function mergeTheme(
  base: GoodReserveTheme,
  override?: GoodReserveThemeOverride,
): GoodReserveTheme {
  if (!override) return base;
  return {
    ...base,
    ...override,
    colors: { ...base.colors, ...override.colors },
    radii: { ...base.radii, ...override.radii },
    toast: { ...base.toast, ...override.toast },
  };
}

/** CSS variables applied on the widget root. Prefix is `grk`. */
export function themeToStyle(theme: GoodReserveTheme): Record<string, string> {
  return {
    "--grk-background": theme.colors.background,
    "--grk-surface": theme.colors.surface,
    "--grk-foreground": theme.colors.foreground,
    "--grk-muted": theme.colors.muted,
    "--grk-primary": theme.colors.primary,
    "--grk-primary-foreground": theme.colors.primaryForeground,
    "--grk-danger": theme.colors.danger,
    "--grk-border": theme.colors.border,
    "--grk-radius-widget": theme.radii.widget,
    "--grk-radius-control": theme.radii.control,
    "--grk-border-width": theme.borderWidth,
    "--grk-shadow": theme.shadow,
    "--grk-font": theme.fontFamily,
    "--grk-toast-background": theme.toast.background,
    "--grk-toast-foreground": theme.toast.foreground,
    "--grk-toast-border": theme.toast.border,
    "--grk-toast-shadow": theme.toast.shadow,
    "--grk-toast-offset": theme.toast.offset,
  };
}
