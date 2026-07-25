import dotenv from "dotenv";
dotenv.config();

import { orderService } from "../src/services/order.service";
import { escrowService } from "../src/services/escrow.service";

// Synthetic purchase orders for demoing the dashboard without having to
// type test data in live. Requires the Daml Sandbox to already be running
// (`daml start` in ../daml) since order creation writes a real escrow
// contract to the ledger, not just the local JSON store.
const SEED_ORDERS = [
  {
    buyerName: "Acme Steel Co",
    merchantName: "BlueOcean Freight",
    orderAmount: 1200000,
    escrowPercent: 10,
    buyerWalletId: "WALLET-BUYER-ACME01",
    supplierWalletId: "WALLET-SUPPLIER-BLUEOCEAN01",
    outcome: "pending" as const,
  },
  {
    buyerName: "Nimbus Retail",
    merchantName: "Cascade Parts",
    orderAmount: 850000,
    escrowPercent: 10,
    buyerWalletId: "WALLET-BUYER-NIMBUS01",
    supplierWalletId: "WALLET-SUPPLIER-CASCADE01",
    outcome: "pending" as const,
  },
  {
    buyerName: "Orion Textiles",
    merchantName: "Meridian Shipping",
    orderAmount: 3000000,
    escrowPercent: 10,
    buyerWalletId: "WALLET-BUYER-ORION01",
    supplierWalletId: "WALLET-SUPPLIER-MERIDIAN01",
    outcome: "delivered" as const,
  },
  {
    buyerName: "Vertex Components",
    merchantName: "Harbor Logistics",
    orderAmount: 450000,
    escrowPercent: 15,
    buyerWalletId: "WALLET-BUYER-VERTEX01",
    supplierWalletId: "WALLET-SUPPLIER-HARBOR01",
    outcome: "delivered" as const,
  },
  {
    buyerName: "Falcon Traders",
    merchantName: "Summit Carriers",
    orderAmount: 675000,
    escrowPercent: 10,
    buyerWalletId: "WALLET-BUYER-FALCON01",
    supplierWalletId: "WALLET-SUPPLIER-SUMMIT01",
    outcome: "failed" as const,
  },
];

async function seed() {
  console.log(`Seeding ${SEED_ORDERS.length} synthetic purchase orders...`);

  for (const seedOrder of SEED_ORDERS) {
    const { outcome, ...input } = seedOrder;
    const { order, buyerWalletSecret, supplierWalletSecret } = await orderService.createOrder(input);
    console.log(`  created ${order.id} (${input.buyerName} -> ${input.merchantName})`);
    if (buyerWalletSecret) console.log(`    buyer wallet PIN: ${buyerWalletSecret}`);
    if (supplierWalletSecret) console.log(`    supplier wallet PIN: ${supplierWalletSecret}`);

    if (outcome === "delivered") {
      await escrowService.processDeliveryEvent(order.id, "Delivered");
      console.log(`    -> marked Delivered (settled)`);
    } else if (outcome === "failed") {
      await escrowService.processDeliveryEvent(order.id, "Failed");
      console.log(`    -> marked Failed (refunded)`);
    }
  }

  console.log("Done. Open the dashboard to see the seeded data.");
}

seed().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  console.error("Is the Daml Sandbox running? (`daml start` in ../daml)");
  process.exit(1);
});
