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

- Data (orders/escrows/wallets) persists to `backend/data/db.json` — delete that file to reset to a clean demo state.
- The Core Banking System (fund hold / settlement / release) and Logistics Oracle (delivery status) are **simulated inside the backend** (`backend/src/services/cbs.service.ts`, `oracle.service.ts`) — there's no real bank or courier API to integrate with for the hackathon. The escrow contract itself is real (Daml/Canton).
- All scripts use Node's cross-platform `path`/`fs` APIs, not shell-specific syntax, so `npm run dev` behaves the same in zsh, Git Bash, and PowerShell.
- Delivery status can be reported two ways: a human clicking Delivered/Failed on the **Logistics** page (only visible to a logged-in **Logistics** account — see below), or `POST /api/v1/oracle/webhook` with header `X-Webhook-Secret` (see `.env.example`) — representing what a real courier/logistics system would call automatically. Both drive the same settlement logic.

### Accounts: register/login, not auto-created

Wallets no longer spring into existence just because an order mentions their ID — they must be registered first, at `/login` ("Register" tab): pick a role, a Wallet ID, a **PIN** (your login credential), and an **Account Number** (a second, independent credential — see below). Buyer wallets start at ₹5 Cr; Supplier and Logistics accounts start at ₹0 (Logistics never holds funds at all).

Three roles, matching the architecture diagram's separate actors:
- **Buyer** — creates purchase orders.
- **Supplier** — receives orders, ships goods. Cannot confirm their own delivery.
- **Logistics** — an independent third party (diagram box 5: "Logistics Oracle Service / Trusted Delivery Tracker"). The *only* role that can report delivery status. This is deliberately separate from Supplier: if the party being paid could also certify that delivery happened, they could just self-attest and get paid regardless of whether anything shipped, which defeats the entire point of the escrow.

- **Login** (Wallet ID + PIN) proves who you are and unlocks the app. It does **not** show your balance.
- **Create Order** is Buyer-only: your own identity comes from your session (read-only); the Supplier field is a dropdown of every registered supplier (by name, not Wallet ID) built from `GET /wallets?role=Supplier` (identity only, no balances). Submitting against an unregistered wallet is rejected with a clear error.
- **Logistics** (opens in a new tab) is Logistics-only — a Buyer or Supplier session sees a blocked message instead of the action buttons.
- **Wallets** (opens in a new tab) requires your **Account Number** again, even though you're already logged in — a step-up check independent of your PIN, and it only ever shows *your own* wallet (the one from your session). This is deliberate: a wallet ID is shared with counterparties on a shared order (like a bank account number), so it can't double as a credential, and being logged in alone shouldn't be enough to see money. Neither the PIN nor the Account Number is ever included in any API response — both only ever get *checked*, never echoed back. Logistics accounts skip this screen entirely since they hold no funds.
- There's no session expiry, password reset, or hashing of PINs/account numbers at rest — this is a credential-gated demo scheme sized for a hackathon, not production-grade authentication.

### Seeded demo logins

`npm run seed` registers 5 buyer/supplier pairs plus 1 Logistics account with simple, memorable credentials so you can log in live during a demo instead of registering from scratch:

| Wallet ID | Role | PIN | Account Number |
|---|---|---|---|
| WALLET-BUYER-ACME01 | Buyer | 111111 | ACC-BUYER-0001 |
| WALLET-SUPPLIER-BLUEOCEAN01 | Supplier | 222222 | ACC-SUPPLIER-0001 |
| WALLET-BUYER-NIMBUS01 | Buyer | 111112 | ACC-BUYER-0002 |
| WALLET-SUPPLIER-CASCADE01 | Supplier | 222212 | ACC-SUPPLIER-0002 |
| WALLET-LOGISTICS-MAIN01 | Logistics | 333333 | ACC-LOGISTICS-0001 |

(See `backend/scripts/seed.ts` for the full list.)


#mock
