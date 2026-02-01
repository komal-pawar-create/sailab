/**
 * Security utilities for authentication
 * - Token hashing using Web Crypto API (SHA-256)
 * - Client IP detection
 * - Rate limit state management
 */

/**
 * Hash a token using SHA-256
 * Uses Web Crypto API for browser-native secure hashing
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Get the client's IP address
 * Uses a public IP detection service with fallback
 * Returns a default IP if detection fails
 */
export async function getClientIP(): Promise<string> {
  try {
    // Use ipify API for IP detection (simple and reliable)
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.ip;
    }
  } catch (error) {
    console.warn('Failed to detect client IP:', error);
  }
  
  // Fallback to a default private IP (will still work for logging)
  return '0.0.0.0';
}

/**
 * Get the user agent string
 */
export function getUserAgent(): string {
  return navigator.userAgent || 'unknown';
}

/**
 * Rate limit state for UI display
 */
export interface RateLimitState {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
  message: string | null;
}

/**
 * Parse rate limit response from the database
 */
export function parseRateLimitResponse(response: {
  allowed: boolean;
  remaining_attempts: number;
  locked_until: string | null;
  message: string | null;
}): RateLimitState {
  return {
    allowed: response.allowed,
    remainingAttempts: response.remaining_attempts,
    lockedUntil: response.locked_until ? new Date(response.locked_until) : null,
    message: response.message,
  };
}

/**
 * Calculate time remaining until lockout expires
 * Returns a human-readable string
 */
export function getTimeUntilUnlock(lockedUntil: Date): string {
  const now = new Date();
  const diffMs = lockedUntil.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'now';
  }
  
  const diffSeconds = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
}

/**
 * Session expiry calculation (7 days from now)
 */
export function getSessionExpiryDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}
