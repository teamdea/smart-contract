import dotenv from "dotenv";
dotenv.config();

import { walletRepository } from "../src/repositories/wallet.repository";
import { orderService } from "../src/services/order.service";
import { escrowService } from "../src/services/escrow.service";

// Synthetic purchase orders for demoing the dashboard without having to
// register accounts and type test data in live. Requires the Daml Sandbox
// to already be running (`daml start` in ../daml) since order creation
// writes a real escrow contract to the ledger, not just the local JSON
// store. Wallets must be registered before an order can reference them -
// this script does that registration step itself, with simple, memorable
// PINs/account numbers so you can also log in as any of these live during
// a demo.
const SEED_WALLETS = [
  { walletId: "WALLET-BUYER-ACME01", ownerName: "Acme Steel Co", role: "Buyer" as const, pin: "111111", accountNumber: "ACC-BUYER-0001" },
  { walletId: "WALLET-SUPPLIER-BLUEOCEAN01", ownerName: "BlueOcean Freight", role: "Supplier" as const, pin: "222222", accountNumber: "ACC-SUPPLIER-0001" },
  { walletId: "WALLET-BUYER-NIMBUS01", ownerName: "Nimbus Retail", role: "Buyer" as const, pin: "111112", accountNumber: "ACC-BUYER-0002" },
  { walletId: "WALLET-SUPPLIER-CASCADE01", ownerName: "Cascade Parts", role: "Supplier" as const, pin: "222212", accountNumber: "ACC-SUPPLIER-0002" },
  { walletId: "WALLET-BUYER-ORION01", ownerName: "Orion Textiles", role: "Buyer" as const, pin: "111113", accountNumber: "ACC-BUYER-0003" },
  { walletId: "WALLET-SUPPLIER-MERIDIAN01", ownerName: "Meridian Shipping", role: "Supplier" as const, pin: "222213", accountNumber: "ACC-SUPPLIER-0003" },
  { walletId: "WALLET-BUYER-VERTEX01", ownerName: "Vertex Components", role: "Buyer" as const, pin: "111114", accountNumber: "ACC-BUYER-0004" },
  { walletId: "WALLET-SUPPLIER-HARBOR01", ownerName: "Harbor Logistics", role: "Supplier" as const, pin: "222214", accountNumber: "ACC-SUPPLIER-0004" },
  { walletId: "WALLET-BUYER-FALCON01", ownerName: "Falcon Traders", role: "Buyer" as const, pin: "111115", accountNumber: "ACC-BUYER-0005" },
  { walletId: "WALLET-SUPPLIER-SUMMIT01", ownerName: "Summit Carriers", role: "Supplier" as const, pin: "222215", accountNumber: "ACC-SUPPLIER-0005" },
  // Independent delivery-status verifier (architecture diagram box 5:
  // "Logistics Oracle Service / Trusted Delivery Tracker") - deliberately
  // not a Buyer or Supplier, since the party being paid should never be
  // the one certifying that delivery happened.
  { walletId: "WALLET-LOGISTICS-MAIN01", ownerName: "TrustTrack Logistics", role: "Logistics" as const, pin: "333333", accountNumber: "ACC-LOGISTICS-0001" },
];

const SEED_ORDERS = [
  { buyerWalletId: "WALLET-BUYER-ACME01", supplierWalletId: "WALLET-SUPPLIER-BLUEOCEAN01", orderAmount: 1200000, escrowPercent: 10, outcome: "pending" as const },
  { buyerWalletId: "WALLET-BUYER-NIMBUS01", supplierWalletId: "WALLET-SUPPLIER-CASCADE01", orderAmount: 850000, escrowPercent: 10, outcome: "pending" as const },
  { buyerWalletId: "WALLET-BUYER-ORION01", supplierWalletId: "WALLET-SUPPLIER-MERIDIAN01", orderAmount: 3000000, escrowPercent: 10, outcome: "delivered" as const },
  { buyerWalletId: "WALLET-BUYER-VERTEX01", supplierWalletId: "WALLET-SUPPLIER-HARBOR01", orderAmount: 450000, escrowPercent: 15, outcome: "delivered" as const },
  { buyerWalletId: "WALLET-BUYER-FALCON01", supplierWalletId: "WALLET-SUPPLIER-SUMMIT01", orderAmount: 675000, escrowPercent: 10, outcome: "failed" as const },
];

async function seed() {
  console.log(`Registering ${SEED_WALLETS.length} synthetic wallets...`);
  for (const w of SEED_WALLETS) {
    const result = await walletRepository.register(w);
    if (result === "ALREADY_EXISTS") {
      console.log(`  ${w.walletId} already registered, skipping`);
    } else {
      console.log(`  ${w.walletId} (${w.ownerName}, ${w.role}) - PIN: ${w.pin}, Account #: ${w.accountNumber}`);
    }
  }

  console.log(`\nSeeding ${SEED_ORDERS.length} synthetic purchase orders...`);
  for (const seedOrder of SEED_ORDERS) {
    const { outcome, ...input } = seedOrder;
    const order = await orderService.createOrder(input);
    console.log(`  created ${order.id} (${order.buyer} -> ${order.merchant})`);

    if (outcome === "delivered") {
      await escrowService.processDeliveryEvent(order.id, "Delivered");
      console.log(`    -> marked Delivered (settled)`);
    } else if (outcome === "failed") {
      await escrowService.processDeliveryEvent(order.id, "Failed");
      console.log(`    -> marked Failed (refunded)`);
    }
  }

  console.log("\nDone. Log in as any seeded wallet above (Wallet ID + PIN) to demo live.");
}

seed().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  console.error("Is the Daml Sandbox running? (`daml start` in ../daml)");
  process.exit(1);
});
