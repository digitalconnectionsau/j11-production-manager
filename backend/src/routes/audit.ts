import { Router } from 'express';
import { verifyTokenAndPermission, type AuthenticatedRequest } from '../middleware/permissions.js';
import { 
  getAuditLogsForRecord, 
  getAuditLogsForUser, 
  getRecentAuditLogs 
} from '../services/auditService.js';

const router = Router();

// Get audit logs for a specific record
router.get('/record/:tableName/:recordId', verifyTokenAndPermission('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { tableName, recordId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await getAuditLogsForRecord(tableName, parseInt(recordId), limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs for record:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for a specific user
router.get('/user/:userId', verifyTokenAndPermission('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await getAuditLogsForUser(parseInt(userId), limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs for user:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get recent audit logs (admin view)
router.get('/recent', verifyTokenAndPermission('admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;

    const logs = await getRecentAuditLogs(limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit logs for current user's actions
router.get('/my-actions', verifyTokenAndPermission('view_audit_logs'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const logs = await getAuditLogsForUser(userId, limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;