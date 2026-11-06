import { useEffect, useState } from "react";
import type { GoodDollarReserveAmountSide } from "@cnvlabskoxyz/celina-sdk/gooddollar-reserve";
import { parsePositiveAmount, type SwapDirection, tokensForDirection } from "../format.js";
import { useGoodReserveClient } from "./useGoodReserveClient.js";

const QUOTE_DEBOUNCE_MS = 300;

export interface ReserveQuote {
  protocol: "gooddollar_reserve";
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedOut: string;
  amountSide: GoodDollarReserveAmountSide;
}

export interface UseGoodReserveQuoteArgs {
  amount: string;
  direction: SwapDirection;
  amountSide?: GoodDollarReserveAmountSide;
}

export function useGoodReserveQuote({
  amount,
  direction,
  amountSide = "in",
}: UseGoodReserveQuoteArgs) {
  const client = useGoodReserveClient();
  const parsed = parsePositiveAmount(amount);
  const { tokenIn, tokenOut } = tokensForDirection(direction);
  const [quote, setQuote] = useState<ReserveQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !parsed) {
      setQuote(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const timer = setTimeout(() => {
      void client
        .getReserveQuote(tokenIn, tokenOut, parsed, { amountSide })
        .then((next) => {
          if (cancelled) return;
          setQuote({
            protocol: next.protocol,
            tokenIn: next.tokenIn,
            tokenOut: next.tokenOut,
            amountIn: next.amountIn,
            expectedOut: next.expectedOut,
            amountSide: next.amountSide,
          });
          setError(null);
        })
        .catch((cause: unknown) => {
          if (cancelled) return;
          setQuote(null);
          setError(cause instanceof Error ? cause.message : "Could not load a reserve quote.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amountSide, client, direction, parsed, tokenIn, tokenOut]);

  return { quote, isLoading, error, tokenIn, tokenOut, amount: parsed };
}
