import { DeliveryStatus } from "../enums/DeliveryStatus";
import { shipmentRepository } from "../repositories/shipment.repository";
import { ApiError } from "../exceptions/ApiError";

// Simulates the Logistics Oracle box from the architecture diagram. There's
// no real courier/logistics API for the hackathon demo, so delivery status
// is reported by the demo operator (via the Settlement page's "Trigger
// Settlement" action) instead of being polled from a trusted external source.
export const oracleService = {
  async reportDeliveryStatus(orderId: string, status: DeliveryStatus) {
    if (status !== "Delivered" && status !== "Failed") {
      throw ApiError.badRequest(`Unsupported delivery status: ${status}`);
    }
    return shipmentRepository.upsert({
      orderId,
      status,
      updatedAt: new Date().toISOString(),
    });
  },
};
