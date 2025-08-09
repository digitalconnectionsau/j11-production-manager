import { Router } from 'express';
import { db } from '../db/index.js';
import { holidays } from '../db/schema.js';
import { eq, desc, asc, gte, lte, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all holidays
router.get('/', authenticateToken, async (req, res) => {
  try {
    const allHolidays = await db
      .select()
      .from(holidays)
      .orderBy(asc(holidays.date));

    res.json(allHolidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// Get holidays for a specific year
router.get('/year/:year', authenticateToken, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const yearHolidays = await db
      .select()
      .from(holidays)
      .where(and(
        gte(holidays.date, startDate),
        lte(holidays.date, endDate)
      ))
      .orderBy(asc(holidays.date));

    res.json(yearHolidays);
  } catch (error) {
    console.error('Error fetching holidays by year:', error);
    res.status(500).json({ error: 'Failed to fetch holidays for year' });
  }
});

// Create a new holiday
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, date, isPublic = true, isCustom = true, description } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    const newHoliday = await db
      .insert(holidays)
      .values({
        name,
        date,
        isPublic,
        isCustom,
        description,
      })
      .returning();

    res.status(201).json(newHoliday[0]);
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// Update a holiday
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);
    const { name, date, isPublic, isCustom, description } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    const updatedHoliday = await db
      .update(holidays)
      .set({
        name,
        date,
        isPublic,
        isCustom,
        description,
        updatedAt: new Date(),
      })
      .where(eq(holidays.id, holidayId))
      .returning();

    if (updatedHoliday.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json(updatedHoliday[0]);
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// Delete a holiday
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const holidayId = parseInt(req.params.id);

    const deletedHoliday = await db
      .delete(holidays)
      .where(eq(holidays.id, holidayId))
      .returning();

    if (deletedHoliday.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

export default router;
