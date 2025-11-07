import { Router } from 'express';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import db from '../db/index.js';
import { loginActivity, users } from '../db/schema.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { verifyTokenAndPermission } from '../middleware/permissions.js';

const router = Router();

// GET /api/login-activity - Get all login activity (admin only)
router.get('/', verifyTokenAndPermission('view_audit_logs'), async (req: AuthRequest, res) => {
  try {
    const { limit = 100, offset = 0, userId, email, action, days = 30 } = req.query;

    // Build where conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(loginActivity.userId, Number(userId)));
    }
    
    if (email) {
      conditions.push(eq(loginActivity.email, String(email)));
    }
    
    if (action) {
      conditions.push(eq(loginActivity.action, String(action)));
    }
    
    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));
    conditions.push(gte(loginActivity.timestamp, cutoffDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get activity logs with user details
    const activities = await db
      .select({
        id: loginActivity.id,
        userId: loginActivity.userId,
        email: loginActivity.email,
        action: loginActivity.action,
        ipAddress: loginActivity.ipAddress,
        userAgent: loginActivity.userAgent,
        failureReason: loginActivity.failureReason,
        timestamp: loginActivity.timestamp,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(loginActivity)
      .leftJoin(users, eq(loginActivity.userId, users.id))
      .where(whereClause)
      .orderBy(desc(loginActivity.timestamp))
      .limit(Number(limit))
      .offset(Number(offset));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loginActivity)
      .where(whereClause);
    
    const total = countResult[0]?.count || 0;

    res.json({
      activities,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total,
      }
    });
  } catch (error) {
    console.error('Error fetching login activity:', error);
    res.status(500).json({ error: 'Failed to fetch login activity' });
  }
});

// GET /api/login-activity/user/:userId - Get login activity for specific user
router.get('/user/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Only allow users to view their own activity
    if (req.user?.id !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized to view this activity' });
    }

    const activities = await db
      .select()
      .from(loginActivity)
      .where(eq(loginActivity.userId, Number(userId)))
      .orderBy(desc(loginActivity.timestamp))
      .limit(Number(limit));

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching user login activity:', error);
    res.status(500).json({ error: 'Failed to fetch login activity' });
  }
});

// GET /api/login-activity/stats - Get login statistics (admin only)
router.get('/stats', verifyTokenAndPermission('view_audit_logs'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    // Total logins by action type
    const actionStats = await db
      .select({
        action: loginActivity.action,
        count: sql<number>`count(*)::int`,
      })
      .from(loginActivity)
      .where(gte(loginActivity.timestamp, cutoffDate))
      .groupBy(loginActivity.action);

    // Failed login reasons
    const failureStats = await db
      .select({
        reason: loginActivity.failureReason,
        count: sql<number>`count(*)::int`,
      })
      .from(loginActivity)
      .where(
        and(
          eq(loginActivity.action, 'login_failed'),
          gte(loginActivity.timestamp, cutoffDate)
        )
      )
      .groupBy(loginActivity.failureReason);

    // Most active users
    const topUsers = await db
      .select({
        userId: loginActivity.userId,
        email: loginActivity.email,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        loginCount: sql<number>`count(*)::int`,
      })
      .from(loginActivity)
      .leftJoin(users, eq(loginActivity.userId, users.id))
      .where(
        and(
          eq(loginActivity.action, 'login_success'),
          gte(loginActivity.timestamp, cutoffDate)
        )
      )
      .groupBy(loginActivity.userId, loginActivity.email, users.firstName, users.lastName)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Recent suspicious activity (multiple failed logins)
    const suspiciousActivity = await db
      .select({
        email: loginActivity.email,
        ipAddress: loginActivity.ipAddress,
        failedAttempts: sql<number>`count(*)::int`,
        lastAttempt: sql<Date>`MAX(${loginActivity.timestamp})`,
      })
      .from(loginActivity)
      .where(
        and(
          eq(loginActivity.action, 'login_failed'),
          gte(loginActivity.timestamp, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
        )
      )
      .groupBy(loginActivity.email, loginActivity.ipAddress)
      .having(sql`count(*) >= 3`)
      .orderBy(desc(sql`count(*)`));

    res.json({
      stats: {
        actionStats,
        failureStats,
        topUsers,
        suspiciousActivity,
      },
      period: {
        days: Number(days),
        from: cutoffDate,
        to: new Date(),
      }
    });
  } catch (error) {
    console.error('Error fetching login statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
