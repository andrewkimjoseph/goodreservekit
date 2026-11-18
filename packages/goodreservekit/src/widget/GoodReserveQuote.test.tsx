import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoodReserveProvider } from "../provider/GoodReserveProvider.js";
import { GoodReserveWidget } from "./GoodReserveWidget.js";

const { getReserveQuote } = vi.hoisted(() => ({
  getReserveQuote: vi.fn(),
}));

vi.mock("wagmi", () => ({
  useAccount: () => {
    throw new Error("quote mode called useAccount");
  },
  usePublicClient: () => {
    throw new Error("quote mode called usePublicClient");
  },
  useSendTransaction: () => {
    throw new Error("quote mode called useSendTransaction");
  },
  useSwitchChain: () => {
    throw new Error("quote mode called useSwitchChain");
  },
  useReadContracts: () => {
    throw new Error("quote mode called useReadContracts");
  },
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useConnectModal: () => {
    throw new Error("quote mode called useConnectModal");
  },
}));

vi.mock("@cnvlabskoxyz/celina-sdk/gooddollar-reserve", () => ({
  createGoodDollarReserveClient: () => ({
    getReserveQuote,
  }),
}));

describe("GoodReserveWidget quote mode", () => {
  beforeEach(() => {
    getReserveQuote.mockReset();
    getReserveQuote.mockResolvedValue({
      protocol: "gooddollar_reserve",
      tokenIn: "USDm",
      tokenOut: "GoodDollar",
      amountIn: "1",
      expectedOut: "8000",
      amountSide: "in",
    });
  });

  it("quotes without wagmi, RainbowKit, or a provider", async () => {
    render(<GoodReserveWidget mode="quote" />);
    expect(screen.getByRole("img", { name: "GoodReserve" })).toBeTruthy();
    expect(screen.getByText("AIOSS")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Max" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Swap" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Slippage/ })).toBeNull();
    expect(screen.queryByText(/Balance/)).toBeNull();
    expect(screen.queryByText("Slippage tolerance")).toBeNull();
    expect(screen.queryByText("Minimum received")).toBeNull();

    fireEvent.change(screen.getByLabelText("Amount of USDm to quote"), { target: { value: "1" } });
    await waitFor(() => {
      expect(screen.getByLabelText("Expected output").textContent).toMatch(/8.?000/);
    });
    expect(screen.getByText(/8.?000 G\$ per 1 USDm/)).toBeTruthy();
    expect(getReserveQuote).toHaveBeenCalledWith("USDm", "GoodDollar", "1", { amountSide: "in" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the typed amount when the direction flips", async () => {
    render(<GoodReserveWidget mode="quote" />);
    fireEvent.change(screen.getByLabelText("Amount of USDm to quote"), { target: { value: "12.5" } });
    await screen.findByText(/G\$ per 1 USDm/);
    fireEvent.click(screen.getByRole("button", { name: "Flip swap direction" }));

    const input = screen.getByLabelText("Amount of G$ to quote") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(screen.getByText(/G\$ per 1 USDm/)).toBeTruthy();
    expect(screen.queryByText(/per G\$/)).toBeNull();
    await waitFor(() => {
      expect(screen.getByLabelText("Expected output").textContent).toBe("0");
    });
  });

  it("shows a quote failure in the card", async () => {
    getReserveQuote.mockRejectedValue(new Error("rpc down"));
    render(<GoodReserveWidget mode="quote" />);
    fireEvent.change(screen.getByLabelText("Amount of USDm to quote"), { target: { value: "1" } });
    expect(await screen.findByText("rpc down")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides the credit when branding is off", () => {
    render(<GoodReserveWidget mode="quote" showBranding={false} />);
    expect(screen.queryByText("AIOSS")).toBeNull();
  });

  it("uses a provider rpc url without calling wallet hooks", async () => {
    render(
      <GoodReserveProvider rpcUrl="https://forno.celo.org">
        <GoodReserveWidget.Custom mode="quote">
          {(api) => <span>{api.mode}</span>}
        </GoodReserveWidget.Custom>
      </GoodReserveProvider>,
    );
    expect(screen.getByText("quote")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });
});
