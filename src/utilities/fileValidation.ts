/**
 * File upload validation utilities
 *
 * Provides validation for file uploads including type checking and size limits.
 */

// Allowed MIME types for image uploads
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

// Maximum file size in bytes (5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate an uploaded image file
 * @param file - The File object to validate
 * @param options - Optional override for allowed types and max size
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  options?: {
    allowedTypes?: readonly string[]
    maxSize?: number
  },
): FileValidationResult {
  const allowedTypes = options?.allowedTypes || ALLOWED_IMAGE_TYPES
  const maxSize = options?.maxSize || MAX_IMAGE_SIZE

  // Check file type
  if (!allowedTypes.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File too large: ${fileSizeMB}MB. Maximum size: ${maxSizeMB}MB`,
    }
  }

  // Basic magic number check for common image types
  // This is a basic check - more thorough validation should happen server-side with proper image processing
  const magicNumberCheck = validateMagicNumber(file.type, file.name)
  if (!magicNumberCheck.valid) {
    return magicNumberCheck
  }

  return { valid: true }
}

/**
 * Basic validation that file extension matches claimed MIME type
 * This is not foolproof but adds a layer of defense
 */
function validateMagicNumber(mimeType: string, filename: string): FileValidationResult {
  const extension = filename.split('.').pop()?.toLowerCase()

  const typeToExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/svg+xml': ['svg'],
  }

  const allowedExtensions = typeToExtensions[mimeType]
  if (allowedExtensions && extension && !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension .${extension} does not match declared type ${mimeType}`,
    }
  }

  return { valid: true }
}

/**
 * Sanitize a filename for safe storage
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.{2,}/g, '.') // Prevent multiple dots (path traversal)
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255) // Limit length
}
