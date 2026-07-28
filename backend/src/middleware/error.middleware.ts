import { Request, Response, NextFunction } from "express";
import { ApiError } from "../exceptions/ApiError";
import { logger } from "../utils/logger";
import { fail } from "../utils/response";

// Express only recognizes error-handling middleware by arity (exactly 4
// params) - `next` must stay in the signature even though it's never
// called, or Express would treat this as a normal middleware instead.
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    fail(res, err.message, err.status);
    return;
  }

  logger.error("Unhandled error", err);
  fail(res, "Internal server error", 500);
}
