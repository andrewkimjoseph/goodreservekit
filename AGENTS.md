# GoodReserveKit

React package for G$ ↔ USDm swaps through the GoodDollar reserve on Celo mainnet. GitHub: `andrewkimjoseph/goodreservekit`. npm name: `@cnvlabskoxyz/goodreservekit`.

This repo is not a Celina submodule. Do not bump a parent pointer for it.

## Workflow

Every committed change lands on `main` through a GitHub issue and a squash-merged pull request. Do not push implementation commits straight to `main`.

1. `gh auth status` must succeed, and `gh repo view andrewkimjoseph/goodreservekit` must work.
2. Search open issues. Reuse one only when it tracks this exact change. Otherwise `gh issue create`.
3. Branch from updated `main`: `<type>/<issue>-<kebab-summary>`.
4. Open a pull request into `main` whose body includes `Fixes #<issue>`.
5. Squash-merge, then `git checkout main && git pull`.

Do not `npm publish` until a maintainer asks. The package version in a release pull request should already be the version that will be published.

## Layout

| Path | Purpose |
|------|---------|
| `packages/goodreservekit` | Published library |
| `examples/demo` | Vite app for theme and swap QA |

Quotes and unsigned swap steps come from `@cnvlabskoxyz/celina-sdk/gooddollar-reserve`. Do not import `createCelinaClient` in this package. The host app supplies wagmi and RainbowKit.
