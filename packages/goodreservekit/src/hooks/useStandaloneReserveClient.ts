import { useMemo } from "react";
import { createPublicClient, http, type PublicClient } from "viem";
import { celo } from "viem/chains";
import { createGoodDollarReserveClient } from "@cnvlabskoxyz/celina-sdk/gooddollar-reserve";
import type { GoodReserveBrowserClient } from "./useGoodReserveClient.js";
import { useGoodReserveConfig } from "../provider/GoodReserveProvider.js";

const publicClients = new Map<string, PublicClient>();

/** Celo Forno. Used when a host does not pass rpcUrl. */
export const DEFAULT_CELO_RPC_URL = "https://forno.celo.org";

function celoPublicClient(rpcUrl?: string): PublicClient {
  const url = rpcUrl || DEFAULT_CELO_RPC_URL;
  const existing = publicClients.get(url);
  if (existing) return existing;
  const client = createPublicClient({
    chain: celo,
    transport: http(url),
  });
  publicClients.set(url, client);
  return client;
}

const DEFAULT_ANALYTICS_DEVICE_ID = "cnvlabskoxyz_goodreservekit";

/** Reserve client for quote-only mode. Uses a public Celo RPC and does not need wagmi. */
export function useStandaloneReserveClient(): GoodReserveBrowserClient {
  const { rpcUrl, analyticsDeviceId } = useGoodReserveConfig();
  return useMemo(
    () =>
      createGoodDollarReserveClient(celoPublicClient(rpcUrl), {
        analyticsDeviceId: analyticsDeviceId ?? DEFAULT_ANALYTICS_DEVICE_ID,
      }),
    [rpcUrl, analyticsDeviceId],
  );
}
