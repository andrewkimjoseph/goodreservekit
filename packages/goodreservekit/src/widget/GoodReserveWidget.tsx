import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { parseUnits } from "viem";
import { celo } from "viem/chains";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CnvLabsLogo } from "../icons/CnvLabsLogo.js";
import { GoodDollarIcon } from "../icons/GoodDollarIcon.js";
import { USDmIcon } from "../icons/USDmIcon.js";
import {
  displaySymbol,
  formatAmountInput,
  formatDisplayAmount,
  minimumReceived,
  pricePerTokenIn,
  tokensForDirection,
  type SwapDirection,
} from "../format.js";
import { useGoodReserveQuote } from "../hooks/useGoodReserveQuote.js";
import { useGoodReserveSwap, type GoodReserveSwapStep } from "../hooks/useGoodReserveSwap.js";
import { useReserveBalances, type ReserveBalance } from "../hooks/useReserveBalances.js";
import { useGoodReserveConfig } from "../provider/GoodReserveProvider.js";
import { themeToStyle } from "../theme/theme.js";
import { styles } from "../styles/styles.js";
import {
  GoodReserveToast,
  type GoodReserveToastItem,
  type GoodReserveToastPayload,
} from "./GoodReserveToast.js";
import "../styles/goodreserve.css";

const SLIPPAGE_PRESETS = [0.1, 0.5, 1] as const;

export interface GoodReserveWidgetProps {
  /** `buy` spends USDm for G$. `sell` spends G$ for USDm. */
  defaultDirection?: SwapDirection;
  /** Show the CNV Labs credit. Defaults to true. */
  showBranding?: boolean;
  /** Replace the default stamp. The host still receives tone, message, and dismiss. */
  renderToast?: (toast: GoodReserveToastPayload) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface GoodReserveWidgetApi extends GoodReserveWidgetProps {
  direction: SwapDirection;
  setDirection: (direction: SwapDirection) => void;
  amount: string;
  setAmount: (amount: string) => void;
  slippage: number;
  setSlippage: (slippage: number) => void;
  tokenIn: string;
  tokenOut: string;
  quoteText: string;
  priceText: string;
  minimumText: string;
  balance: ReserveBalance;
  outputBalance: ReserveBalance;
  isQuoteLoading: boolean;
  quoteError: string | null;
  step: GoodReserveSwapStep;
  swapError: string | null;
  isBusy: boolean;
  connected: boolean;
  wrongChain: boolean;
  canSwap: boolean;
  actionLabel: string;
  onConnect: () => void;
  onSwitchChain: () => void;
  onMax: () => void;
  onFlip: () => void;
  onSwap: () => void;
}

export function useGoodReserveWidget(props: GoodReserveWidgetProps): GoodReserveWidgetApi {
  const { defaultDirection = "buy", showBranding = true, className, style } = props;
  const [direction, setDirection] = useState<SwapDirection>(defaultDirection);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const balances = useReserveBalances();
  const quoteState = useGoodReserveQuote({ amount, direction });
  const swapState = useGoodReserveSwap();
  const { tokenIn, tokenOut } = tokensForDirection(direction);
  const balance = direction === "buy" ? balances.usdm : balances.goodDollar;
  const outputBalance = direction === "buy" ? balances.goodDollar : balances.usdm;

  useEffect(() => {
    swapState.reset();
  }, [amount, direction, slippage, swapState.reset]);

  useEffect(() => {
    if (swapState.step !== "done") return;
    void balances.refetch();
  }, [balances.refetch, swapState.step]);

  const insufficient = useMemo(() => {
    const parsed = quoteState.amount;
    if (!address || !parsed) return false;
    try {
      return parseUnits(parsed, 18) > balance.raw;
    } catch {
      return false;
    }
  }, [address, balance.raw, quoteState.amount]);

  const connected = Boolean(address);
  const wrongChain = connected && chainId !== celo.id;
  const canSwap = Boolean(
    connected &&
      !wrongChain &&
      quoteState.quote &&
      !quoteState.isLoading &&
      !insufficient &&
      !swapState.isBusy &&
      swapState.step !== "done",
  );

  let actionLabel = "Enter amount";
  if (!connected) actionLabel = "Connect wallet";
  else if (wrongChain) actionLabel = "Switch to Celo";
  else if (insufficient) actionLabel = "Insufficient balance";
  else if (quoteState.isLoading) actionLabel = "Quoting";
  else if (swapState.step === "preparing") actionLabel = "Preparing";
  else if (swapState.step === "approving") actionLabel = "Approve in wallet";
  else if (swapState.step === "swapping") actionLabel = "Sign swap";
  else if (swapState.step === "confirming") actionLabel = "Confirming";
  else if (swapState.step === "done") actionLabel = "Swapped";
  else if (quoteState.quote) actionLabel = "Swap";

  const expected = quoteState.quote?.expectedOut;
  const price = expected ? pricePerTokenIn(amount, expected) : null;

  return {
    defaultDirection,
    showBranding,
    className,
    style,
    direction,
    setDirection,
    amount,
    setAmount,
    slippage,
    setSlippage,
    tokenIn,
    tokenOut,
    quoteText: expected ? formatDisplayAmount(expected) : "0",
    priceText: price
      ? `${price} ${displaySymbol(tokenOut)} PER ${displaySymbol(tokenIn)}`
      : `0 ${displaySymbol(tokenOut)} PER ${displaySymbol(tokenIn)}`,
    minimumText: expected
      ? `${minimumReceived(expected, slippage) ?? "0"} ${displaySymbol(tokenOut)}`
      : `0 ${displaySymbol(tokenOut)}`,
    balance,
    outputBalance,
    isQuoteLoading: quoteState.isLoading,
    quoteError: quoteState.error,
    step: swapState.step,
    swapError: swapState.error,
    isBusy: swapState.isBusy,
    connected,
    wrongChain,
    canSwap,
    actionLabel,
    onConnect: () => openConnectModal?.(),
    onSwitchChain: () => switchChain({ chainId: celo.id }),
    onMax: () => setAmount(formatAmountInput(balance.formatted)),
    onFlip: () => setDirection((current) => (current === "buy" ? "sell" : "buy")),
    onSwap: () => {
      const parsed = quoteState.amount;
      if (!parsed) return;
      void swapState.swap({
        tokenIn,
        tokenOut,
        amount: parsed,
        slippageTolerance: slippage,
        amountSide: "in",
      });
    },
  };
}

function TokenFace({ symbol }: { symbol: string }) {
  const Icon = symbol === "GoodDollar" ? GoodDollarIcon : USDmIcon;
  return <Icon className={styles.badge} size={42} />;
}

export function GoodReserveView({ api }: { api: GoodReserveWidgetApi }) {
  const { theme } = useGoodReserveConfig();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");

  return (
    <section
      className={[styles.root, api.className].filter(Boolean).join(" ")}
      style={{ ...themeToStyle(theme), ...api.style }}
    >
      <header className={styles.header}>
        <h2 className={styles.wordmark}>
          Good<span>Reserve</span>
        </h2>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Transaction settings"
          aria-pressed={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <GearIcon />
        </button>
      </header>

      {settingsOpen ? (
        <div className={styles.settings}>
          <h3>Slippage tolerance</h3>
          <div className={styles.presets}>
            {SLIPPAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={styles.preset}
                aria-pressed={api.slippage === preset}
                onClick={() => {
                  api.setSlippage(preset);
                  setCustomSlippage("");
                }}
              >
                {preset}%
              </button>
            ))}
            <input
              className={styles.custom}
              inputMode="decimal"
              aria-label="Custom slippage percent"
              placeholder="Custom"
              value={customSlippage}
              onChange={(event) => {
                const next = event.target.value;
                setCustomSlippage(next);
                const numeric = Number(next);
                if (Number.isFinite(numeric) && numeric > 0 && numeric <= 50) {
                  api.setSlippage(numeric);
                }
              }}
            />
          </div>
        </div>
      ) : null}

      <div className={styles.card}>
        <div className={styles.row}>
          <div className={styles.token}>
            <TokenFace symbol={api.tokenIn} />
            <div>
              <p className={styles.label}>Swap from</p>
              <p className={styles.symbol}>{displaySymbol(api.tokenIn)}</p>
            </div>
          </div>
          <div className={styles.amountWrap}>
            <div className={styles.amountLine}>
              <button type="button" className={styles.max} onClick={api.onMax} disabled={!api.connected}>
                Max
              </button>
              <input
                className={styles.input}
                inputMode="decimal"
                aria-label={`Amount of ${displaySymbol(api.tokenIn)} to swap`}
                placeholder="0"
                value={api.amount}
                onChange={(event) => api.setAmount(event.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </div>
        </div>
        <p className={styles.balance}>Balance: {api.connected ? api.balance.display : "—"}</p>
      </div>

      <div className={styles.flipWrap}>
        <button type="button" className={styles.flip} aria-label="Flip swap direction" onClick={api.onFlip}>
          ↕
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <div className={styles.token}>
            <TokenFace symbol={api.tokenOut} />
            <div>
              <p className={styles.label}>Swap to</p>
              <p className={styles.symbol}>{displaySymbol(api.tokenOut)}</p>
            </div>
          </div>
          <div className={styles.amountWrap}>
            <output className={styles.output} aria-label="Expected output">
              {api.isQuoteLoading ? "…" : api.quoteText}
            </output>
          </div>
        </div>
        <p className={styles.balance}>Balance: {api.connected ? api.outputBalance.display : "—"}</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Slippage tolerance</span>
          <b>{api.slippage}%</b>
        </div>
        <div className={styles.stat}>
          <span>Price</span>
          <b>{api.priceText}</b>
        </div>
        <div className={styles.stat}>
          <span>Minimum received</span>
          <b>{api.minimumText}</b>
        </div>
      </div>

      <div className={`${styles.actions} ${styles.actionsSingle}`}>
        <button
          type="button"
          className={`${styles.button} ${styles.primary}`}
          disabled={api.connected && !api.wrongChain && !api.canSwap}
          onClick={() => {
            if (!api.connected) api.onConnect();
            else if (api.wrongChain) api.onSwitchChain();
            else api.onSwap();
          }}
        >
          {api.actionLabel}
        </button>
      </div>
      {api.showBranding ? (
        <p className={styles.brand}>
          <span>GoodReserve by</span>
          <CnvLabsLogo className={styles.brandLogo} />
        </p>
      ) : null}
    </section>
  );
}

export function GoodReserveWidget({ renderToast, ...props }: GoodReserveWidgetProps) {
  const api = useGoodReserveWidget(props);
  return (
    <>
      <GoodReserveView api={api} />
      <ReserveToasts step={api.step} swapError={api.swapError} renderToast={renderToast} />
    </>
  );
}

function CustomWidget({
  children,
  renderToast,
  ...props
}: GoodReserveWidgetProps & { children: (api: GoodReserveWidgetApi) => ReactNode }) {
  const api = useGoodReserveWidget(props);
  return (
    <>
      {children(api)}
      <ReserveToasts step={api.step} swapError={api.swapError} renderToast={renderToast} />
    </>
  );
}

function ReserveToasts({
  step,
  swapError,
  renderToast,
}: {
  step: GoodReserveWidgetApi["step"];
  swapError: string | null;
  renderToast?: (toast: GoodReserveToastPayload) => ReactNode;
}) {
  const [item, setItem] = useState<GoodReserveToastItem | null>(null);
  const nextId = useRef(0);
  const dismiss = useCallback(() => setItem(null), []);

  useEffect(() => {
    if (step === "error" && swapError) {
      setItem({ id: ++nextId.current, tone: "error", message: swapError });
      return;
    }
    if (step === "done") {
      setItem({ id: ++nextId.current, tone: "success", message: "Swapped." });
    }
  }, [step, swapError]);

  return <GoodReserveToast item={item} onDismiss={dismiss} renderToast={renderToast} />;
}

GoodReserveWidget.Custom = CustomWidget;

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9 1.5v2.2M9 14.3V16.5M1.5 9h2.2M14.3 9H16.5M3.4 3.4l1.6 1.6M13 13l1.6 1.6M14.6 3.4 13 5M5 13l-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
