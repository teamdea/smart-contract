// Axios's own error.message is a generic string like "Request failed with
// status code 401" - it never contains the backend's actual message (e.g.
// "Missing or invalid session - please log in again"). This pulls the real
// message out of the response body our API always sends on error, falling
// back to a caller-supplied default when the error didn't come from our API
// at all (network failure, etc).
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
