import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  flatTheme,
  type GoodReserveTheme,
  type GoodReserveThemeOverride,
} from "../theme/theme.js";

export interface GoodReserveConfig {
  attributionTags?: string[];
  /** Public Celo HTTP endpoint for quote-only mode. Omit to use viem's default. */
  rpcUrl?: string;
  theme: GoodReserveTheme;
}

const GoodReserveContext = createContext<GoodReserveConfig | null>(null);

export interface GoodReserveProviderProps {
  /** Extra ERC-8021 codes appended after `celina` on approve and swap calldata. */
  attributionTags?: string[];
  /** Public Celo HTTP endpoint used by quote-only mode. */
  rpcUrl?: string;
  theme?: GoodReserveTheme | GoodReserveThemeOverride;
  children: ReactNode;
}

function isFullTheme(theme: GoodReserveTheme | GoodReserveThemeOverride): theme is GoodReserveTheme {
  return (
    "borderWidth" in theme &&
    "fontFamily" in theme &&
    "colors" in theme &&
    theme.colors?.background !== undefined &&
    theme.colors.foreground !== undefined
  );
}

export function GoodReserveProvider({
  attributionTags,
  rpcUrl,
  theme,
  children,
}: GoodReserveProviderProps) {
  const tagKey = attributionTags?.join("|") ?? "";
  const resolvedTheme = useMemo(
    () => (theme && isFullTheme(theme) ? theme : flatTheme(theme)),
    [theme],
  );
  const value = useMemo<GoodReserveConfig>(
    () => ({
      attributionTags: tagKey ? tagKey.split("|") : undefined,
      rpcUrl,
      theme: resolvedTheme,
    }),
    [tagKey, rpcUrl, resolvedTheme],
  );

  return <GoodReserveContext.Provider value={value}>{children}</GoodReserveContext.Provider>;
}

export function useGoodReserveConfig(): GoodReserveConfig {
  return useContext(GoodReserveContext) ?? { theme: flatTheme() };
}
