import { ApiError } from "./ApiError";

// Raised when a Firestore request fails (auth, quota, malformed query, etc).
export class DataStoreError extends ApiError {
  constructor(message: string) {
    super(502, `Data store error: ${message}`);
    this.name = "DataStoreError";
  }
}
