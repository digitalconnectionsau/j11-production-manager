import { Router } from 'express';
import { db } from '../db/index.js';
import { leadTimes, jobStatuses } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all lead times
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db
      .select({
        id: leadTimes.id,
        fromStatusId: leadTimes.fromStatusId,
        toStatusId: leadTimes.toStatusId,
        days: leadTimes.days,
        direction: leadTimes.direction,
        isActive: leadTimes.isActive,
        createdAt: leadTimes.createdAt,
        updatedAt: leadTimes.updatedAt,
      })
      .from(leadTimes)
      .orderBy(leadTimes.fromStatusId, leadTimes.toStatusId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching lead times:', error);
    res.status(500).json({ error: 'Failed to fetch lead times' });
  }
});

// Get lead times for a specific status
router.get('/status/:statusId', authenticateToken, async (req, res) => {
  try {
    const statusId = parseInt(req.params.statusId);
    
    if (isNaN(statusId)) {
      return res.status(400).json({ error: 'Invalid status ID' });
    }

    const result = await db
      .select()
      .from(leadTimes)
      .where(eq(leadTimes.fromStatusId, statusId));

    res.json(result);
  } catch (error) {
    console.error('Error fetching lead times for status:', error);
    res.status(500).json({ error: 'Failed to fetch lead times for status' });
  }
});

// Create or update a lead time
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { fromStatusId, toStatusId, days, direction, isActive } = req.body;

    // Validate required fields
    if (!fromStatusId || !toStatusId || days === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: fromStatusId, toStatusId, days' 
      });
    }

    // Validate direction
    if (direction && !['before', 'after'].includes(direction)) {
      return res.status(400).json({ 
        error: 'Direction must be either "before" or "after"' 
      });
    }

    // Check if lead time already exists
    const existing = await db
      .select()
      .from(leadTimes)
      .where(
        and(
          eq(leadTimes.fromStatusId, fromStatusId),
          eq(leadTimes.toStatusId, toStatusId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing lead time
      const result = await db
        .update(leadTimes)
        .set({
          days,
          direction: direction || 'before',
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date(),
        })
        .where(eq(leadTimes.id, existing[0].id))
        .returning();

      res.json(result[0]);
    } else {
      // Create new lead time
      const result = await db
        .insert(leadTimes)
        .values({
          fromStatusId,
          toStatusId,
          days,
          direction: direction || 'before',
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();

      res.status(201).json(result[0]);
    }
  } catch (error) {
    console.error('Error creating/updating lead time:', error);
    res.status(500).json({ error: 'Failed to create/update lead time' });
  }
});

// Update a specific lead time
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { days, direction, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid lead time ID' });
    }

    // Validate direction if provided
    if (direction && !['before', 'after'].includes(direction)) {
      return res.status(400).json({ 
        error: 'Direction must be either "before" or "after"' 
      });
    }

    const updateData: any = { updatedAt: new Date() };
    if (days !== undefined) updateData.days = days;
    if (direction !== undefined) updateData.direction = direction;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await db
      .update(leadTimes)
      .set(updateData)
      .where(eq(leadTimes.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Lead time not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating lead time:', error);
    res.status(500).json({ error: 'Failed to update lead time' });
  }
});

// Delete a lead time
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid lead time ID' });
    }

    const result = await db
      .delete(leadTimes)
      .where(eq(leadTimes.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Lead time not found' });
    }

    res.json({ message: 'Lead time deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead time:', error);
    res.status(500).json({ error: 'Failed to delete lead time' });
  }
});

// Initialize default lead times for existing statuses
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    // Get all job statuses
    const allStatuses = await db.select().from(jobStatuses);
    
    // Find the final status (delivery)
    const finalStatus = allStatuses.find(s => s.isFinal) || allStatuses[allStatuses.length - 1];
    
    // Create default lead times for non-final statuses
    const defaultLeadTimes = allStatuses
      .filter(status => !status.isFinal)
      .map(status => ({
        fromStatusId: status.id,
        toStatusId: finalStatus.id,
        days: Math.max(1, (finalStatus.orderIndex - status.orderIndex) * 2), // 2 days per status difference
        direction: 'before' as const,
        isActive: true,
      }));

    // Insert default lead times (ignore conflicts)
    for (const leadTime of defaultLeadTimes) {
      try {
        await db.insert(leadTimes).values(leadTime);
      } catch (error) {
        // Ignore conflicts - lead time already exists
        console.log(`Lead time already exists for status ${leadTime.fromStatusId} to ${leadTime.toStatusId}`);
      }
    }

    res.json({ 
      message: 'Default lead times initialized successfully',
      count: defaultLeadTimes.length 
    });
  } catch (error) {
    console.error('Error initializing default lead times:', error);
    res.status(500).json({ error: 'Failed to initialize default lead times' });
  }
});

export default router;