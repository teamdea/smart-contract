import { Request, Response, NextFunction } from "express";
import { ApiError } from "../exceptions/ApiError";
import { logger } from "../utils/logger";
import { fail } from "../utils/response";

export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ApiError) {
    fail(res, err.message, err.status);
    return;
  }

  logger.error("Unhandled error", err);
  fail(res, "Internal server error", 500);
}
