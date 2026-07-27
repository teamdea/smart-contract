import { Request, Response, NextFunction } from "express";
import { escrowRepository } from "../repositories/escrow.repository";
import { ok, fail } from "../utils/response";

export const escrowController = {
  async getByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const escrow = await escrowRepository.findByOrderId(req.params.orderId);
      if (!escrow) {
        fail(res, `No escrow found for order ${req.params.orderId}`, 404);
        return;
      }
      ok(res, escrow);
    } catch (err) {
      next(err);
    }
  },
};
