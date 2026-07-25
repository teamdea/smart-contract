import { Request, Response, NextFunction } from "express";
import { walletRepository } from "../repositories/wallet.repository";
import { Wallet } from "../models/Wallet";
import { ApiError } from "../exceptions/ApiError";
import { env } from "../config/env";
import { ok } from "../utils/response";

// walletSecret must never round-trip in an API response (except the one-time
// reveal in order.service.ts's createOrder result) - not even to a caller
// who just proved they know it, and not even to the bank operator. Otherwise
// anyone who briefly holds the bank-operator secret could harvest every
// customer's PIN for later use, long after that secret is rotated.
function toPublicWallet(wallet: Wallet) {
  const { walletSecret, secretRevealed, ...publicFields } = wallet;
  return publicFields;
}

export const walletController = {
  // The full ledger is a bank-operator-only view - no customer should be
  // able to browse every other customer's balance. Gated by a shared
  // secret since there's no real login system in this build.
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const providedSecret = req.header("X-Bank-Operator-Secret");
      if (providedSecret !== env.bankOperatorSecret) {
        throw new ApiError(401, "Invalid or missing X-Bank-Operator-Secret header");
      }
      const wallets = await walletRepository.findAll();
      ok(res, wallets.map(toPublicWallet));
    } catch (err) {
      next(err);
    }
  },

  // A wallet ID alone isn't proof of ownership - it's routinely shared with
  // counterparties on an order, like a bank account number. Balance lookups
  // require the wallet's secret too. Deliberately the same error either way
  // a real ID with a wrong secret, or a made-up ID - so this can't be used
  // to enumerate which wallet IDs exist.
  async lookupWithSecret(req: Request, res: Response, next: NextFunction) {
    try {
      const wallet = await walletRepository.verifySecret(req.params.walletId, req.body.walletSecret ?? "");
      if (!wallet) {
        throw ApiError.notFound("Invalid wallet ID or PIN");
      }
      ok(res, toPublicWallet(wallet));
    } catch (err) {
      next(err);
    }
  },
};
