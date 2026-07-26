// Buyer and Supplier are financial parties (they hold money). Logistics is
// an independent, non-financial role - the "Logistics Oracle Service
// (Trusted Delivery Tracker)" from the architecture diagram - deliberately
// separate from Supplier so the party being paid is never the same party
// who certifies that delivery happened. A supplier confirming their own
// delivery would be pure self-attestation and would defeat the point of
// the escrow.
export type WalletRole = "Buyer" | "Supplier" | "Logistics";

// A simulated bank account behind the CBS (Core Banking System) box in the
// architecture diagram. `availableBalance` is spendable/receivable now;
// `heldBalance` is money placed under a lien (step 4 in the diagram: "Request
// Fund Hold for 90% of Amount") - frozen but not yet actually debited.
// Logistics accounts never move money - both fields stay 0 for that role.
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
  availableBalance: number;
  heldBalance: number;
  pin: string;
  accountNumber: string;
}
