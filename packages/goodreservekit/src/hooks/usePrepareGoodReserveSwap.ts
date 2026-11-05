import { useCallback } from "react";
import { useAccount } from "wagmi";
import type { GoodDollarReserveAmountSide } from "@cnvlabskoxyz/celina-sdk/gooddollar-reserve";
import { useGoodReserveClient } from "./useGoodReserveClient.js";

export interface PrepareGoodReserveSwapArgs {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
  amountSide?: GoodDollarReserveAmountSide;
}

export interface PreparedReserveStep {
  kind: string;
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: string;
  description: string;
}

export interface PreparedReserveFlow {
  steps: PreparedReserveStep[];
}

export function usePrepareGoodReserveSwap(): (
  args: PrepareGoodReserveSwapArgs,
) => Promise<PreparedReserveFlow> {
  const client = useGoodReserveClient();
  const { address } = useAccount();

  return useCallback(
    async (args: PrepareGoodReserveSwapArgs) => {
      if (!client || !address) {
        throw new Error("Connect a wallet on Celo mainnet.");
      }
      return client.prepareReserveSwap(address, args.tokenIn, args.tokenOut, args.amount, {
        slippageTolerance: args.slippageTolerance,
        amountSide: args.amountSide ?? "in",
      });
    },
    [address, client],
  );
}
