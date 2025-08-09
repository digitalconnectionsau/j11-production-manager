import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it's not supported for serverless
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export default db;
