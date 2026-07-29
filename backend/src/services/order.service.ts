import crypto from "crypto";
import { Order } from "../models/Order";
import { EscrowRecord } from "../models/Escrow";
import { orderRepository } from "../repositories/order.repository";
import { escrowRepository } from "../repositories/escrow.repository";
import { walletRepository } from "../repositories/wallet.repository";
import { productRepository } from "../repositories/product.repository";
import { logActivity } from "../repositories/activity.repository";
import * as ledgerService from "../ledger/ledger.service";
import { formatDisplayDate } from "../utils/date";
import { ApiError } from "../exceptions/ApiError";

export interface CreateOrderInput {
  buyerWalletId: string;
  supplierWalletId: string;
  productId: string;
  deliverySla?: string;
}

// A plain incrementing counter would collide with the Daml escrow contract
// key (operator, escrowId) if the local JSON store is ever reset while the
// ledger still holds earlier orders (or the ledger's own smoke-test fixture
// from Escrow.daml's init-script), since DUPLICATE_CONTRACT_KEY is a hard
// ledger error. A short random suffix keeps IDs human-readable while making
// collisions practically impossible.
function generateId(prefix: string, sequence: number): string {
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${prefix}-${sequence}-${suffix}`;
}

function generateHoldReference(): string {
  return `HOLD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export const orderService = {
  async listOrders(): Promise<Order[]> {
    return orderRepository.findAll();
  },

  async getOrder(id: string): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound(`Order ${id} not found`);
    }
    return order;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.buyerWalletId || !input.supplierWalletId || !input.productId) {
      throw ApiError.badRequest("buyerWalletId, supplierWalletId, and productId are required");
    }

    // Wallets must already be registered (see auth.controller.ts) - you
    // can't pay an account that doesn't exist yet.
    const buyerWallet = await walletRepository.findById(input.buyerWalletId);
    if (!buyerWallet) {
      throw ApiError.badRequest(`Buyer wallet "${input.buyerWalletId}" is not registered`);
    }
    if (buyerWallet.role !== "Buyer") {
      throw ApiError.badRequest(`Wallet "${input.buyerWalletId}" is not registered as a Buyer`);
    }
    const supplierWallet = await walletRepository.findById(input.supplierWalletId);
    if (!supplierWallet) {
      throw ApiError.badRequest(`Supplier wallet "${input.supplierWalletId}" is not registered`);
    }
    if (supplierWallet.role !== "Supplier") {
      throw ApiError.badRequest(
        `Wallet "${input.supplierWalletId}" is not registered as a Supplier`
      );
    }

    // The order amount and escrow margin are never taken from the request
    // body - they're always derived from the product the Supplier itself
    // defined, so a tampered request can't order a Mercedes at a Toyota's
    // margin. See product.service.ts's addProduct.
    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw ApiError.badRequest(`Product "${input.productId}" not found`);
    }
    if (product.sellerWalletId !== input.supplierWalletId) {
      throw ApiError.badRequest(
        `Product "${input.productId}" does not belong to supplier "${input.supplierWalletId}"`
      );
    }
    const orderAmount = product.price;
    const escrowAmount = Math.round((product.price * product.escrowMarginPercent) / 100);
    const deliverySla =
      input.deliverySla ?? formatDisplayDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

    const existingOrders = await orderRepository.findAll();
    const sequence = 1001 + existingOrders.length;
    const orderId = generateId("ORD", sequence);
    const escrowId = generateId("ESC", sequence);

    const holdReferenceId = generateHoldReference();

    // No ledger call here anymore, and deliberately so: nothing is held or
    // escrowed at order-creation time. The buyer's funds aren't touched
    // until the Supplier actually agrees to fulfill the order - see
    // confirmOrder() below, which is now where FundEscrow runs. status
    // "Pending" reflects that this order isn't backed by a real escrow yet.
    const order: Order = {
      id: orderId,
      buyer: buyerWallet.ownerName,
      merchant: supplierWallet.ownerName,
      amount: orderAmount,
      escrow: escrowAmount,
      status: "Pending",
      settlement: "Pending",
      createdOn: formatDisplayDate(new Date()),
      escrowId,
      holdReferenceId,
      deliverySla,
      buyerWalletId: input.buyerWalletId,
      supplierWalletId: input.supplierWalletId,
      fulfillmentStatus: "AwaitingConfirmation",
    };
    await orderRepository.create(order);

    await logActivity(`Created Order ${orderId}`);

    return order;
  },

  // Supplier acknowledges they've received the order - and this is now the
  // moment the buyer's funds actually get touched. Only the order's own
  // supplier can do this - a different registered Supplier account isn't
  // allowed to confirm someone else's order. This is also what hands the
  // order to Logistics: once Confirmed, it shows as "In Transit" there and
  // becomes eligible for a delivery outcome (see escrow.service.ts's guard).
  async confirmOrder(orderId: string, supplierWalletId: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (order.supplierWalletId !== supplierWalletId) {
      throw new ApiError(403, `Order ${orderId} does not belong to this Supplier account`);
    }
    if (order.fulfillmentStatus !== "AwaitingConfirmation") {
      throw ApiError.badRequest(`Order ${orderId} is already ${order.fulfillmentStatus}`);
    }

    // Diagram steps 4/4a/6/7: debit the buyer's real ledger-held balance and
    // record the escrow contract, as one atomic Daml transaction
    // (Escrow.daml's FundEscrow choice) - deferred to here from order
    // creation, so a buyer's money is only ever held once a Supplier has
    // actually agreed to fulfill the order. If the buyer can no longer
    // afford it by the time the Supplier confirms, this fails cleanly with
    // a ledger error rather than silently having held funds since creation.
    const contractId = await ledgerService.fundEscrow({
      buyerWalletId: order.buyerWalletId,
      orderId: order.id,
      escrowId: order.escrowId,
      holdReferenceId: order.holdReferenceId,
      supplierWalletId: order.supplierWalletId,
      orderAmount: order.amount,
      marginAmount: order.escrow,
      deliverySla: order.deliverySla,
    });

    const escrowRecord: EscrowRecord = {
      escrowId: order.escrowId,
      orderId: order.id,
      contractId,
      holdReferenceId: order.holdReferenceId,
      orderAmount: order.amount,
      marginAmount: order.escrow,
      status: "Created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await escrowRepository.create(escrowRecord);

    const updated = await orderRepository.update(orderId, {
      status: "Active",
      fulfillmentStatus: "Confirmed",
    });
    await logActivity(`Escrow Funded and Order Confirmed by Supplier for ${orderId}`);
    return updated as Order;
  },
};
