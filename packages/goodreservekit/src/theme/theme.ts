export interface GoodReserveThemeColors {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  accentForeground: string;
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
  fontFamilySecondary: string;
  fontFamilyMono: string;
  toast: GoodReserveToastTheme;
}

export type GoodReserveThemeOverride = {
  colors?: Partial<GoodReserveThemeColors>;
  radii?: Partial<GoodReserveTheme["radii"]>;
  borderWidth?: string;
  shadow?: string;
  fontFamily?: string;
  fontFamilySecondary?: string;
  fontFamilyMono?: string;
  toast?: Partial<GoodReserveToastTheme>;
};

/** Black, white, Celo forest, and Celo yellow. Square corners and a hard shadow. */
export function brutalistTheme(override?: GoodReserveThemeOverride): GoodReserveTheme {
  return mergeTheme(
    {
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        muted: "#5c6152",
        accent: "#FCFF52",
        accentForeground: "#000000",
        primary: "#476520",
        primaryForeground: "#ffffff",
        danger: "#9b1c1c",
        border: "#000000",
      },
      radii: {
        widget: "0px",
        control: "0px",
      },
      borderWidth: "3px",
      shadow: "6px 6px 0 #000000",
      fontFamily: '"Bricolage Grotesque", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
      fontFamilySecondary: '"Sen", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
      fontFamilyMono: '"IBM Plex Mono", ui-monospace, monospace',
      toast: {
        background: "#ffffff",
        foreground: "#9b1c1c",
        border: "#000000",
        shadow: "4px 4px 0 #000000",
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
    "--grk-foreground": theme.colors.foreground,
    "--grk-muted": theme.colors.muted,
    "--grk-accent": theme.colors.accent,
    "--grk-accent-foreground": theme.colors.accentForeground,
    "--grk-primary": theme.colors.primary,
    "--grk-primary-foreground": theme.colors.primaryForeground,
    "--grk-danger": theme.colors.danger,
    "--grk-border": theme.colors.border,
    "--grk-radius-widget": theme.radii.widget,
    "--grk-radius-control": theme.radii.control,
    "--grk-border-width": theme.borderWidth,
    "--grk-shadow": theme.shadow,
    "--grk-font": theme.fontFamily,
    "--grk-font-secondary": theme.fontFamilySecondary,
    "--grk-font-mono": theme.fontFamilyMono,
    "--grk-toast-background": theme.toast.background,
    "--grk-toast-foreground": theme.toast.foreground,
    "--grk-toast-border": theme.toast.border,
    "--grk-toast-shadow": theme.toast.shadow,
    "--grk-toast-offset": theme.toast.offset,
  };
}
