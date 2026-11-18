import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { parseUnits } from "viem";
import { celo } from "viem/chains";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CnvLabsLogo } from "../icons/CnvLabsLogo.js";
import { GoodReserveLogo } from "../icons/GoodReserveLogo.js";
import { GoodDollarIcon } from "../icons/GoodDollarIcon.js";
import { USDmIcon } from "../icons/USDmIcon.js";
import {
  displaySymbol,
  formatAmountInput,
  formatDisplayAmount,
  minimumReceived,
  sanitizeSlippageInput,
  tokensForDirection,
  type SwapDirection,
} from "../format.js";
import { useGoodReserveQuote, useStandaloneGoodReserveQuote } from "../hooks/useGoodReserveQuote.js";
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
const SLIPPAGE_PANEL_ID = "grk-slippage";
const DEFAULT_SLIPPAGE = 0.5;
const ZERO_BALANCE: ReserveBalance = { raw: 0n, formatted: "0", display: "0" };
const ONE_USDM = "1";

function priceForOneUsdm(
  expectedOut: string | undefined,
  isLoading: boolean,
  error: string | null,
): string {
  if (expectedOut) return `${formatDisplayAmount(expectedOut)} G$ per 1 USDm`;
  if (error && !isLoading) return "—";
  return "…";
}

export type GoodReserveWidgetMode = "swap" | "quote";

export interface GoodReserveWidgetProps {
  /** `swap` connects a wallet and sends the reserve swap. `quote` only shows the price. */
  mode?: GoodReserveWidgetMode;
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
  const unitQuote = useGoodReserveQuote({ amount: ONE_USDM, direction: "buy" });
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

  return {
    mode: "swap",
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
    priceText: priceForOneUsdm(unitQuote.quote?.expectedOut, unitQuote.isLoading, unitQuote.error),
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
    onFlip: () => {
      setAmount("");
      setDirection((current) => (current === "buy" ? "sell" : "buy"));
    },
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

function useQuoteWidgetApi(props: GoodReserveWidgetProps): GoodReserveWidgetApi {
  const { defaultDirection = "buy", showBranding = true, className, style } = props;
  const [direction, setDirection] = useState<SwapDirection>(defaultDirection);
  const [amount, setAmount] = useState(defaultDirection === "buy" ? ONE_USDM : "");
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const quoteState = useStandaloneGoodReserveQuote({ amount, direction });
  const unitQuote = useStandaloneGoodReserveQuote({ amount: ONE_USDM, direction: "buy" });
  const { tokenIn, tokenOut } = tokensForDirection(direction);
  const expected = quoteState.quote?.expectedOut;

  return {
    mode: "quote",
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
    priceText: priceForOneUsdm(unitQuote.quote?.expectedOut, unitQuote.isLoading, unitQuote.error),
    minimumText: expected
      ? `${minimumReceived(expected, slippage) ?? "0"} ${displaySymbol(tokenOut)}`
      : `0 ${displaySymbol(tokenOut)}`,
    balance: ZERO_BALANCE,
    outputBalance: ZERO_BALANCE,
    isQuoteLoading: quoteState.isLoading,
    quoteError: quoteState.error ?? (amount.trim() ? null : unitQuote.error),
    step: "idle",
    swapError: null,
    isBusy: false,
    connected: false,
    wrongChain: false,
    canSwap: false,
    actionLabel: quoteState.isLoading ? "Quoting" : "Enter amount",
    onConnect: () => {},
    onSwitchChain: () => {},
    onMax: () => {},
    onFlip: () => {
      setAmount("");
      setDirection((current) => (current === "buy" ? "sell" : "buy"));
    },
    onSwap: () => {},
  };
}

function TokenFace({ symbol }: { symbol: string }) {
  const Icon = symbol === "GoodDollar" ? GoodDollarIcon : USDmIcon;
  return <Icon className={styles.badge} size={36} />;
}

export function GoodReserveView({ api }: { api: GoodReserveWidgetApi }) {
  const { theme } = useGoodReserveConfig();
  const quoteMode = api.mode === "quote";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState("");
  const customActive = !SLIPPAGE_PRESETS.some((preset) => preset === api.slippage);

  return (
    <section
      className={[styles.root, api.className].filter(Boolean).join(" ")}
      style={{ ...themeToStyle(theme), ...api.style }}
    >
      <div className={styles.body}>
      <header className={styles.header}>
        <h2 className={styles.wordmark}>
          <GoodReserveLogo className={styles.goodreserveLogo} />
        </h2>
        {quoteMode ? null : (
          <button
            type="button"
            className={styles.settingsButton}
            aria-label={`Slippage settings, ${api.slippage}%`}
            aria-expanded={settingsOpen}
            aria-controls={SLIPPAGE_PANEL_ID}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <SlippageIcon />
            <span className={api.slippage === DEFAULT_SLIPPAGE ? undefined : styles.settingsValue}>
              {api.slippage}%
            </span>
          </button>
        )}
      </header>

      {quoteMode ? null : (
      <div className={styles.settingsWrap} data-open={settingsOpen ? "true" : "false"}>
        <div className={styles.settingsClip}>
          <div className={styles.settings} id={SLIPPAGE_PANEL_ID} inert={settingsOpen ? undefined : true}>
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
              <span
                className={styles.custom}
                data-active={customActive ? "true" : "false"}
                data-filled={customSlippage ? "true" : "false"}
              >
                <input
                  inputMode="decimal"
                  aria-label="Custom slippage percent"
                  placeholder="Custom"
                  maxLength={5}
                  value={customSlippage}
                  onChange={(event) => {
                    const next = sanitizeSlippageInput(event.target.value, DEFAULT_SLIPPAGE);
                    setCustomSlippage(next.text);
                    if (next.value !== null) api.setSlippage(next.value);
                  }}
                  onBlur={() => {
                    const next = sanitizeSlippageInput(customSlippage, DEFAULT_SLIPPAGE);
                    if (next.text === "" || next.value === null) {
                      setCustomSlippage("");
                      api.setSlippage(DEFAULT_SLIPPAGE);
                    }
                  }}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

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
              <input
                className={styles.input}
                inputMode="decimal"
                aria-label={`Amount of ${displaySymbol(api.tokenIn)} to ${quoteMode ? "quote" : "swap"}`}
                placeholder="0"
                value={api.amount}
                onChange={(event) => api.setAmount(event.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </div>
        </div>
        {quoteMode ? null : (
          <div className={styles.balanceRow}>
            <p className={styles.balance}>Balance: {api.connected ? api.balance.display : "—"}</p>
            <button type="button" className={styles.max} onClick={api.onMax} disabled={!api.connected}>
              Max
            </button>
          </div>
        )}
      </div>

      <div className={styles.flipWrap}>
        <button type="button" className={styles.flip} aria-label="Flip swap direction" onClick={api.onFlip}>
          <FlipIcon />
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
        {quoteMode ? null : (
          <p className={styles.balance}>Balance: {api.connected ? api.outputBalance.display : "—"}</p>
        )}
      </div>

      <div className={styles.stats}>
        {quoteMode ? null : (
          <div className={styles.stat}>
            <span>Slippage tolerance</span>
            <b>{api.slippage}%</b>
          </div>
        )}
        <div className={styles.stat}>
          <span>Price</span>
          <b>{api.priceText}</b>
        </div>
        {quoteMode ? null : (
          <div className={styles.stat}>
            <span>Minimum received</span>
            <b>{api.minimumText}</b>
          </div>
        )}
      </div>
      {quoteMode && api.quoteError ? <p className={styles.quoteError}>{api.quoteError}</p> : null}

      {quoteMode ? null : (
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
      )}
      </div>
      {api.showBranding ? (
        <footer className={styles.brand}>
          <CnvLabsLogo className={styles.brandLogo} />
          <span>AIOSS</span>
        </footer>
      ) : null}
    </section>
  );
}

function SwapWidget({ renderToast, ...props }: GoodReserveWidgetProps) {
  const api = useGoodReserveWidget(props);
  return (
    <>
      <GoodReserveView api={api} />
      <ReserveToasts
        step={api.step}
        swapError={api.swapError}
        renderToast={renderToast}
        showBranding={api.showBranding}
      />
    </>
  );
}

function QuoteWidget(props: GoodReserveWidgetProps) {
  const api = useQuoteWidgetApi(props);
  return <GoodReserveView api={api} />;
}

export function GoodReserveWidget({ mode = "swap", ...props }: GoodReserveWidgetProps) {
  if (mode === "quote") return <QuoteWidget key="quote" {...props} mode="quote" />;
  return <SwapWidget key="swap" {...props} mode="swap" />;
}

function SwapCustom({
  children,
  renderToast,
  ...props
}: GoodReserveWidgetProps & { children: (api: GoodReserveWidgetApi) => ReactNode }) {
  const api = useGoodReserveWidget(props);
  return (
    <>
      {children(api)}
      <ReserveToasts
        step={api.step}
        swapError={api.swapError}
        renderToast={renderToast}
        showBranding={api.showBranding}
      />
    </>
  );
}

function QuoteCustom({
  children,
  ...props
}: GoodReserveWidgetProps & { children: (api: GoodReserveWidgetApi) => ReactNode }) {
  const api = useQuoteWidgetApi(props);
  return children(api);
}

function CustomWidget({
  mode = "swap",
  ...props
}: GoodReserveWidgetProps & { children: (api: GoodReserveWidgetApi) => ReactNode }) {
  if (mode === "quote") return <QuoteCustom key="quote" {...props} mode="quote" />;
  return <SwapCustom key="swap" {...props} mode="swap" />;
}

function ReserveToasts({
  step,
  swapError,
  renderToast,
  showBranding,
}: {
  step: GoodReserveWidgetApi["step"];
  swapError: string | null;
  renderToast?: (toast: GoodReserveToastPayload) => ReactNode;
  showBranding?: boolean;
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

  return (
    <GoodReserveToast
      item={item}
      onDismiss={dismiss}
      renderToast={renderToast}
      showBranding={showBranding}
    />
  );
}

GoodReserveWidget.Custom = CustomWidget;

function FlipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 2.5v11M5 5.5 8 2.5l3 3M5 10.5 8 13.5l3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlippageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2 4.5h12M2 11.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="6" cy="4.5" r="1.75" fill="currentColor" />
      <circle cx="10" cy="11.5" r="1.75" fill="currentColor" />
    </svg>
  );
}
