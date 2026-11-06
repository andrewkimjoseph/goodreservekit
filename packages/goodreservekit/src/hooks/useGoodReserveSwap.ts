import { useCallback, useState } from "react";
import { usePublicClient, useSendTransaction } from "wagmi";
import { celo } from "viem/chains";
import { reportCelinaOnchainTxn } from "@cnvlabskoxyz/celina-sdk/onchain-stats";
import {
  usePrepareGoodReserveSwap,
  type PrepareGoodReserveSwapArgs,
} from "./usePrepareGoodReserveSwap.js";

export type GoodReserveSwapStep =
  | "idle"
  | "preparing"
  | "approving"
  | "swapping"
  | "confirming"
  | "done"
  | "error";

function failureMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Swap failed";
  const lower = raw.toLowerCase();
  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request")
  ) {
    return "You rejected the request in your wallet. Nothing was swapped.";
  }
  const first = raw.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "Swap failed";
  if (first.length > 180) return "The swap did not complete. Nothing was swapped.";
  return first;
}

export function useGoodReserveSwap() {
  const prepare = usePrepareGoodReserveSwap();
  const publicClient = usePublicClient({ chainId: celo.id });
  const { sendTransactionAsync } = useSendTransaction();
  const [step, setStep] = useState<GoodReserveSwapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(null);
  }, []);

  const swap = useCallback(
    async (args: PrepareGoodReserveSwapArgs) => {
      if (!publicClient) {
        setStep("error");
        setError("Celo mainnet is not available from this app.");
        return;
      }
      setError(null);
      setTxHash(null);
      setStep("preparing");
      try {
        const flow = await prepare(args);
        let lastHash: `0x${string}` | null = null;
        for (const tx of flow.steps) {
          if (!tx.data) throw new Error("Prepared step is missing calldata.");
          setStep(tx.kind === "erc20" ? "approving" : "swapping");
          const hash = await sendTransactionAsync({
            to: tx.to,
            data: tx.data,
            value: tx.value && tx.value !== "0" ? BigInt(tx.value) : undefined,
            chainId: celo.id,
          });
          lastHash = hash;
          setStep("confirming");
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status !== "success") {
            throw new Error("Transaction reverted");
          }
          reportCelinaOnchainTxn(hash);
        }
        setTxHash(lastHash);
        setStep("done");
      } catch (cause) {
        setError(failureMessage(cause));
        setStep("error");
      }
    },
    [prepare, publicClient, sendTransactionAsync],
  );

  return { swap, step, error, txHash, reset, isBusy: step !== "idle" && step !== "done" && step !== "error" };
}
