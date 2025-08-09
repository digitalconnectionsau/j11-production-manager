import express from 'express';
import { db } from '../db/index.js';
import { jobStatuses, jobs } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all job statuses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const statuses = await db
      .select()
      .from(jobStatuses)
      .orderBy(asc(jobStatuses.orderIndex));
    
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching job statuses:', error);
    res.status(500).json({ error: 'Failed to fetch job statuses' });
  }
});

// Create new job status
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, displayName, color, backgroundColor, orderIndex, isDefault, isFinal } = req.body;

    // Validate required fields
    if (!name || !displayName || !color || !backgroundColor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await db
        .update(jobStatuses)
        .set({ isDefault: false })
        .where(eq(jobStatuses.isDefault, true));
    }

    const [newStatus] = await db
      .insert(jobStatuses)
      .values({
        name,
        displayName,
        color,
        backgroundColor,
        orderIndex: orderIndex || 0,
        isDefault: isDefault || false,
        isFinal: isFinal || false,
      })
      .returning();

    res.status(201).json(newStatus);
  } catch (error) {
    console.error('Error creating job status:', error);
    if (error instanceof Error && 'code' in error && error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Status name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create job status' });
    }
  }
});

// Update job status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName, color, backgroundColor, orderIndex, isDefault, isFinal } = req.body;

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await db
        .update(jobStatuses)
        .set({ isDefault: false })
        .where(eq(jobStatuses.isDefault, true));
    }

    const [updatedStatus] = await db
      .update(jobStatuses)
      .set({
        name,
        displayName,
        color,
        backgroundColor,
        orderIndex,
        isDefault,
        isFinal,
        updatedAt: new Date(),
      })
      .where(eq(jobStatuses.id, parseInt(id)))
      .returning();

    if (!updatedStatus) {
      return res.status(404).json({ error: 'Job status not found' });
    }

    res.json(updatedStatus);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// Update status order
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const { statusOrders } = req.body; // Array of { id, orderIndex }

    if (!Array.isArray(statusOrders)) {
      return res.status(400).json({ error: 'statusOrders must be an array' });
    }

    // Update all status orders in a transaction
    for (const { id, orderIndex } of statusOrders) {
      await db
        .update(jobStatuses)
        .set({ orderIndex, updatedAt: new Date() })
        .where(eq(jobStatuses.id, id));
    }

    const updatedStatuses = await db
      .select()
      .from(jobStatuses)
      .orderBy(asc(jobStatuses.orderIndex));

    res.json(updatedStatuses);
  } catch (error) {
    console.error('Error reordering job statuses:', error);
    res.status(500).json({ error: 'Failed to reorder job statuses' });
  }
});

// Delete job status
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if any jobs are using this status
    const jobsWithStatus = await db
      .select()
      .from(jobs)
      .where(eq(jobs.statusId, parseInt(id)))
      .limit(1);

    if (jobsWithStatus.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete status that is being used by jobs' 
      });
    }

    const [deletedStatus] = await db
      .delete(jobStatuses)
      .where(eq(jobStatuses.id, parseInt(id)))
      .returning();

    if (!deletedStatus) {
      return res.status(404).json({ error: 'Job status not found' });
    }

    res.json({ message: 'Job status deleted successfully' });
  } catch (error) {
    console.error('Error deleting job status:', error);
    res.status(500).json({ error: 'Failed to delete job status' });
  }
});

export default router;
