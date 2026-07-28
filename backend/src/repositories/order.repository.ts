import { Order } from "../models/Order";
import { getDocument, runQuery, setDocument, updateDocument } from "./firestore.client";

const COLLECTION = "orders";

export const orderRepository = {
  async findAll(): Promise<Order[]> {
    return runQuery<Order>({
      from: [{ collectionId: COLLECTION }],
      orderBy: [{ field: { fieldPath: "createdOn" }, direction: "ASCENDING" }],
    });
  },

  async findById(id: string): Promise<Order | undefined> {
    return getDocument<Order>(COLLECTION, id);
  },

  // The order's own id is the Firestore document ID - orders are always
  // looked up by id, never listed with an unrelated key.
  async create(order: Order): Promise<Order> {
    await setDocument(COLLECTION, order.id, { ...order });
    return order;
  },

  async update(id: string, patch: Partial<Order>): Promise<Order | undefined> {
    const existing = await this.findById(id);
    if (!existing) {
      return undefined;
    }
    if (Object.keys(patch).length === 0) {
      return existing;
    }

    await updateDocument(COLLECTION, id, { ...patch });
    return { ...existing, ...patch };
  },
};
