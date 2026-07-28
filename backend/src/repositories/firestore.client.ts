import { execFileSync } from "child_process";
import { env } from "../config/env";
import { DataStoreError } from "../exceptions/DataStoreError";

let cachedToken: { value: string; expiresAt: number } | null = null;

// Reuses the developer's own `gcloud auth login` session instead of a
// service account key - this workshop GCP account can't create service
// accounts, and `gcloud auth application-default login` is blocked by
// account policy. `gcloud auth print-access-token` still works against the
// plain login session, so that's what every Firestore call authenticates with.
function getAccessToken(): string {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value;
  }

  let output: string;
  try {
    output = execFileSync("gcloud", ["auth", "print-access-token"], {
      encoding: "utf-8",
      shell: process.platform === "win32",
    });
  } catch (err) {
    throw new DataStoreError(
      `Could not run "gcloud auth print-access-token". Run "gcloud auth login" once on this machine. (${(err as Error).message})`
    );
  }

  const value = output.trim();
  // Tokens last ~1 hour; refresh a little early to stay safe.
  cachedToken = { value, expiresAt: now + 50 * 60 * 1000 };
  return value;
}

const DOCUMENTS_URL = `https://firestore.googleapis.com/v1/projects/${env.gcpProjectId}/databases/${env.firestoreDatabaseId}/documents`;

type FsValue = string | number | boolean | null;
type FsRow = Record<string, FsValue>;

async function request(path: string, method: string, body?: unknown): Promise<any> {
  const token = getAccessToken();
  const response = await fetch(`${DOCUMENTS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 404) {
    return null;
  }

  const json = await response.json();
  if (!response.ok) {
    throw new DataStoreError(JSON.stringify(json.error ?? json));
  }
  return json;
}

// Firestore's REST API wraps every field value in a type tag, e.g.
// {"amount": {"doubleValue": 1200000}} instead of {"amount": 1200000}.
function toFirestoreValue(value: FsValue): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: value };
}

function toFirestoreFields(record: FsRow): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

function fromFirestoreFields<T>(fields: Record<string, any> | undefined): T {
  const record: FsRow = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if ("integerValue" in value) record[key] = Number(value.integerValue);
    else if ("doubleValue" in value) record[key] = value.doubleValue;
    else if ("booleanValue" in value) record[key] = value.booleanValue;
    else if ("nullValue" in value) record[key] = null;
    else record[key] = value.stringValue ?? null;
  }
  return record as T;
}

export async function getDocument<T = FsRow>(
  collection: string,
  id: string
): Promise<T | undefined> {
  const json = await request(`/${collection}/${encodeURIComponent(id)}`, "GET");
  if (!json) return undefined;
  return fromFirestoreFields<T>(json.fields);
}

export async function listDocuments<T = FsRow>(collection: string): Promise<T[]> {
  const json = await request(`/${collection}?pageSize=1000`, "GET");
  const documents = json?.documents ?? [];
  return documents.map((doc: any) => fromFirestoreFields<T>(doc.fields));
}

// Full field replace, no update mask - creates the document if it doesn't
// exist yet, or overwrites it entirely if it does. Used for create() and
// upsert()-style repository methods.
export async function setDocument(collection: string, id: string, record: FsRow): Promise<void> {
  await request(`/${collection}/${encodeURIComponent(id)}`, "PATCH", {
    fields: toFirestoreFields(record),
  });
}

// Partial field replace via an explicit update mask - only the given keys
// are touched, every other existing field on the document is left alone.
export async function updateDocument(collection: string, id: string, patch: FsRow): Promise<void> {
  const mask = Object.keys(patch)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  await request(`/${collection}/${encodeURIComponent(id)}?${mask}`, "PATCH", {
    fields: toFirestoreFields(patch),
  });
}

// Lets Firestore auto-generate the document ID - used for the activity log,
// which has no natural primary key of its own.
export async function addDocument(collection: string, record: FsRow): Promise<string> {
  const json = await request(`/${collection}`, "POST", { fields: toFirestoreFields(record) });
  return (json.name as string).split("/").pop()!;
}

interface StructuredQuery {
  from: { collectionId: string }[];
  where?: {
    fieldFilter: {
      field: { fieldPath: string };
      op: "EQUAL";
      value: Record<string, unknown>;
    };
  };
  orderBy?: { field: { fieldPath: string }; direction: "ASCENDING" | "DESCENDING" }[];
  limit?: number;
}

export function whereEquals(field: string, value: FsValue) {
  return {
    fieldFilter: {
      field: { fieldPath: field },
      op: "EQUAL" as const,
      value: toFirestoreValue(value),
    },
  };
}

// Firestore's runQuery endpoint hangs off `:runQuery`, not a `/collection`
// path segment - see DOCUMENTS_URL usage below (no leading slash).
export async function runQuery<T = FsRow>(structuredQuery: StructuredQuery): Promise<T[]> {
  const token = getAccessToken();
  const response = await fetch(`${DOCUMENTS_URL}:runQuery`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ structuredQuery }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new DataStoreError(JSON.stringify(json.error ?? json));
  }

  return (json as any[])
    .filter((entry) => entry.document)
    .map((entry) => fromFirestoreFields<T>(entry.document.fields));
}
