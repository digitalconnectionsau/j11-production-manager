import express from 'express';
import { db } from '../db/index.js';
import { userColumnPreferences } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user column preferences for a specific table
router.get('/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const userId = (req as any).user.id;

    const preferences = await db
      .select()
      .from(userColumnPreferences)
      .where(and(
        eq(userColumnPreferences.userId, userId),
        eq(userColumnPreferences.tableName, tableName)
      ));

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching user column preferences:', error);
    res.status(500).json({ error: 'Failed to fetch column preferences' });
  }
});

// Update or create user column preferences
router.put('/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const userId = (req as any).user.id;
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array' });
    }

    // Start a transaction to update all preferences
    await db.transaction(async (tx) => {
      // Delete existing preferences for this user and table
      await tx
        .delete(userColumnPreferences)
        .where(and(
          eq(userColumnPreferences.userId, userId),
          eq(userColumnPreferences.tableName, tableName)
        ));

      // Insert new preferences
      if (preferences.length > 0) {
        await tx
          .insert(userColumnPreferences)
          .values(preferences.map((pref: any) => ({
            userId,
            tableName,
            columnName: pref.columnName,
            isVisible: pref.isVisible ?? true,
            widthPx: pref.widthPx || null,
            orderIndex: pref.orderIndex || 0,
          })));
      }
    });

    res.json({ success: true, message: 'Column preferences updated successfully' });
  } catch (error) {
    console.error('Error updating user column preferences:', error);
    res.status(500).json({ error: 'Failed to update column preferences' });
  }
});

// Update single column preference (for real-time updates)
router.patch('/:tableName/:columnName', authenticateToken, async (req, res) => {
  try {
    const { tableName, columnName } = req.params;
    const userId = (req as any).user.id;
    const { isVisible, widthPx, orderIndex } = req.body;

    // Check if preference exists
    const existing = await db
      .select()
      .from(userColumnPreferences)
      .where(and(
        eq(userColumnPreferences.userId, userId),
        eq(userColumnPreferences.tableName, tableName),
        eq(userColumnPreferences.columnName, columnName)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing preference
      await db
        .update(userColumnPreferences)
        .set({
          isVisible: isVisible !== undefined ? isVisible : existing[0].isVisible,
          widthPx: widthPx !== undefined ? widthPx : existing[0].widthPx,
          orderIndex: orderIndex !== undefined ? orderIndex : existing[0].orderIndex,
          updatedAt: new Date(),
        })
        .where(and(
          eq(userColumnPreferences.userId, userId),
          eq(userColumnPreferences.tableName, tableName),
          eq(userColumnPreferences.columnName, columnName)
        ));
    } else {
      // Create new preference
      await db
        .insert(userColumnPreferences)
        .values({
          userId,
          tableName,
          columnName,
          isVisible: isVisible ?? true,
          widthPx: widthPx || null,
          orderIndex: orderIndex || 0,
        });
    }

    res.json({ success: true, message: 'Column preference updated successfully' });
  } catch (error) {
    console.error('Error updating column preference:', error);
    res.status(500).json({ error: 'Failed to update column preference' });
  }
});

// Reset column preferences to default
router.delete('/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const userId = (req as any).user.id;

    await db
      .delete(userColumnPreferences)
      .where(and(
        eq(userColumnPreferences.userId, userId),
        eq(userColumnPreferences.tableName, tableName)
      ));

    res.json({ success: true, message: 'Column preferences reset to default' });
  } catch (error) {
    console.error('Error resetting column preferences:', error);
    res.status(500).json({ error: 'Failed to reset column preferences' });
  }
});

export default router;