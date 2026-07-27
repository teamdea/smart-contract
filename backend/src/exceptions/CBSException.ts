import { ApiError } from "./ApiError";

// Raised by the simulated Core Banking System service (fund hold /
// settlement / release hold) when a simulated operation cannot proceed.
export class CBSException extends ApiError {
  constructor(message: string, status = 502) {
    super(status, `CBS error: ${message}`);
    this.name = "CBSException";
  }
}
