import { addDocument, runQuery } from "./firestore.client";

export interface ActivityLogEntry {
  title: string;
  time: string;
}

const COLLECTION = "activities";

export async function logActivity(title: string): Promise<void> {
  // No natural primary key for an activity entry, so let Firestore
  // auto-generate the document ID.
  await addDocument(COLLECTION, { title, time: new Date().toISOString() });
}

export async function listRecentActivities(limit = 20): Promise<ActivityLogEntry[]> {
  return runQuery<ActivityLogEntry>({
    from: [{ collectionId: COLLECTION }],
    orderBy: [{ field: { fieldPath: "time" }, direction: "DESCENDING" }],
    limit,
  });
}
