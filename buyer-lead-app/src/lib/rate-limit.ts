// Simple in-memory rate limiter (for demo purposes)
// In production, use Redis or a proper rate limiting service

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string, 
  limit: number = 10, 
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up expired entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (v.resetTime < now) {
      rateLimitMap.delete(k);
    }
  }
  
  const current = rateLimitMap.get(key);
  
  if (!current || current.resetTime < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remaining: limit - current.count, 
    resetTime: current.resetTime 
  };
}

export function getRateLimitKey(identifier: string, action: string): string {
  return `${action}:${identifier}`;
}
