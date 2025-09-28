import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

async function addArchivedColumn() {
  try {
    await db.execute(sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE`);
    console.log('Archived column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding archived column:', error);
    process.exit(1);
  }
}

addArchivedColumn();