import { EscrowRecord } from "../models/Escrow";
import {
  getDocument,
  listDocuments,
  runQuery,
  setDocument,
  updateDocument,
  whereEquals,
} from "./firestore.client";

const COLLECTION = "escrows";

export const escrowRepository = {
  async findAll(): Promise<EscrowRecord[]> {
    return listDocuments<EscrowRecord>(COLLECTION);
  },

  // escrowId is the Firestore document ID, but lookups here come in by
  // orderId (1:1 with an order) - a query, not a direct get.
  async findByOrderId(orderId: string): Promise<EscrowRecord | undefined> {
    const rows = await runQuery<EscrowRecord>({
      from: [{ collectionId: COLLECTION }],
      where: whereEquals("orderId", orderId),
    });
    return rows[0];
  },

  async create(escrow: EscrowRecord): Promise<EscrowRecord> {
    await setDocument(COLLECTION, escrow.escrowId, { ...escrow });
    return escrow;
  },

  async update(escrowId: string, patch: Partial<EscrowRecord>): Promise<EscrowRecord | undefined> {
    const existing = await getDocument<EscrowRecord>(COLLECTION, escrowId);
    if (!existing) {
      return undefined;
    }
    if (Object.keys(patch).length === 0) return existing;

    await updateDocument(COLLECTION, escrowId, { ...patch });

    return { ...existing, ...patch };
  },
};
