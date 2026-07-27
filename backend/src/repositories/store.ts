import { env } from "../config/env";
import { JsonStore } from "../utils/jsonStore";
import { Order } from "../models/Order";
import { EscrowRecord } from "../models/Escrow";
import { Shipment } from "../models/Shipment";
import { Wallet } from "../models/Wallet";

export interface ActivityLogEntry {
  title: string;
  time: string;
}

interface Db extends Record<string, unknown[]> {
  orders: Order[];
  escrows: EscrowRecord[];
  shipments: Shipment[];
  activities: ActivityLogEntry[];
  wallets: Wallet[];
}

export const store = new JsonStore<Db>(env.dataFilePath, {
  orders: [],
  escrows: [],
  shipments: [],
  activities: [],
  wallets: [],
});

export function logActivity(title: string): void {
  const activities = store.get("activities");
  activities.unshift({ title, time: new Date().toISOString() });
  store.set("activities", activities.slice(0, 20));
}
