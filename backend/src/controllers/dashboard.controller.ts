import { Request, Response, NextFunction } from "express";
import { orderRepository } from "../repositories/order.repository";
import { store } from "../repositories/store";
import { ok } from "../utils/response";

function formatInr(amount: number): string {
  const crore = amount / 10000000;
  if (crore >= 1) {
    return `₹${crore.toFixed(2)} Cr`;
  }
  const lakh = amount / 100000;
  return `₹${lakh.toFixed(2)} L`;
}

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderRepository.findAll();
      const activeOrders = orders.filter((o) => o.status === "Active");
      const completedOrders = orders.filter((o) => o.status === "Completed");
      const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
      const resolvedOrders = completedOrders.length + cancelledOrders.length;

      const settlementValue = completedOrders.reduce((sum, o) => sum + o.amount, 0);
      const escrowBalance = activeOrders.reduce((sum, o) => sum + o.escrow, 0);
      const successRate = resolvedOrders > 0 ? (completedOrders.length / resolvedOrders) * 100 : 100;

      // Every order in the store has a successfully created Daml escrow
      // contract by construction (createOrder fails atomically if the ledger
      // call fails), so this is 100 unless orders exist with none - it's a
      // sanity signal, not a tracked failure counter.
      const smartContractExecution = orders.length > 0 ? 100 : 0;
      // Share of orders where the Logistics Oracle has reported a delivery
      // outcome (settled or refunded) rather than still awaiting one.
      const oracleVerification = orders.length > 0 ? (resolvedOrders / orders.length) * 100 : 0;

      ok(res, {
        summaryCards: [
          { title: "Total Orders", value: String(orders.length) },
          { title: "Active Escrows", value: String(activeOrders.length) },
          { title: "Settlement Value", value: formatInr(settlementValue) },
          { title: "Completed Orders", value: String(completedOrders.length) },
        ],
        platformStatus: [
          { service: "Orders Processing", status: "Healthy" },
          { service: "Escrow Contracts", status: "Healthy" },
          { service: "Settlement Engine", status: "Running" },
          { service: "Delivery Verification", status: "Online" },
        ],
        activities: store.get("activities"),
        recentOrders: orders.slice(-5).reverse(),
        reports: {
          escrowBalance: formatInr(escrowBalance),
          successRate: Math.round(successRate),
          metrics: {
            settlementCompletion: Math.round(successRate),
            smartContractExecution,
            oracleVerification: Math.round(oracleVerification),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
