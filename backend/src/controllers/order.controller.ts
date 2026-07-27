import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { escrowService } from "../services/escrow.service";
import { ok } from "../utils/response";

export const orderController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.listOrders();
      ok(res, orders);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrder(req.params.id);
      ok(res, order);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // requireRole("Buyer") guarantees req.wallet is set and is a Buyer -
      // use it as the buyer, ignoring whatever the request body claims, so
      // a logged-in buyer can't create an order impersonating another one.
      const order = await orderService.createOrder({
        ...req.body,
        buyerWalletId: req.wallet!.walletId,
      });
      ok(res, order, 201);
    } catch (err) {
      next(err);
    }
  },

  async reportDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await escrowService.processDeliveryEvent(req.params.id, req.body.status);
      ok(res, order);
    } catch (err) {
      next(err);
    }
  },
};
