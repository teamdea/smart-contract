import { EscrowRecord } from "../models/Escrow";
import { store } from "./store";

export const escrowRepository = {
  async findAll(): Promise<EscrowRecord[]> {
    return store.get("escrows");
  },

  async findByOrderId(orderId: string): Promise<EscrowRecord | undefined> {
    return store.get("escrows").find((escrow) => escrow.orderId === orderId);
  },

  async create(escrow: EscrowRecord): Promise<EscrowRecord> {
    const escrows = store.get("escrows");
    escrows.push(escrow);
    store.set("escrows", escrows);
    return escrow;
  },

  async update(escrowId: string, patch: Partial<EscrowRecord>): Promise<EscrowRecord | undefined> {
    const escrows = store.get("escrows");
    const index = escrows.findIndex((escrow) => escrow.escrowId === escrowId);
    if (index === -1) {
      return undefined;
    }
    escrows[index] = { ...escrows[index], ...patch };
    store.set("escrows", escrows);
    return escrows[index];
  },
};
