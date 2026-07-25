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
}
