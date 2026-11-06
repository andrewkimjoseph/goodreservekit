import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  injectStyle: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "wagmi",
    "viem",
    "viem/chains",
    "@rainbow-me/rainbowkit",
    "@cnvlabskoxyz/celina-sdk",
    "@cnvlabskoxyz/celina-sdk/gooddollar-reserve",
    "@cnvlabskoxyz/celina-sdk/onchain-stats",
  ],
  async onSuccess() {
    for (const file of ["dist/index.js", "dist/index.cjs"]) {
      const source = readFileSync(file, "utf8");
      if (!source.startsWith('"use client"')) {
        writeFileSync(file, `"use client";\n${source}`);
      }
    }
  },
});
