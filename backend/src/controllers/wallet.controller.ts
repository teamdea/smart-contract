import { Request, Response, NextFunction } from "express";
import { walletRepository } from "../repositories/wallet.repository";
import { ApiError } from "../exceptions/ApiError";
import { toPublicWallet } from "../utils/wallet";
import { ok } from "../utils/response";
import { getCashHolding, getHeldAmountForBuyer } from "../ledger/ledger.service";

export const walletController = {
  // Identity-only directory (walletId, ownerName, role - never balance),
  // filtered by role. Backs the Supplier dropdown on Create Order: a buyer
  // picks a registered supplier by name instead of typing/knowing their
  // Wallet ID. Safe to be public - no balance or credentials in the response.
  async listByRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role;
      if (role !== "Buyer" && role !== "Supplier") {
        throw ApiError.badRequest('Query param "role" must be "Buyer" or "Supplier"');
      }
      const wallets = await walletRepository.findByRole(role);
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

      // Balance isn't stored - it's read fresh from the ledger every time,
      // so this always reflects the real CashHolding contracts on Canton,
      // not a cached number that could drift out of sync.
      const [holding, heldBalance] = await Promise.all([
        getCashHolding(wallet.walletId),
        getHeldAmountForBuyer(wallet.walletId),
      ]);

      ok(res, {
        ...toPublicWallet(wallet),
        availableBalance: holding?.amount ?? 0,
        heldBalance,
      });
    } catch (err) {
      next(err);
    }
  },
};
