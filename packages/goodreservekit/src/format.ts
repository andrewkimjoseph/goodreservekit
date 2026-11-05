export type SwapDirection = "buy" | "sell";

export function tokensForDirection(direction: SwapDirection): {
  tokenIn: "USDm" | "GoodDollar";
  tokenOut: "USDm" | "GoodDollar";
} {
  return direction === "buy"
    ? { tokenIn: "USDm", tokenOut: "GoodDollar" }
    : { tokenIn: "GoodDollar", tokenOut: "USDm" };
}

export function displaySymbol(symbol: string): string {
  if (symbol === "GoodDollar" || symbol === "G$") return "G$";
  return symbol;
}

/** Decimal amount the reserve client can parse. Empty or junk returns null. */
export function parsePositiveAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return trimmed;
}

export function formatDisplayAmount(value: string, maxDecimals = 4): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return numeric.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

/** Swap-field amount: no grouping, truncated so a max balance fits the input. */
export function formatAmountInput(value: string, maxDecimals = 6): string {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return value;
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").slice(0, maxDecimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function pricePerTokenIn(amountIn: string, expectedOut: string): string | null {
  const input = Number(amountIn);
  const output = Number(expectedOut);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input <= 0) return null;
  const price = output / input;
  if (price >= 1) {
    return price.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }
  return price.toLocaleString(undefined, { maximumSignificantDigits: 6 });
}

export function minimumReceived(expectedOut: string, slippagePercent: number): string | null {
  const output = Number(expectedOut);
  if (!Number.isFinite(output)) return null;
  const min = output * (1 - slippagePercent / 100);
  if (min < 0) return null;
  return formatDisplayAmount(String(min));
}

export function trimTrailingZeros(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/\.?0+$/, "");
}
