import crypto from "crypto";
import { Order } from "../models/Order";
import { EscrowRecord } from "../models/Escrow";
import { orderRepository } from "../repositories/order.repository";
import { escrowRepository } from "../repositories/escrow.repository";
import { walletRepository } from "../repositories/wallet.repository";
import { logActivity } from "../repositories/store";
import { cbsService } from "./cbs.service";
import * as ledgerService from "../ledger/ledger.service";
import { formatDisplayDate } from "../utils/date";
import { ApiError } from "../exceptions/ApiError";
import { DEFAULT_ESCROW_PERCENT } from "../config/constants";

export interface CreateOrderInput {
  buyerName: string;
  merchantName: string;
  orderAmount: number;
  escrowPercent?: number;
  deliverySla?: string;
  buyerWalletId?: string;
  supplierWalletId?: string;
}

function generateWalletId(role: "BUYER" | "SUPPLIER"): string {
  return `WALLET-${role}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
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

export interface CreateOrderResult {
  order: Order;
  // Non-null only the first time each wallet is introduced to the system -
  // see walletRepository.revealSecretIfNew. buyerWalletSecret is this
  // buyer's own credential; supplierWalletSecret is meant to be relayed to
  // the actual supplier out-of-band (email/phone) - the platform will never
  // show it again after this one response.
  buyerWalletSecret: string | null;
  supplierWalletSecret: string | null;
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

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!input.buyerName || !input.merchantName) {
      throw ApiError.badRequest("buyerName and merchantName are required");
    }
    if (!input.orderAmount || input.orderAmount <= 0) {
      throw ApiError.badRequest("orderAmount must be greater than zero");
    }

    const escrowPercent = input.escrowPercent ?? DEFAULT_ESCROW_PERCENT;
    const escrowAmount = Math.round((input.orderAmount * escrowPercent) / 100);
    const deliverySla = input.deliverySla ?? formatDisplayDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    const buyerWalletId = input.buyerWalletId || generateWalletId("BUYER");
    const supplierWalletId = input.supplierWalletId || generateWalletId("SUPPLIER");

    // Provision both wallets now (not just the buyer's, and not deferred
    // until settlement) so each one's access PIN can be revealed the
    // moment it's first introduced - never again after this.
    await walletRepository.findOrCreate(buyerWalletId, input.buyerName, "Buyer");
    await walletRepository.findOrCreate(supplierWalletId, input.merchantName, "Supplier");
    const buyerWalletSecret = await walletRepository.revealSecretIfNew(buyerWalletId);
    const supplierWalletSecret = await walletRepository.revealSecretIfNew(supplierWalletId);

    const existingOrders = await orderRepository.findAll();
    const sequence = 1001 + existingOrders.length;
    const orderId = generateId("ORD", sequence);
    const escrowId = generateId("ESC", sequence);

    // Diagram step 4/4a: request the 90% fund hold before recording the contract.
    const { holdReferenceId } = await cbsService.requestFundHold({
      orderAmount: input.orderAmount,
      marginAmount: escrowAmount,
      buyerWalletId,
      buyerName: input.buyerName,
    });

    // Diagram steps 6/7: record the escrow contract on the Daml/Canton ledger.
    const contractId = await ledgerService.createEscrowContract({
      orderId,
      escrowId,
      holdReferenceId,
      buyerWalletId,
      supplierWalletId,
      orderAmount: input.orderAmount,
      marginAmount: escrowAmount,
      deliverySla,
    });

    const escrowRecord: EscrowRecord = {
      escrowId,
      orderId,
      contractId,
      holdReferenceId,
      orderAmount: input.orderAmount,
      marginAmount: escrowAmount,
      status: "Created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await escrowRepository.create(escrowRecord);

    const order: Order = {
      id: orderId,
      buyer: input.buyerName,
      merchant: input.merchantName,
      amount: input.orderAmount,
      escrow: escrowAmount,
      status: "Active",
      settlement: "Pending",
      createdOn: formatDisplayDate(new Date()),
      escrowId,
      holdReferenceId,
      deliverySla,
      buyerWalletId,
      supplierWalletId,
    };
    await orderRepository.create(order);

    logActivity(`Created Order ${orderId}`);

    return { order, buyerWalletSecret, supplierWalletSecret };
  },
};
