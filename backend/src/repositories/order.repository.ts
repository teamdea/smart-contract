import { Order } from "../models/Order";
import { store } from "./store";

export const orderRepository = {
  async findAll(): Promise<Order[]> {
    return store.get("orders");
  },

  async findById(id: string): Promise<Order | undefined> {
    return store.get("orders").find((order) => order.id === id);
  },

  async create(order: Order): Promise<Order> {
    const orders = store.get("orders");
    orders.push(order);
    store.set("orders", orders);
    return order;
  },

  async update(id: string, patch: Partial<Order>): Promise<Order | undefined> {
    const orders = store.get("orders");
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) {
      return undefined;
    }
    orders[index] = { ...orders[index], ...patch };
    store.set("orders", orders);
    return orders[index];
  },
};
