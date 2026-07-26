export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(401, message);
  }
}
