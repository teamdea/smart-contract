import { ApiError } from "./ApiError";

export class LedgerError extends ApiError {
  constructor(message: string) {
    super(502, `Ledger error: ${message}`);
    this.name = "LedgerError";
  }
}
