import express from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/debug/tables - List all tables in the database
router.get('/tables', authenticateToken, async (req, res) => {
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    res.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// GET /api/debug/table/:name - Get table structure
router.get('/table/:name', authenticateToken, async (req, res) => {
  try {
    const tableName = req.params.name;
    
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = ${tableName} AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    res.json({ 
      table: tableName,
      columns
    });
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ error: 'Failed to fetch table structure' });
  }
});

// GET /api/debug/clients - Get all clients data
router.get('/clients', authenticateToken, async (req, res) => {
  try {
    const clients = await db.execute(sql`
      SELECT * FROM clients LIMIT 10;
    `);
    
    res.json({ 
      count: clients.length,
      clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
