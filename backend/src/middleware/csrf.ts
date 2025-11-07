import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';
import { Request } from 'express';

// CSRF protection configuration
const csrfUtils = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production',
  getSessionIdentifier: (req) => req.headers['user-agent'] || 'anonymous', // Use user-agent as session identifier
  cookieName: 'csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Export utilities
export { cookieParser };
export const csrfProtection = csrfUtils.doubleCsrfProtection;
export const validateCsrf = csrfUtils.validateRequest;

// Helper to get CSRF token for responses
export const getCsrfToken = (req: Request): string => {
  return csrfUtils.generateCsrfToken(req, req.res!);
};
