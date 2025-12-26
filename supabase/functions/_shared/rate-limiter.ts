/**
 * Rate Limiter Utility for Supabase Edge Functions
 * Uses database to track requests per user/IP
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  identifier: string; // user_id or IP address
  functionName: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until retry is allowed
}

/**
 * Check rate limit for a given identifier
 * Returns whether request should be allowed and remaining requests
 */
export async function checkRateLimit(
  supabase: any,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, identifier, functionName } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Get or create rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('function_name', functionName)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // If error is not "not found", log it but allow request (fail open)
      console.error('Rate limit check error:', fetchError);
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    if (!existing) {
      // First request - create record
      const resetAt = new Date(now.getTime() + windowMs);
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          function_name: functionName,
          request_count: 1,
          window_start: windowStart.toISOString(),
          reset_at: resetAt.toISOString(),
        });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt,
        };
      }

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    // Check if window has expired
    const resetAt = new Date(existing.reset_at);
    if (now > resetAt) {
      // Window expired - reset counter
      const newResetAt = new Date(now.getTime() + windowMs);
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          reset_at: newResetAt.toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Rate limit reset error:', updateError);
        return {
          allowed: true,
          remaining: maxRequests - 1,
          resetAt: newResetAt,
        };
      }

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: newResetAt,
      };
    }

    // Window still active - check count
    if (existing.request_count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Increment counter
    const { error: incrementError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existing.request_count + 1,
      })
      .eq('id', existing.id);

    if (incrementError) {
      console.error('Rate limit increment error:', incrementError);
      return {
        allowed: true,
        remaining: maxRequests - existing.request_count - 1,
        resetAt,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - existing.request_count - 1,
      resetAt,
    };
  } catch (error) {
    // Fail open - allow request if rate limiting fails
    console.error('Rate limit check exception:', error);
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(req: Request): string {
  // Try various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in Deno Deploy, but good for local)
  return 'unknown';
}

/**
 * Rate limit configurations per function
 */
export const RATE_LIMITS = {
  'ai-chat': {
    maxRequests: 30, // 30 requests
    windowMs: 60 * 1000, // per minute
  },
  'ai-analyze': {
    maxRequests: 60, // 60 requests
    windowMs: 60 * 1000, // per minute
  },
  'ai-suggest': {
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
  },
  'ai-qualify': {
    maxRequests: 50, // 50 requests
    windowMs: 60 * 1000, // per minute
  },
  'whatsapp-send': {
    maxRequests: 100, // 100 messages
    windowMs: 60 * 1000, // per minute
  },
  'whatsapp-connect': {
    maxRequests: 10, // 10 connections
    windowMs: 60 * 60 * 1000, // per hour
  },
  'default': {
    maxRequests: 100,
    windowMs: 60 * 1000, // per minute
  },
} as const;

/**
 * Check rate limit with default config for function
 */
export async function checkFunctionRateLimit(
  supabase: any,
  req: Request,
  functionName: string,
  userId?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[functionName as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  
  // Use user ID if available, otherwise use IP
  const identifier = userId || getClientIP(req);

  return checkRateLimit(supabase, {
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    identifier,
    functionName,
  });
}


