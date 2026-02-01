/**
 * Safe error logging utility
 *
 * Extracts only the error message for logging, avoiding exposure of
 * stack traces, internal paths, or other sensitive information in logs.
 */

/**
 * Extract a safe error message from an unknown error
 * @param error - The caught error (unknown type)
 * @returns A safe string message for logging
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Only return the message, not the stack trace
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  // For other types, return a generic message
  return 'An unexpected error occurred'
}
