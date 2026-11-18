import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoodReserveProvider } from "../provider/GoodReserveProvider.js";
import { GoodReserveWidget } from "./GoodReserveWidget.js";

const { openConnectModal, getReserveQuote, prepareReserveSwap, sendTransactionAsync, publicClient, refetchBalances } =
  vi.hoisted(() => ({
    openConnectModal: vi.fn(),
    getReserveQuote: vi.fn(),
    prepareReserveSwap: vi.fn(),
    sendTransactionAsync: vi.fn(),
    refetchBalances: vi.fn(async () => ({})),
    publicClient: {
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success" })),
    },
  }));

vi.mock("wagmi", () => ({
  useAccount: () => accountState,
  usePublicClient: () => publicClient,
  useSendTransaction: () => ({ sendTransactionAsync }),
  useSwitchChain: () => ({ switchChain: vi.fn() }),
  useReadContracts: () => ({
    data: accountState.address
      ? [{ result: 2_000000000000000000n, status: "success" }, { result: 5_000000000000000000n, status: "success" }]
      : undefined,
    isLoading: false,
    refetch: refetchBalances,
  }),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => ({ openConnectModal }),
}));

vi.mock("@cnvlabskoxyz/celina-sdk/gooddollar-reserve", () => ({
  GOODDOLLAR_TOKEN_ADDRESS: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A",
  GOODDOLLAR_RESERVE_COLLATERAL: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  createGoodDollarReserveClient: () => ({
    getReserveQuote,
    prepareReserveSwap,
  }),
}));

vi.mock("@cnvlabskoxyz/celina-sdk/onchain-stats", () => ({
  reportCelinaOnchainTxn: vi.fn(),
}));

let accountState: { address?: `0x${string}`; chainId?: number } = {};

function renderWidget(props?: { showBranding?: boolean; defaultDirection?: "buy" | "sell" }) {
  return render(
    <GoodReserveProvider attributionTags={["demo"]}>
      <GoodReserveWidget {...props} />
    </GoodReserveProvider>,
  );
}

describe("GoodReserveWidget", () => {
  beforeEach(() => {
    accountState = {};
    openConnectModal.mockReset();
    refetchBalances.mockClear();
    getReserveQuote.mockReset();
    getReserveQuote.mockResolvedValue({
      protocol: "gooddollar_reserve",
      tokenIn: "USDm",
      tokenOut: "GoodDollar",
      amountIn: "1",
      expectedOut: "8000",
      amountSide: "in",
    });
    prepareReserveSwap.mockReset();
  });

  it("asks RainbowKit to connect when no wallet is connected", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(openConnectModal).toHaveBeenCalledOnce();
    expect(screen.getByText("GoodReserve by")).toBeTruthy();
    expect(screen.getByRole("img", { name: "CNV Labs KO XYZ" })).toBeTruthy();
  });

  it("hides the credit when branding is off", () => {
    renderWidget({ showBranding: false });
    expect(screen.queryByText("GoodReserve by")).toBeNull();
    expect(screen.queryByRole("img", { name: "CNV Labs KO XYZ" })).toBeNull();
  });

  it("shows the reserve quote and submits the typed amount", async () => {
    accountState = {
      address: "0x0000000000000000000000000000000000000001",
      chainId: 42220,
    };
    prepareReserveSwap.mockResolvedValue({
      preparedFlow: true,
      chainId: 42220,
      from: accountState.address,
      summary: "swap",
      steps: [
        {
          kind: "contract",
          to: "0x88de45906D4F5a57315c133620cfa484cB297541",
          data: "0x1234",
          value: "0",
          description: "swap",
        },
      ],
    });
    sendTransactionAsync.mockResolvedValue("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

    renderWidget();
    fireEvent.change(screen.getByLabelText("Amount of USDm to swap"), { target: { value: "1" } });

    expect(await screen.findByRole("button", { name: "Swap" })).toBeTruthy();
    expect(screen.getByLabelText("Expected output").textContent).toMatch(/8.?000/);
    expect(getReserveQuote).toHaveBeenCalledWith("USDm", "GoodDollar", "1", { amountSide: "in" });

    fireEvent.click(screen.getByRole("button", { name: "Swap" }));
    await waitFor(() => {
      expect(prepareReserveSwap).toHaveBeenCalledWith(
        accountState.address,
        "USDm",
        "GoodDollar",
        "1",
        { slippageTolerance: 0.5, amountSide: "in" },
      );
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Swapped" })).toBeTruthy();
    });
    expect(refetchBalances).toHaveBeenCalled();
    expect((await screen.findByRole("alert")).textContent).toContain("Swapped.");
    expect(document.querySelector(".grk-root")?.textContent).not.toContain("Swapped.");
  });

  it("toasts a rejected signature instead of printing it in the card", async () => {
    accountState = {
      address: "0x0000000000000000000000000000000000000001",
      chainId: 42220,
    };
    prepareReserveSwap.mockResolvedValue({
      preparedFlow: true,
      chainId: 42220,
      from: accountState.address,
      summary: "swap",
      steps: [
        {
          kind: "contract",
          to: "0x88de45906D4F5a57315c133620cfa484cB297541",
          data: "0x1234",
          value: "0",
          description: "swap",
        },
      ],
    });
    sendTransactionAsync.mockRejectedValue(new Error("User rejected the request."));

    renderWidget();
    fireEvent.change(screen.getByLabelText("Amount of USDm to swap"), { target: { value: "1" } });
    fireEvent.click(await screen.findByRole("button", { name: "Swap" }));

    const toast = await screen.findByRole("alert");
    expect(toast.textContent).toContain("You rejected the request in your wallet. Nothing was swapped.");
    expect(document.querySelector(".grk-root")?.textContent).not.toContain("Nothing was swapped");
  });

  it("does not toast a quote failure", async () => {
    accountState = {
      address: "0x0000000000000000000000000000000000000001",
      chainId: 42220,
    };
    getReserveQuote.mockRejectedValue(new Error("rpc down"));
    renderWidget();
    fireEvent.change(screen.getByLabelText("Amount of USDm to swap"), { target: { value: "1" } });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Enter amount" })).toBeTruthy();
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the typed amount when the direction flips", () => {
    renderWidget();
    fireEvent.change(screen.getByLabelText("Amount of USDm to swap"), { target: { value: "12.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Flip swap direction" }));

    const input = screen.getByLabelText("Amount of G$ to swap") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(screen.getByLabelText("Expected output").textContent).toBe("0");
  });

  it("opens slippage settings and applies the 1% preset", () => {
    renderWidget();
    const settings = screen.getByRole("button", { name: "Slippage settings, 0.5%" });
    expect(settings.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("grk-slippage")?.closest("[data-open]")?.getAttribute("data-open")).toBe(
      "false",
    );

    fireEvent.click(settings);
    expect(settings.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("grk-slippage")?.closest("[data-open]")?.getAttribute("data-open")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "1%" }));
    expect(screen.getByRole("button", { name: "Slippage settings, 1%" })).toBeTruthy();
  });

  it("shows the custom slippage that is actually applied", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: "Slippage settings, 0.5%" }));
    const custom = screen.getByLabelText("Custom slippage percent") as HTMLInputElement;

    fireEvent.change(custom, { target: { value: "90" } });
    expect(custom.value).toBe("50");
    expect(screen.getByRole("button", { name: "Slippage settings, 50%" })).toBeTruthy();
    expect(custom.parentElement?.getAttribute("data-active")).toBe("true");

    fireEvent.change(custom, { target: { value: "0.75" } });
    expect(custom.value).toBe("0.75");
    expect(screen.getByRole("button", { name: "Slippage settings, 0.75%" })).toBeTruthy();

    fireEvent.change(custom, { target: { value: "0." } });
    expect(custom.value).toBe("0.");
    expect(screen.getByRole("button", { name: "Slippage settings, 0.75%" })).toBeTruthy();
    fireEvent.blur(custom);
    expect(custom.value).toBe("");
    expect(screen.getByRole("button", { name: "Slippage settings, 0.5%" })).toBeTruthy();

    fireEvent.change(custom, { target: { value: "0.75" } });
    fireEvent.click(screen.getByRole("button", { name: "1%" }));
    expect(custom.value).toBe("");
    expect(screen.getByRole("button", { name: "Slippage settings, 1%" })).toBeTruthy();
    expect(custom.parentElement?.getAttribute("data-active")).toBe("false");
  });

  it("exposes the same actions through the custom render prop", () => {
    render(
      <GoodReserveWidget.Custom>
        {(api) => (
          <button type="button" onClick={api.onConnect}>
            {api.actionLabel}
          </button>
        )}
      </GoodReserveWidget.Custom>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(openConnectModal).toHaveBeenCalledOnce();
  });
});
