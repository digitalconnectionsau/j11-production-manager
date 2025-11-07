import { Request } from 'express';
import db from '../db/index.js';
import { loginActivity } from '../db/schema.js';

/**
 * Authentication activity types
 */
export enum AuthAction {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
}

/**
 * Failure reasons for login attempts
 */
export enum LoginFailureReason {
  WRONG_PASSWORD = 'wrong_password',
  USER_NOT_FOUND = 'user_not_found',
  ACCOUNT_BLOCKED = 'account_blocked',
  ACCOUNT_INACTIVE = 'account_inactive',
  INVALID_CREDENTIALS = 'invalid_credentials',
}

interface LogActivityParams {
  userId?: number;
  email: string;
  action: AuthAction;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: LoginFailureReason | string;
}

/**
 * Get client IP address from request
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : forwarded[0];
  }
  return req.socket.remoteAddress || 'unknown';
};

/**
 * Get user agent from request
 */
export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Log authentication activity
 */
export const logAuthActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await db.insert(loginActivity).values({
      userId: params.userId || null,
      email: params.email,
      action: params.action,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      failureReason: params.failureReason || null,
    });
    
    console.log(`🔐 Auth activity logged: ${params.action} for ${params.email}`);
  } catch (error) {
    // Don't throw error to prevent auth flow from breaking
    console.error('❌ Failed to log auth activity:', error);
  }
};

/**
 * Get recent login activity for a user
 */
export const getRecentLoginActivity = async (
  email: string, 
  limit: number = 10
) => {
  try {
    const { desc, eq } = await import('drizzle-orm');
    
    return await db
      .select()
      .from(loginActivity)
      .where(eq(loginActivity.email, email))
      .orderBy(desc(loginActivity.timestamp))
      .limit(limit);
  } catch (error) {
    console.error('❌ Failed to fetch login activity:', error);
    return [];
  }
};

/**
 * Get failed login attempts for a user in a time window
 */
export const getFailedLoginAttempts = async (
  email: string,
  minutesAgo: number = 15
): Promise<number> => {
  try {
    const { eq, and, gte, sql } = await import('drizzle-orm');
    
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginActivity)
      .where(
        and(
          eq(loginActivity.email, email),
          eq(loginActivity.action, AuthAction.LOGIN_FAILED),
          gte(loginActivity.timestamp, cutoffTime)
        )
      );
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error('❌ Failed to count failed login attempts:', error);
    return 0;
  }
};
