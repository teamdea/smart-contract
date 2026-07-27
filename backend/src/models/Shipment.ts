import { DeliveryStatus } from "../enums/DeliveryStatus";

export interface Shipment {
  orderId: string;
  status: DeliveryStatus;
  updatedAt: string;
}
