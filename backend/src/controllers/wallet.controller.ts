import { Request, Response, NextFunction } from "express";
import { walletRepository } from "../repositories/wallet.repository";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { ApiError } from "../exceptions/ApiError";
import { toPublicWallet } from "../utils/wallet";
import { ok } from "../utils/response";
import { getCashHolding } from "../ledger/ledger.service";

export const walletController = {
  // Identity-only directory (walletId, ownerName, role - never balance),
  // filtered by role and optionally by category. Backs the Supplier
  // dropdown on Create Order: a buyer picks a registered supplier by name
  // instead of typing/knowing their Wallet ID, optionally narrowed to
  // Suppliers selling in a specific category. Safe to be public - no
  // balance or credentials in the response.
  //
  // Category narrowing is derived from actual Product records, not a field
  // on the wallet itself - a seller can carry products across more than one
  // category, so "which category is this seller under" has to be able to
  // be more than one answer at once.
  async listByRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role;
      if (role !== "Buyer" && role !== "Supplier") {
        throw ApiError.badRequest('Query param "role" must be "Buyer" or "Supplier"');
      }
      const category = req.query.category;

      let wallets;
      if (typeof category === "string" && category) {
        const products = await productRepository.findByCategory(category);
        const sellerWalletIds = [...new Set(products.map((product) => product.sellerWalletId))];
        wallets = await walletRepository.findByIds(sellerWalletIds);
      } else {
        wallets = await walletRepository.findByRole(role);
      }

      ok(
        res,
        wallets.map((wallet) => ({ walletId: wallet.walletId, ownerName: wallet.ownerName, role: wallet.role }))
      );
    } catch (err) {
      next(err);
    }
  },

  // Step-up check for the Wallets page: being logged in isn't enough to see
  // balance - you additionally need the account number chosen at
  // registration. Deliberately the same error either way (wrong number or
  // unknown wallet) so this can't be used to enumerate wallet IDs.
  async verifyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const wallet = await walletRepository.verifyAccountNumber(
        req.params.walletId,
        req.body.accountNumber ?? ""
      );
      if (!wallet) {
        throw ApiError.notFound("Invalid wallet ID or account number");
      }

      // Available balance isn't stored - it's read fresh from the ledger
      // every time, so this always reflects the real CashHolding contract
      // on Canton, not a cached number that could drift out of sync.
      const holding = await getCashHolding(wallet.walletId);

      if (wallet.role !== "Buyer") {
        ok(res, { ...toPublicWallet(wallet), availableBalance: holding?.amount ?? 0 });
        return;
      }

      // Held/escrowed amounts are derived from the Buyer's own still-Active
      // orders - order.amount/order.escrow are written atomically alongside
      // the ledger call in order.service.ts's createOrder, so this is a
      // simpler, equally-accurate alternative to re-querying Canton's
      // Escrow contracts for the same numbers.
      const allOrders = await orderRepository.findAll();
      const activeOrders = allOrders.filter(
        (order) => order.buyerWalletId === wallet.walletId && order.status === "Active"
      );
      const heldOrders = activeOrders.map((order) => ({
        orderId: order.id,
        sellerName: order.merchant,
        heldAmount: order.amount - order.escrow,
      }));
      const heldBalance = heldOrders.reduce((sum, entry) => sum + entry.heldAmount, 0);
      const escrowedBalance = activeOrders.reduce((sum, order) => sum + order.escrow, 0);

      ok(res, {
        ...toPublicWallet(wallet),
        availableBalance: holding?.amount ?? 0,
        heldBalance,
        escrowedBalance,
        heldOrders,
      });
    } catch (err) {
      next(err);
    }
  },
};
