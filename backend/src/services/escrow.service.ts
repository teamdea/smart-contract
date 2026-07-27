import { DeliveryStatus } from "../enums/DeliveryStatus";
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
    const escrow = await requireEscrow(orderId);

    await oracleService.reportDeliveryStatus(orderId, deliveryStatus);

    if (deliveryStatus === "Delivered") {
      // Daml contracts are immutable: exercising a consuming choice archives
      // escrow.contractId and creates a new contract, so the new ID must be
      // persisted or later lookups would point at an archived contract.
      // This one call both marks the escrow Settled AND takes the
      // remaining 90% from the buyer AND releases the 10% margin sitting
      // in the escrow-managed account AND pays the supplier the full order
      // amount, atomically, on the ledger (Escrow.daml's ConfirmDelivery
      // choice) - there is no separate CBS step anymore.
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

      const updated = await orderRepository.update(orderId, {
        status: "Completed",
        settlement: "Released",
      });

      await logActivity(`Escrow Released for ${orderId}`);
      await logActivity(`Settlement Completed for ${orderId}`);
      return updated as Order;
    }

    // Failure path: delivery failed or the grace period expired. This one
    // call both marks the escrow Refunded AND releases the 10% margin
    // sitting in the escrow-managed account back to the buyer, atomically,
    // on the ledger (FailOrExpireDelivery).
    const newContractId = await ledgerService.failOrExpireDelivery(escrow.contractId, escrow.escrowId, order.buyerWalletId);

    await escrowRepository.update(escrow.escrowId, {
      contractId: newContractId,
      status: "Refunded",
      updatedAt: new Date().toISOString(),
    });

    const updated = await orderRepository.update(orderId, {
      status: "Cancelled",
      settlement: "Refunded",
    });

    await logActivity(`Escrow Refunded for ${orderId}`);
    return updated as Order;
  },
};
