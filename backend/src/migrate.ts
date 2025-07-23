import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function createTables() {
  try {
    console.log('Creating clients table...');
    
    // Create clients table
    await client`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ Clients table created successfully');

    // Update projects table to add client_id column if it doesn't exist
    await client`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS client_id INTEGER 
      REFERENCES clients(id)
    `;

    console.log('✅ Projects table updated with client_id column');

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

createTables();
