import { GoodReserveProvider, GoodReserveWidget, brutalistTheme } from "@cnvlabskoxyz/goodreservekit";

const theme = brutalistTheme();

export function App() {
  return (
    <main className="page">
      <div>
        <div className="intro">
          <h1>GOOD RESERVE</h1>
          <p>G$ ↔ USDm on Celo mainnet.</p>
        </div>
        <GoodReserveProvider attributionTags={["goodreservekit_demo"]} theme={theme}>
          <GoodReserveWidget defaultDirection="buy" />
        </GoodReserveProvider>
      </div>
    </main>
  );
}
