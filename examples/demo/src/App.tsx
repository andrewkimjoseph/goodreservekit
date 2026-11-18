import { useState } from "react";
import {
  GoodReserveProvider,
  GoodReserveWidget,
  flatTheme,
  type GoodReserveWidgetMode,
} from "@cnvlabskoxyz/goodreservekit";

const theme = flatTheme();

export function App() {
  const [mode, setMode] = useState<GoodReserveWidgetMode>("swap");
  return (
    <main className="page">
      <div>
        <div className="intro">
          <h1>Good Reserve</h1>
          <p>G$ ↔ USDm on Celo mainnet.</p>
        </div>
        <div className="modes" role="group" aria-label="Widget mode">
          <button type="button" aria-pressed={mode === "swap"} onClick={() => setMode("swap")}>
            Swap
          </button>
          <button type="button" aria-pressed={mode === "quote"} onClick={() => setMode("quote")}>
            Quote
          </button>
        </div>
        <GoodReserveProvider attributionTags={["goodreservekit_demo"]} theme={theme}>
          <GoodReserveWidget mode={mode} defaultDirection="buy" />
        </GoodReserveProvider>
      </div>
    </main>
  );
}
