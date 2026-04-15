# Project Context

Last updated: 2026-04-05
Workspace: `/Users/user2/Downloads/USDTBANC-main`

## Overview

This repository is a Vite + React + TypeScript frontend for a crypto-oriented product branded as `USDT BANC`.
The app uses:

- React 18
- React Router 6
- TanStack Query
- Tailwind CSS
- shadcn/ui + Radix UI
- Supabase client auth/data access
- Client-side wallet helpers for EVM and Bitcoin flows

The root `README.md` is still the default Lovable scaffold and does not describe the actual app in detail.

Current workspace state differs from the first snapshot:

- `.env` is now present
- `node_modules/` and `dist/` exist locally
- a safe local demo mode has been added
- Paybis on-ramp support has been introduced with Supabase-backed signing

## Runtime Structure

- Entry point: `src/main.tsx`
- App shell: `src/App.tsx`
- Shared layout/navigation: `src/components/Layout.tsx`

`src/App.tsx` creates a single `QueryClient`, mounts toast/tooltip providers, and uses `BrowserRouter`.

`src/main.tsx` now also checks `isSafeLocalMode` from `src/lib/safeLocalMode.ts`.

Auth gating is global:

- `useAuth()` loads the initial Supabase session
- while auth is loading, the app shows `LoadingScreen`
- unauthenticated users are sent to the `Auth` page component directly
- authenticated users get routed into the main layout

In safe local mode, auth is short-circuited to a mock local user instead of waiting for Supabase.

## Main Routes

Defined in `src/App.tsx`:

- `/` -> `Home`
- `/market` -> `Market`
- `/wallet` -> `Wallet`
- `/profile` -> `Profile`
- `/about` -> `About`
- `/terms` -> `Terms`
- `/privacy` -> `Privacy`
- `*` -> `NotFound`

## Layout Behavior

`src/components/Layout.tsx` provides:

- sidebar navigation for desktop/mobile
- sign-out button via `useAuth`
- floating WhatsApp support entry point
- support form that preloads user profile and last withdrawal data from Supabase

Current behavior also includes safe-local fallbacks for the support flow, using mock profile and transaction data when local demo mode is enabled.

Observed Supabase tables used from the frontend:

- `profiles`
- `transactions`

The support flow builds a WhatsApp URL with prefilled text and opens it in a new tab/window.

## Auth

Primary auth hook: `src/hooks/useAuth.ts`

Behavior:

- fetches initial session through `supabase.auth.getSession()`
- subscribes to `supabase.auth.onAuthStateChange()`
- exposes `user`, `session`, `loading`, `signOut`, and `isAuthenticated`

Supabase client:

- file: `src/integrations/supabase/client.ts`
- URL reads from `VITE_SUPABASE_URL` with a fallback default
- publishable key reads from `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`
- client throws at startup if the publishable key is missing
- auth session persistence uses `localStorage`

Local `.env` currently contains:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Wallet And Crypto Context

The repo contains both UI-only wallet presentation and actual client-side wallet helper logic.

### Wallet page

`src/pages/Wallet.tsx` currently mixes real and mock behavior:

- requires 2FA verification before wallet access if Supabase MFA TOTP factors exist
- displays mostly mock balances and token rows
- fetches token logos/market data from CoinGecko
- contains receive/send tabs and QR display behavior
- uses a demo receive address in safe local mode

This means the wallet screen should not be assumed to be fully wired to on-chain balances.

### EVM wallet hook

`src/hooks/useEvmWallet.ts`:

- supports `ethereum`, `bsc`, and `polygon`
- derives addresses through `ethers`
- stores encrypted wallet payloads locally through the vault helper
- supports local TOTP enrollment via `otplib`
- can send native-chain transactions after passkey unlock + TOTP validation

Chain config lives in:

- `src/lib/chain/types.ts`

RPC providers currently configured:

- Ethereum: `https://cloudflare-eth.com`
- BSC: `https://bsc-dataseed.binance.org`
- Polygon: `https://polygon-rpc.com`

Adapter logic lives in:

- `src/lib/chain/evmAdapter.ts`

### Bitcoin wallet hook

`src/hooks/useBtcWallet.ts`:

- generates/loads mnemonic-based wallet material
- derives a legacy P2PKH address on path `m/44'/0'/0'/0/0`
- reads balance/history from Blockstream public API
- stores encrypted mnemonic in the same local vault pattern

### Vault storage

`src/lib/crypto/vault.ts` implements a client-side encrypted vault:

- storage backend: `localStorage`
- key derivation: PBKDF2 SHA-256, 150000 iterations
- encryption: AES-GCM

Important implication:

- wallet secrets are not server-side custodial in this implementation
- browser local storage is a critical dependency for wallet persistence

## Market Data

`src/hooks/useCoinGecko.ts` fetches token market data from CoinGecko:

- query key: `coingecko-coins`
- 1 minute stale time
- 30 second refetch interval
- symbol-to-id map is hardcoded
- returns mock symbol-keyed data in safe local mode

This hook returns an object keyed by token symbol for UI consumption.

`src/hooks/useCryptoData.ts`:

- returns mock top-market crypto data in safe local mode
- otherwise fetches CoinGecko top market data directly
- also exposes stock index data that is currently synthetic/static rather than API-backed live market data

`src/pages/Market.tsx`:

- reads exchange rates from Supabase table `exchange_rates`
- falls back to mock exchange rates in safe local mode
- combines exchange rates, stock indexes, and crypto market cards in one page

## Transactions

`src/hooks/useTransactions.ts` handles user transaction records through Supabase:

- fetches rows from `transactions`
- filters by current user id
- orders by `timestamp` descending
- subscribes to realtime postgres changes for inserts/updates/deletes
- exposes helper `getLastWithdrawal()`

This hook is an important bridge between wallet/account UI and backend state.

## Safe Local Mode

New helper: `src/lib/safeLocalMode.ts`

Activation conditions:

- running on `localhost`, `127.0.0.1`, or `::1`
- and either query param `safeLocalMode=1` is present or `localStorage.safeLocalMode` is set to `1`

Provided demo fixtures include:

- mock authenticated user
- mock profile
- mock exchange rates
- mock crypto market data
- mock CoinGecko symbol map
- mock transactions

Observed usage points include:

- `src/main.tsx`
- `src/hooks/useAuth.ts`
- `src/hooks/useCryptoData.ts`
- `src/hooks/useCoinGecko.ts`
- `src/pages/Market.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Wallet.tsx`
- `src/components/Layout.tsx`

This mode is effectively a local demo path that reduces dependence on live backend state during localhost development.

## Paybis On-Ramp

New UI components:

- `src/components/PaybisWidget.tsx`
- `src/components/AmericasWidget.tsx`
- `src/components/EurozoneWidget.tsx`

Current Paybis architecture:

- the frontend does not sign Paybis requests directly
- `PaybisWidget.tsx` calls Supabase RPC `create_paybis_widget_url`
- the RPC returns a signed standalone widget URL
- the widget is then embedded in an `iframe` or opened in a new tab

Supabase migration added:

- `supabase/migrations/20260401195000_paybis_settings.sql`

That migration introduces:

- `public.paybis_settings`
- server-side HMAC signing via `public.create_paybis_widget_url(...)`
- `security definer` execution for authenticated users only
- sandbox vs production widget environment selection in the database

Important implication:

- Paybis partner credentials are intended to live in the database layer, not in browser code
- this is a meaningful shift toward server-mediated secret handling compared with the purely client-side wallet code

## Supabase

Repository contains:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`
- multiple SQL migrations under `supabase/migrations/`

The frontend is clearly coupled to a real Supabase project, but the app also contains mocked UI states in some places. Future work should verify, feature by feature, whether behavior is production-backed or presentation-only.

Observed frontend Supabase-backed domains now include:

- auth/session
- profiles
- transactions
- exchange rates
- Paybis widget signing RPC

## Likely Working Assumptions For Future Edits

- This is a frontend-first codebase generated or bootstrapped through Lovable.
- Styling follows Tailwind + shadcn patterns.
- Query/data fetching is expected to stay in hooks.
- Auth state comes from Supabase, not a custom app server.
- Localhost demo/degraded operation is now a first-class development path through safe local mode.
- Some crypto features are real enough to require caution because they touch wallet generation, encryption, and transaction sending.

## High-Risk Areas

- `src/integrations/supabase/client.ts`: hardcoded project identifiers and frontend auth setup
- `src/lib/crypto/vault.ts`: local secret storage and encryption assumptions
- `src/hooks/useEvmWallet.ts`: local 2FA enrollment and send flow
- `src/hooks/useBtcWallet.ts`: public API dependency and key derivation choices
- `src/pages/Wallet.tsx`: mixed mock and real behavior, easy place for product/security confusion
- `src/components/Layout.tsx`: user support flow reads live user data and externalizes it to WhatsApp
- `src/lib/safeLocalMode.ts`: demo-mode branching can hide real integration failures during localhost work
- `supabase/migrations/20260401195000_paybis_settings.sql`: server-side signing path and secret storage model for Paybis
- `src/components/PaybisWidget.tsx`: authenticated RPC dependency and embedded third-party purchase flow

## Gaps / Unknowns

- Authentication UI details were not fully reviewed yet
- `Home`, `Market`, and `Profile` pages were not deeply inspected
- Supabase schema is still only partially inferred from code usage and migration presence
- No local build or runtime verification has been run in this update pass
- This directory is currently not a git repository checkout, so normal git history/status is unavailable here

## Suggested Next Use

Use this file as the baseline repo memory document. If more work continues in this project, update it when:

- routes change
- Supabase tables or auth flow change
- safe local mode behavior changes
- Paybis signing or embedding flow changes
- wallet handling moves from mock to live data
- security-sensitive storage behavior changes
