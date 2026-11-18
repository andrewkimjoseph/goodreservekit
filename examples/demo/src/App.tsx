import { GoodReserveProvider, GoodReserveWidget, flatTheme } from "@cnvlabskoxyz/goodreservekit";

const theme = flatTheme();

export function App() {
  return (
    <main className="page">
      <div>
        <div className="intro">
          <h1>Good Reserve</h1>
          <p>G$ ↔ USDm on Celo mainnet.</p>
        </div>
        <GoodReserveProvider attributionTags={["goodreservekit_demo"]} theme={theme}>
          <GoodReserveWidget defaultDirection="buy" />
        </GoodReserveProvider>
      </div>
    </main>
  );
}
