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
      // Includes buyerWalletSecret/supplierWalletSecret when either wallet
      // is newly created - see orderService.createOrder.
      const result = await orderService.createOrder(req.body);
      ok(res, result, 201);
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
