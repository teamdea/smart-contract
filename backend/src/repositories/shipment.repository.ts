import { Shipment } from "../models/Shipment";
import { store } from "./store";

export const shipmentRepository = {
  async findByOrderId(orderId: string): Promise<Shipment | undefined> {
    return store.get("shipments").find((shipment) => shipment.orderId === orderId);
  },

  async upsert(shipment: Shipment): Promise<Shipment> {
    const shipments = store.get("shipments");
    const index = shipments.findIndex((s) => s.orderId === shipment.orderId);
    if (index === -1) {
      shipments.push(shipment);
    } else {
      shipments[index] = shipment;
    }
    store.set("shipments", shipments);
    return shipment;
  },
};
