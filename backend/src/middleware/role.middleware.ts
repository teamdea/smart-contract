import { Request, Response, NextFunction } from "express";
import { sessionService } from "../services/session.service";
import { walletRepository } from "../repositories/wallet.repository";
import { WalletRole } from "../models/Wallet";
import { ApiError } from "../exceptions/ApiError";

// Resolves the Authorization: Bearer <token> header to the wallet that's
// actually calling, then checks its role. This is what makes "only
// Logistics can report delivery" and "only Buyers can create orders" real
// server-side enforcement rather than the frontend just hiding a button -
// hiding a button doesn't stop a direct API call.
export function requireRole(role: WalletRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.header("Authorization") ?? "";
      const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
      const walletId = sessionService.resolveToken(token);
      if (!walletId) {
        throw ApiError.unauthorized("Missing or invalid session - please log in again");
      }

      const wallet = await walletRepository.findById(walletId);
      if (!wallet) {
        throw ApiError.unauthorized("Missing or invalid session - please log in again");
      }
      if (wallet.role !== role) {
        throw new ApiError(
          403,
          `This action requires a ${role} account - you're signed in as a ${wallet.role}`
        );
      }

      req.wallet = wallet;
      next();
    } catch (err) {
      next(err);
    }
  };
}
