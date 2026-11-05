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

export interface GoodReserveTheme {
  colors: GoodReserveThemeColors;
  radii: {
    widget: string;
    control: string;
  };
  borderWidth: string;
  shadow: string;
  fontFamily: string;
  fontFamilyMono: string;
}

export type GoodReserveThemeOverride = {
  colors?: Partial<GoodReserveThemeColors>;
  radii?: Partial<GoodReserveTheme["radii"]>;
  borderWidth?: string;
  shadow?: string;
  fontFamily?: string;
  fontFamilyMono?: string;
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
      fontFamilyMono: '"IBM Plex Mono", ui-monospace, monospace',
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
    "--grk-font-mono": theme.fontFamilyMono,
  };
}
