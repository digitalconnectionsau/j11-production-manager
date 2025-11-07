import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register, password reset)
 * Prevents brute force attacks by limiting attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    status: 429
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests (only count failures)
  skipSuccessfulRequests: false,
  // Store in memory (for production, consider Redis or similar)
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
      status: 429
    });
  }
});

/**
 * Stricter rate limiter for password reset requests
 * Lower limit to prevent email flooding
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again in 1 hour.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many password reset requests from this IP. Please try again in 1 hour.',
      status: 429
    });
  }
});

/**
 * General API rate limiter for all other endpoints
 * More lenient than auth endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    status: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP. Please slow down.',
      status: 429
    });
  }
});
