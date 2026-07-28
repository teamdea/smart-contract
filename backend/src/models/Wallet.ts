// Buyer and Supplier are financial parties (they hold money). Logistics is
// an independent, non-financial role - the "Logistics Oracle Service
// (Trusted Delivery Tracker)" from the architecture diagram - deliberately
// separate from Supplier so the party being paid is never the same party
// who certifies that delivery happened. A supplier confirming their own
// delivery would be pure self-attestation and would defeat the point of
// the escrow.
export type WalletRole = "Buyer" | "Supplier" | "Logistics";

// Identity and credentials only - this is what's actually stored. A
// wallet's real spendable balance is not stored here: it lives on the
// Canton ledger as a CashHolding contract (see
// ledger/ledger.service.ts's getCashHolding), fetched fresh wherever a
// balance needs to be shown (see wallet.controller.ts's verifyAccount,
// which also derives held/escrowed amounts from the Buyer's own Order
// records for display).
//
// Two separate credentials, for two separate purposes:
// - `pin` logs you into the platform (proves "I am this wallet").
// - `accountNumber` is a second, independent check required specifically to
//   open the Wallets balance page - so a logged-in session alone isn't
//   enough to view money, matching a step-up/second-factor pattern.
// Both are chosen by the user at registration, not system-generated.
export interface Wallet {
  walletId: string;
  ownerName: string;
  role: WalletRole;
  pin: string;
  accountNumber: string;
}
