import { DeliveryStatus } from "../enums/DeliveryStatus";
import { orderRepository } from "../repositories/order.repository";
import { escrowRepository } from "../repositories/escrow.repository";
import { logActivity } from "../repositories/store";
import { oracleService } from "./oracle.service";
import { cbsService } from "./cbs.service";
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
    const escrow = await requireEscrow(orderId);

    await oracleService.reportDeliveryStatus(orderId, deliveryStatus);

    if (deliveryStatus === "Delivered") {
      // Daml contracts are immutable: exercising a consuming choice archives
      // escrow.contractId and creates a new contract, so the new ID must be
      // persisted or later lookups would point at an archived contract.
      const newContractId = await ledgerService.confirmDelivery(escrow.contractId);
      await cbsService.settle({
        holdReferenceId: escrow.holdReferenceId,
        heldAmount: order.amount - order.escrow,
        marginAmount: order.escrow,
        buyerWalletId: order.buyerWalletId,
        supplierWalletId: order.supplierWalletId,
      });

      await escrowRepository.update(escrow.escrowId, {
        contractId: newContractId,
        status: "Settled",
        updatedAt: new Date().toISOString(),
      });

      const updated = await orderRepository.update(orderId, {
        status: "Completed",
        settlement: "Released",
      });

      logActivity(`Escrow Released for ${orderId}`);
      logActivity(`Settlement Completed for ${orderId}`);
      return updated as Order;
    }

    // Failure path: delivery failed or the grace period expired.
    const newContractId = await ledgerService.failOrExpireDelivery(escrow.contractId);
    await cbsService.releaseHold({
      holdReferenceId: escrow.holdReferenceId,
      heldAmount: order.amount - order.escrow,
      marginAmount: order.escrow,
      buyerWalletId: order.buyerWalletId,
    });

    await escrowRepository.update(escrow.escrowId, {
      contractId: newContractId,
      status: "Refunded",
      updatedAt: new Date().toISOString(),
    });

    const updated = await orderRepository.update(orderId, {
      status: "Cancelled",
      settlement: "Refunded",
    });

    logActivity(`Escrow Refunded for ${orderId}`);
    return updated as Order;
  },
};
