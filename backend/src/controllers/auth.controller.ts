import { Request, Response, NextFunction } from "express";
import { walletRepository } from "../repositories/wallet.repository";
import { sessionService } from "../services/session.service";
import { Wallet } from "../models/Wallet";
import { ApiError } from "../exceptions/ApiError";
import { ok } from "../utils/response";

// Login and registration only ever reveal identity (who you are) plus a
// session token, never balance - otherwise being logged in would be enough
// to see your money, defeating the whole point of the separate
// account-number step-up on the Wallets page. The token is what lets
// protected endpoints (create order, report delivery) verify who's really
// calling, instead of trusting whatever the client claims.
function toIdentity(wallet: Wallet) {
  const token = sessionService.createSession(wallet.walletId);
  return { walletId: wallet.walletId, ownerName: wallet.ownerName, role: wallet.role, token };
}

export const authController = {
  // Sign-up: a wallet only comes into existence when its owner registers it
  // with their own chosen PIN and account number - there's no more
  // auto-provisioning a wallet just because an order mentioned its ID.
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletId, ownerName, role, pin, accountNumber } = req.body;

      if (!walletId || !ownerName || !pin || !accountNumber) {
        throw ApiError.badRequest("walletId, ownerName, pin, and accountNumber are all required");
      }
      if (role !== "Buyer" && role !== "Supplier" && role !== "Logistics") {
        throw ApiError.badRequest('role must be "Buyer", "Supplier", or "Logistics"');
      }

      const result = await walletRepository.register({ walletId, ownerName, role, pin, accountNumber });
      if (result === "ALREADY_EXISTS") {
        throw ApiError.conflict(`Wallet ID "${walletId}" is already registered - try logging in instead`);
      }

      ok(res, toIdentity(result), 201);
    } catch (err) {
      next(err);
    }
  },

  // Login: proves identity with the PIN chosen at registration. Deliberately
  // the same error for an unknown wallet ID or a wrong PIN, so this can't be
  // used to enumerate which wallet IDs are registered.
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletId, pin } = req.body;
      const wallet = await walletRepository.verifyLogin(walletId ?? "", pin ?? "");
      if (!wallet) {
        throw ApiError.unauthorized("Invalid wallet ID or PIN");
      }
      ok(res, toIdentity(wallet));
    } catch (err) {
      next(err);
    }
  },
};
