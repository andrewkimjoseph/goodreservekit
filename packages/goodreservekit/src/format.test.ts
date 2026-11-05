import { describe, expect, it } from "vitest";
import {
  minimumReceived,
  parsePositiveAmount,
  pricePerTokenIn,
  tokensForDirection,
} from "./format.js";
import { brutalistTheme, mergeTheme } from "./theme/theme.js";

describe("reserve formatting", () => {
  it("maps buy and sell onto the reserve pair", () => {
    expect(tokensForDirection("buy")).toEqual({ tokenIn: "USDm", tokenOut: "GoodDollar" });
    expect(tokensForDirection("sell")).toEqual({ tokenIn: "GoodDollar", tokenOut: "USDm" });
  });

  it("accepts a positive decimal and rejects junk", () => {
    expect(parsePositiveAmount(" 10.5 ")).toBe("10.5");
    expect(parsePositiveAmount("0")).toBeNull();
    expect(parsePositiveAmount("1e2")).toBeNull();
    expect(parsePositiveAmount("-4")).toBeNull();
  });

  it("states output per input and the slippage floor", () => {
    expect(pricePerTokenIn("1000", "2")).toBe("0.002");
    expect(minimumReceived("2", 0.5)).toBe("1.99");
  });
});

describe("brutalist theme", () => {
  it("keeps the Celo yellow accent and lets a host replace one token", () => {
    const theme = brutalistTheme();
    expect(theme.colors.accent).toBe("#FCFF52");
    expect(theme.colors.primary).toBe("#476520");
    expect(theme.radii.widget).toBe("0px");
    const merged = mergeTheme(theme, { colors: { accent: "#ff00aa" } });
    expect(merged.colors.accent).toBe("#ff00aa");
    expect(merged.colors.primary).toBe("#476520");
    expect(merged.shadow).toBe(theme.shadow);
  });
});
