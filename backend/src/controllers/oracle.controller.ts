import { Request, Response, NextFunction } from "express";
import { shipmentRepository } from "../repositories/shipment.repository";
import { escrowService } from "../services/escrow.service";
import { env } from "../config/env";
import { ApiError } from "../exceptions/ApiError";
import { ok } from "../utils/response";

export const oracleController = {
  async getShipmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const shipment = await shipmentRepository.findByOrderId(req.params.orderId);
      ok(res, shipment ?? { orderId: req.params.orderId, status: "Pending" });
    } catch (err) {
      next(err);
    }
  },

  // What a real courier/logistics system would call automatically on
  // delivery, as an API distinct from the merchant's manual "Mark Delivered"
  // button on the Logistics page (POST /orders/:id/delivery) - same
  // underlying business logic, but gated by a shared secret since it
  // represents an external system, not a signed-in dashboard user.
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const providedSecret = req.header("X-Webhook-Secret");
      if (providedSecret !== env.logisticsWebhookSecret) {
        throw new ApiError(401, "Invalid or missing X-Webhook-Secret header");
      }

      const { orderId, status } = req.body;
      if (!orderId || (status !== "Delivered" && status !== "Failed")) {
        throw ApiError.badRequest('Body must be { "orderId": string, "status": "Delivered" | "Failed" }');
      }

      const order = await escrowService.processDeliveryEvent(orderId, status);
      ok(res, order);
    } catch (err) {
      next(err);
    }
  },
};
