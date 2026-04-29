/**
 * Extract a user-friendly error message from an API response or thrown error.
 * Handles cases where the backend returns { success: false, message: string }
 * even with HTTP 200, or throws ApiError with a `response` body.
 */
export const extractApiError = (err: any, fallback = "Something went wrong"): string => {
  if (!err) return fallback
  if (typeof err === "string") return err

  // ApiError with response body { success: false, message }
  if (err.response?.message) return err.response.message
  if (err.response?.error) return err.response.error

  // Plain Error with message
  if (err.message) return err.message

  return fallback
}

/**
 * Inspect a response shape (already parsed JSON) and return its message if not successful.
 * Useful when the API returns 200 OK but { success: false, message: "..." }.
 */
export const responseMessageIfFailed = (res: any): string | null => {
  if (!res) return null
  if (res.success === false) {
    return res.message || res.error || "Request failed"
  }
  return null
}
