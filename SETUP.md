# Setup Guide (macOS & Windows 10)

This project has three moving parts you need running locally, in this order:

1. **Daml Sandbox** — runs the escrow smart contract (`daml/`)
2. **Backend** — Node/Express API (`backend/`)
3. **Frontend** — React/Vite app (`frontend/`)

Everything is free and runs entirely on your machine — no cloud account required.

---

## 1. Install prerequisites

### macOS

```bash
brew install node openjdk@17
curl -sSL https://get.daml.com/ | sh
```

Add these to your `~/.zshrc` (the installers print the exact lines — copy them):

```bash
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export PATH="$HOME/.daml/bin:$PATH"
```

Restart your terminal, then verify:

```bash
node --version   # v18+ (any recent LTS is fine)
java -version    # 17.x
daml version     # 2.10.x
```

### Windows 10

1. **Node.js** — install the LTS installer from https://nodejs.org (or `winget install OpenJS.NodeJS.LTS` in PowerShell).
2. **JDK 17** — install Temurin 17 from https://adoptium.net (or `winget install EclipseAdoptium.Temurin.17.JDK`). Daml needs a JDK on PATH.
3. **Daml SDK** — two options, pick whichever is easier:
   - **Recommended:** open **Git Bash** (installed alongside Git for Windows) and run the exact same command as macOS:
     ```bash
     curl -sSL https://get.daml.com/ | sh
     ```
   - **Alternative:** download the Windows installer from the [Daml SDK releases page](https://github.com/digital-asset/daml/releases) (look for `daml-sdk-2.10.4-windows.exe`) and run it.

   Either way, make sure `%USERPROFILE%\.daml\bin` gets added to your PATH (the installer usually does this automatically — open a **new** terminal after installing).

Verify in a new terminal (PowerShell or Git Bash):

```bash
node --version
java -version
daml version
```

If `daml version` doesn't work, close and reopen your terminal — PATH changes only apply to new sessions.

---

## 2. Run the Daml Sandbox (smart contract)

```bash
cd daml
daml start
```

This compiles `Escrow.daml`, starts a local ledger (Sandbox), and exposes the JSON Ledger API at `http://localhost:7575`. Leave this running in its own terminal. First run may take a minute to download build dependencies (needs internet once; fully offline after that).

## 3. Run the backend

In a new terminal:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API runs at `http://localhost:3000/api/v1`. Check `http://localhost:3000/api/v1/health`.

### Optional: seed synthetic demo data

To open the dashboard already populated with sample purchase orders (2 pending, 2 settled, 1 refunded) instead of starting empty:

```bash
cd backend
npm run seed
```

**Run this before `npm run dev` starts the backend** (or restart the backend afterward). The backend keeps its data store in memory and only writes back to `backend/data/db.json` — it doesn't notice the file changing underneath it. Seeding while the backend is already running will look like it worked (the script writes to disk fine), but the next thing the running backend writes will overwrite your seeded data with its stale in-memory copy.

## 4. Run the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

---

## Shortcut: run all three at once

Once you've run `npm install` inside `daml/` (not needed — Daml has no npm deps), `backend/`, and `frontend/` at least once, you can start everything from the repo root in a single terminal:

```bash
npm install   # only needed once, installs the "concurrently" runner
npm run dev
```

This runs the Daml Sandbox, backend, and frontend together with color-coded log prefixes. Still useful to know how to run each individually (above) for debugging.

---

## Notes

- Data (orders/escrows) persists to `backend/data/db.json` — delete that file to reset to a clean demo state.
- The Core Banking System (fund hold / settlement / release) and Logistics Oracle (delivery status) are **simulated inside the backend** (`backend/src/services/cbs.service.ts`, `oracle.service.ts`) — there's no real bank or courier API to integrate with for the hackathon. The escrow contract itself is real (Daml/Canton).
- All scripts use Node's cross-platform `path`/`fs` APIs, not shell-specific syntax, so `npm run dev` behaves the same in zsh, Git Bash, and PowerShell.
- Delivery status can be reported two ways: a human clicking Delivered/Failed on the **Logistics** page (`/logistics`), or `POST /api/v1/oracle/webhook` with header `X-Webhook-Secret` (see `.env.example`) — representing what a real courier/logistics system would call automatically. Both drive the same settlement logic.
- Orders carry synthetic `buyerWalletId`/`supplierWalletId` fields (pre-filled with generated values on Create Order, editable). These are backed by a real (simulated) wallet ledger — see the **Wallets** page (`/wallets`) and `backend/src/services/cbs.service.ts`. Buyer wallets start at ₹5 Cr, supplier wallets start at ₹0. Placing an order moves 10% out of the buyer's available balance into escrow and freezes the other 90% as a held lien; delivery confirmation debits the lien and pays the supplier 100%; a failed delivery unfreezes and refunds the buyer back to exactly their starting balance. An order larger than the buyer's available balance is rejected (400).
- The full wallet ledger (every customer's balance) is a **bank-operator-only** view, gated by `BANK_OPERATOR_SECRET` (see `.env.example`) — no individual buyer or supplier can browse everyone else's balance.
- A wallet ID alone is **not** enough to see that wallet's balance — it's routinely shared with counterparties on an order (like a bank account number), so it can't double as a credential. Every wallet also gets a random PIN (`walletSecret`), revealed exactly once, in the `POST /orders` response, at the moment that wallet is first created: the buyer's own PIN, and (to be relayed out-of-band, e.g. email/phone) the supplier's PIN. The platform never shows either PIN again after that one response, and never includes it in any other API response (including the bank-operator ledger) — `POST /wallets/:walletId/lookup` requires both the ID and the PIN, with the same generic error either way, so it can't be used to enumerate valid wallet IDs. There's no real login system, so this is a credential-gated shared-secret scheme, not proper per-user authentication — a known, disclosed simplification, not a claim that this is production-ready access control.
