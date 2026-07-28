import { DeliveryStatus } from "../enums/DeliveryStatus";
import { FulfillmentStatus } from "../enums/FulfillmentStatus";
import { orderRepository } from "../repositories/order.repository";
import { escrowRepository } from "../repositories/escrow.repository";
import { logActivity } from "../repositories/activity.repository";
import { oracleService } from "./oracle.service";
import * as ledgerService from "../ledger/ledger.service";
import { ApiError } from "../exceptions/ApiError";
import { Order } from "../models/Order";
import { EscrowRecord } from "../models/Escrow";

async function requireEscrow(orderId: string): Promise<EscrowRecord> {
  const escrow = await escrowRepository.findByOrderId(orderId);
  if (!escrow) {
    throw ApiError.notFound(`No escrow found for order ${orderId}`);
  }
  return escrow;
}

// Success path: marks the escrow Settled AND takes the remaining 90% from
// the buyer AND releases the 10% margin sitting in the escrow-managed
// account AND pays the supplier the full order amount, atomically, on the
// ledger (Escrow.daml's ConfirmDelivery choice) - there is no separate CBS
// step anymore.
async function settle(
  order: Order,
  escrow: EscrowRecord,
  fulfillmentStatus: FulfillmentStatus
): Promise<Order> {
  // Daml contracts are immutable: exercising a consuming choice archives
  // escrow.contractId and creates a new contract, so the new ID must be
  // persisted or later lookups would point at an archived contract.
  const newContractId = await ledgerService.confirmDelivery(
    escrow.contractId,
    escrow.escrowId,
    order.buyerWalletId,
    order.supplierWalletId
  );

  await escrowRepository.update(escrow.escrowId, {
    contractId: newContractId,
    status: "Settled",
    updatedAt: new Date().toISOString(),
  });

  const updated = await orderRepository.update(order.id, {
    status: "Completed",
    settlement: "Released",
    fulfillmentStatus,
  });

  await logActivity(`Escrow Released for ${order.id}`);
  await logActivity(`Settlement Completed for ${order.id}`);
  return updated as Order;
}

// Failure path: marks the escrow Refunded AND releases the 10% margin
// sitting in the escrow-managed account back to the buyer, atomically, on
// the ledger (FailOrExpireDelivery). Shared by two different callers
// (Logistics reporting a shipment never arrived, and the Buyer verifying a
// delivered product failed) - fulfillmentStatus is passed in so each
// caller can record its own distinct reason for the refund.
async function refund(
  order: Order,
  escrow: EscrowRecord,
  fulfillmentStatus: FulfillmentStatus
): Promise<Order> {
  const newContractId = await ledgerService.failOrExpireDelivery(
    escrow.contractId,
    escrow.escrowId,
    order.buyerWalletId
  );

  await escrowRepository.update(escrow.escrowId, {
    contractId: newContractId,
    status: "Refunded",
    updatedAt: new Date().toISOString(),
  });

  const updated = await orderRepository.update(order.id, {
    status: "Cancelled",
    settlement: "Refunded",
    fulfillmentStatus,
  });

  await logActivity(`Escrow Refunded for ${order.id}`);
  return updated as Order;
}

// Drives the settlement workflow from the sequence diagram's success path
// (steps 9-16: Delivery Confirmed -> Instruct Settlement -> Debit/Credit ->
// Release Escrow Margin -> Payment Settled) and failure path (steps 9b-15b:
// Delivery Failed/Expired -> Release Fund Hold -> Refund Escrow Margin).
export const escrowService = {
  async processDeliveryEvent(orderId: string, deliveryStatus: DeliveryStatus): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw ApiError.notFound(`Order ${orderId} not found`);
    }
    // Logistics can only report a delivery outcome once the Supplier has
    // confirmed the order (shown to Logistics as "In Transit") - real
    // server-side enforcement, not just a hidden button, matching the
    // requireRole pattern used elsewhere in this file.
    if (order.fulfillmentStatus !== "Confirmed") {
      throw ApiError.badRequest(
        `Order ${orderId} is not yet Confirmed by the Supplier (currently ${order.fulfillmentStatus})`
      );
    }
    // Guards against reporting delivery twice on an order that's already
    // been resolved (fulfillmentStatus alone wouldn't catch this - it
    // never advances past "Confirmed" here, only order.status does).
    if (order.status !== "Active") {
      throw ApiError.badRequest(
        `Order ${orderId} has already been resolved (status: ${order.status})`
      );
    }
    const escrow = await requireEscrow(orderId);

    await oracleService.reportDeliveryStatus(orderId, deliveryStatus);

    if (deliveryStatus === "Delivered") {
      // Logistics can only confirm a package physically arrived - not that
      // its contents are what was ordered and in acceptable condition.
      // Nothing moves on the ledger yet; only the Buyer's own
      // processBuyerVerification call below actually settles or refunds.
      const updated = await orderRepository.update(orderId, {
        fulfillmentStatus: "AwaitingBuyerVerification",
      });
      await logActivity(`Delivered - awaiting Buyer verification for ${orderId}`);
      return updated as Order;
    }

    // Failure path: shipment never arrived / was lost in transit - there's
    // nothing for the Buyer to inspect, so this refunds immediately rather
    // than waiting on a verification step.
    return refund(order, escrow, "DeliveryFailed");
  },

  // Only the order's own Buyer can verify it, and only once Logistics has
  // actually reported Delivered - see FulfillmentStatus.ts.
  async processBuyerVerification(
    orderId: string,
    buyerWalletId: string,
    verified: boolean
  ): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw ApiError.notFound(`Order ${orderId} not found`);
    }
    if (order.buyerWalletId !== buyerWalletId) {
      throw new ApiError(403, `Order ${orderId} does not belong to this Buyer account`);
    }
    if (order.fulfillmentStatus !== "AwaitingBuyerVerification") {
      throw ApiError.badRequest(
        `Order ${orderId} is not awaiting Buyer verification (currently ${order.fulfillmentStatus})`
      );
    }
    // Belt-and-suspenders alongside Daml's own contract-archival guard
    // (exercising ConfirmDelivery/FailOrExpireDelivery consumes the Escrow
    // contract, so a second attempt would fail on the ledger anyway) - this
    // just gives a clean rejection instead of a raw ledger error.
    if (order.status !== "Active") {
      throw ApiError.badRequest(
        `Order ${orderId} has already been resolved (status: ${order.status})`
      );
    }
    const escrow = await requireEscrow(orderId);

    return verified
      ? settle(order, escrow, "ProductVerified")
      : refund(order, escrow, "ProductFailed");
  },
};
