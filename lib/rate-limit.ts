/**
 * Rate Limiting Utilities
 *
 * Implements in-memory rate limiting for QR code scans and API operations.
 * In production, consider using Redis or similar for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  QR_SCAN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 scans per minute per IP
  },
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute per user
  },
  TABLE_CREATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 table creations per hour per organization
  },
  QR_REGENERATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 QR regenerations per hour per table
  },
} as const;

/**
 * Checks if a request should be rate limited
 */
export function isRateLimited(
  key: string,
  windowMs: number,
  maxRequests: number
): { limited: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired, reset counter
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      limited: false,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      limited: true,
      resetTime: entry.resetTime,
      remaining: 0,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    limited: false,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limiter for QR code scans
 */
export function checkQrScanRateLimit(ip: string) {
  const key = `qr_scan:${ip}`;
  return isRateLimited(
    key,
    RATE_LIMITS.QR_SCAN.windowMs,
    RATE_LIMITS.QR_SCAN.maxRequests
  );
}

/**
 * Rate limiter for API requests
 */
export function checkApiRateLimit(userId: string) {
  const key = `api:${userId}`;
  return isRateLimited(
    key,
    RATE_LIMITS.API_GENERAL.windowMs,
    RATE_LIMITS.API_GENERAL.maxRequests
  );
}

/**
 * Rate limiter for table creation
 */
export function checkTableCreationRateLimit(organizationId: string) {
  const key = `table_create:${organizationId}`;
  return isRateLimited(
    key,
    RATE_LIMITS.TABLE_CREATION.windowMs,
    RATE_LIMITS.TABLE_CREATION.maxRequests
  );
}

/**
 * Rate limiter for QR code regeneration
 */
export function checkQrRegenerationRateLimit(tableId: string) {
  const key = `qr_regen:${tableId}`;
  return isRateLimited(
    key,
    RATE_LIMITS.QR_REGENERATION.windowMs,
    RATE_LIMITS.QR_REGENERATION.maxRequests
  );
}

/**
 * Cleanup expired entries periodically
 */
function cleanupExpiredEntries() {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default value
  return "unknown";
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'",
  };
}

/**
 * CORS headers for public checkout endpoint
 */
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "https://localhost:3000",
  ].filter(Boolean);

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}