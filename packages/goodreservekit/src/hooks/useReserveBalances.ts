import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import {
  GOODDOLLAR_RESERVE_COLLATERAL,
  GOODDOLLAR_TOKEN_ADDRESS,
} from "@cnvlabskoxyz/celina-sdk/gooddollar-reserve";
import { formatDisplayAmount } from "../format.js";

export interface ReserveBalance {
  raw: bigint;
  formatted: string;
  display: string;
}

const ZERO: ReserveBalance = { raw: 0n, formatted: "0", display: "0" };

function toBalance(value: unknown): ReserveBalance {
  if (typeof value !== "bigint") return ZERO;
  const formatted = formatUnits(value, 18);
  return { raw: value, formatted, display: formatDisplayAmount(formatted, 4) };
}

export function useReserveBalances() {
  const { address } = useAccount();
  const result = useReadContracts({
    allowFailure: true,
    contracts: address
      ? [
          {
            address: GOODDOLLAR_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: GOODDOLLAR_RESERVE_COLLATERAL,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address],
          },
        ]
      : [],
    query: { enabled: Boolean(address) },
  });

  const goodDollar = toBalance(result.data?.[0]?.result);
  const usdm = toBalance(result.data?.[1]?.result);
  return { goodDollar, usdm, isLoading: result.isLoading };
}
