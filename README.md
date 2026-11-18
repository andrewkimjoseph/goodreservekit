# GoodReserve

Flat React widget for swapping GoodDollar (G$) and USDm through the GoodDollar reserve on Celo mainnet.

**GoodReserve by CNV Labs KO XYZ.**

The widget quotes and prepares swaps with [`@cnvlabskoxyz/celina-sdk/gooddollar-reserve`](https://github.com/andrewkimjoseph/celina-sdk). Wallet connection uses [RainbowKit](https://rainbowkit.com). The host app owns `WagmiProvider` and `RainbowKitProvider`.

```tsx
import { GoodReserveProvider, GoodReserveWidget, flatTheme } from "@cnvlabskoxyz/goodreservekit";

<GoodReserveProvider attributionTags={["your_app"]} theme={flatTheme()}>
  <GoodReserveWidget defaultDirection="buy" />
</GoodReserveProvider>
```

`defaultDirection="buy"` spends USDm to receive G$. `"sell"` spends G$ to receive USDm.

## Headless hooks

`useGoodReserveQuote`, `usePrepareGoodReserveSwap`, and `useGoodReserveSwap` are exported for custom UI. `GoodReserveWidget.Custom` is a render prop with the same state the built-in widget uses.

## Theme

`flatTheme()` is the default: a white card, 1px borders, a soft shadow, and Celo forest green on the primary button. Override with `mergeTheme(flatTheme(), { colors: { primary: "#ff00aa" } })`. Tokens are CSS variables prefixed `--grk-` on the widget root.

## Demo

```bash
npm install
npm run dev
```

Set `VITE_WALLETCONNECT_PROJECT_ID` in `examples/demo/.env` if you want WalletConnect. Injected wallets work without it.

## Scope

Celo mainnet only. The pair is G$ ↔ USDm only. Slippage is enforced on-chain via `amountOutMin`. There is no transaction-deadline field, because the reserve `swapIn` call does not take one.
