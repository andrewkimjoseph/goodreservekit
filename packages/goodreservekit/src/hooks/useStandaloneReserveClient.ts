import { useMemo } from "react";
import { createPublicClient, http, type PublicClient } from "viem";
import { celo } from "viem/chains";
import { createGoodDollarReserveClient } from "@cnvlabskoxyz/celina-sdk/gooddollar-reserve";
import type { GoodReserveBrowserClient } from "./useGoodReserveClient.js";
import { useGoodReserveConfig } from "../provider/GoodReserveProvider.js";

const publicClients = new Map<string, PublicClient>();

function celoPublicClient(rpcUrl?: string): PublicClient {
  const key = rpcUrl ?? "";
  const existing = publicClients.get(key);
  if (existing) return existing;
  const client = createPublicClient({
    chain: celo,
    transport: http(rpcUrl),
  });
  publicClients.set(key, client);
  return client;
}

/** Reserve client for quote-only mode. Uses a public Celo RPC and does not need wagmi. */
export function useStandaloneReserveClient(): GoodReserveBrowserClient {
  const { rpcUrl } = useGoodReserveConfig();
  return useMemo(() => createGoodDollarReserveClient(celoPublicClient(rpcUrl)), [rpcUrl]);
}
