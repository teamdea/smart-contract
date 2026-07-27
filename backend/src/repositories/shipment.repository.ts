import { Shipment } from "../models/Shipment";
import { getDocument, setDocument } from "./firestore.client";

const COLLECTION = "shipments";

export const shipmentRepository = {
  // orderId is the Firestore document ID - a shipment is 1:1 with an order.
  async findByOrderId(orderId: string): Promise<Shipment | undefined> {
    return getDocument<Shipment>(COLLECTION, orderId);
  },

  async upsert(shipment: Shipment): Promise<Shipment> {
    // Full field replace - creates the document on the first call, fully
    // overwrites it on later ones. Exactly upsert semantics.
    await setDocument(COLLECTION, shipment.orderId, { ...shipment });
    return shipment;
  },
};
