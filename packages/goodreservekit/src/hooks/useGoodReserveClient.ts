import { useMemo } from "react";
import { usePublicClient } from "wagmi";
import { celo } from "viem/chains";
import { createGoodDollarReserveClient } from "@cnvlabskoxyz/celina-sdk/gooddollar-reserve";
import type { PreparedReserveFlow } from "./usePrepareGoodReserveSwap.js";
import { useGoodReserveConfig } from "../provider/GoodReserveProvider.js";

export interface GoodReserveBrowserClient {
  getReserveQuote: (
    tokenIn: string,
    tokenOut: string,
    amount: string,
    options?: { amountSide?: "in" | "out" },
  ) => Promise<{
    protocol: "gooddollar_reserve";
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    expectedOut: string;
    amountSide: "in" | "out";
  }>;
  prepareReserveSwap: (
    from: `0x${string}`,
    tokenIn: string,
    tokenOut: string,
    amount: string,
    params?: { slippageTolerance?: number; amountSide?: "in" | "out" },
  ) => Promise<PreparedReserveFlow>;
}

export function useGoodReserveClient(): GoodReserveBrowserClient | null {
  const publicClient = usePublicClient({ chainId: celo.id });
  const { attributionTags } = useGoodReserveConfig();
  const tagKey = attributionTags?.join("|") ?? "";

  return useMemo(() => {
    if (!publicClient) return null;
    return createGoodDollarReserveClient(publicClient, {
      attributionTags: tagKey ? tagKey.split("|") : undefined,
    });
  }, [publicClient, tagKey]);
}
