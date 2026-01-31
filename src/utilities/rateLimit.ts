import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Note: For multi-instance deployments, consider using Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header or falls back to a default
 */
function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  // Fallback - in production behind a proxy, x-forwarded-for should always be set
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Check if a request should be rate limited
 * @param req - The incoming request
 * @param endpoint - Identifier for the endpoint (used as part of the key)
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse if rate limited
 */
export function checkRateLimit(
  req: NextRequest,
  endpoint: string,
  config: RateLimitConfig,
): NextResponse | null {
  const clientId = getClientId(req)
  const key = `${endpoint}:${clientId}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return null // Allow request
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      },
    )
  }

  // Increment counter
  entry.count++
  return null // Allow request
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Membership application: 5 requests per 15 minutes
  membershipApplication: (req: NextRequest) =>
    checkRateLimit(req, 'apply-membership', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    }),

  // Mailing list subscribe: 10 requests per hour
  mailingListSubscribe: (req: NextRequest) =>
    checkRateLimit(req, 'mailing-list-subscribe', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    }),

  // General API: 100 requests per minute
  general: (req: NextRequest) =>
    checkRateLimit(req, 'general', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
    }),
}
