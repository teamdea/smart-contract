export type WalletRole = "Buyer" | "Supplier";

// A simulated bank account behind the CBS (Core Banking System) box in the
// architecture diagram. `availableBalance` is spendable/receivable now;
// `heldBalance` is money placed under a lien (step 4 in the diagram: "Request
// Fund Hold for 90% of Amount") - frozen but not yet actually debited.
export interface Wallet {
  walletId: string;
  ownerName: string;
  role: WalletRole;
  availableBalance: number;
  heldBalance: number;
  // A wallet ID is shared freely between counterparties (like a bank
  // account number) so it can't gate access on its own. walletSecret is the
  // credential only the true owner should ever hold; secretRevealed tracks
  // whether the platform has already shown it once (it never shows it
  // again after that - see walletRepository.revealSecretIfNew).
  walletSecret: string;
  secretRevealed: boolean;
}
