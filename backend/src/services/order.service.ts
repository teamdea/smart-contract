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
  buyerWalletId: string;
  supplierWalletId: string;
  orderAmount: number;
  escrowPercent?: number;
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
    if (!input.buyerWalletId || !input.supplierWalletId) {
      throw ApiError.badRequest("buyerWalletId and supplierWalletId are required");
    }
    if (!input.orderAmount || input.orderAmount <= 0) {
      throw ApiError.badRequest("orderAmount must be greater than zero");
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
      throw ApiError.badRequest(`Wallet "${input.supplierWalletId}" is not registered as a Supplier`);
    }

    const escrowPercent = input.escrowPercent ?? DEFAULT_ESCROW_PERCENT;
    const escrowAmount = Math.round((input.orderAmount * escrowPercent) / 100);
    const deliverySla = input.deliverySla ?? formatDisplayDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

    const existingOrders = await orderRepository.findAll();
    const sequence = 1001 + existingOrders.length;
    const orderId = generateId("ORD", sequence);
    const escrowId = generateId("ESC", sequence);

    // Diagram step 4/4a: request the 90% fund hold before recording the contract.
    const { holdReferenceId } = await cbsService.requestFundHold({
      orderAmount: input.orderAmount,
      marginAmount: escrowAmount,
      buyerWalletId: input.buyerWalletId,
    });

    // Diagram steps 6/7: record the escrow contract on the Daml/Canton ledger.
    const contractId = await ledgerService.createEscrowContract({
      orderId,
      escrowId,
      holdReferenceId,
      buyerWalletId: input.buyerWalletId,
      supplierWalletId: input.supplierWalletId,
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
      buyer: buyerWallet.ownerName,
      merchant: supplierWallet.ownerName,
      amount: input.orderAmount,
      escrow: escrowAmount,
      status: "Active",
      settlement: "Pending",
      createdOn: formatDisplayDate(new Date()),
      escrowId,
      holdReferenceId,
      deliverySla,
      buyerWalletId: input.buyerWalletId,
      supplierWalletId: input.supplierWalletId,
    };
    await orderRepository.create(order);

    logActivity(`Created Order ${orderId}`);

    return order;
  },
};
