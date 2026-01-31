import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure random password
 * Uses crypto.randomBytes() for secure randomness
 * @param length - Password length (default: 12)
 * @returns A secure random password string
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomBytesBuffer = randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    // Use modulo to map random byte to charset index
    // This is slightly biased but acceptable for password generation
    password += charset[randomBytesBuffer[i] % charset.length]
  }

  return password
}
