import { createConnection } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

async function listUsers() {
  const client = createConnection({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(`
      SELECT 
        id,
        email,
        username,
        first_name,
        last_name,
        role,
        department,
        position,
        is_active,
        is_blocked,
        last_login,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log('\n📊 Current Users in Database:');
    console.log('============================================');
    
    if (result.rows.length === 0) {
      console.log('No users found in database.');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username || 'Not set'}`);
        console.log(`   Name: ${user.first_name || ''} ${user.last_name || ''}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Department: ${user.department || 'Not set'}`);
        console.log(`   Position: ${user.position || 'Not set'}`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`   Blocked: ${user.is_blocked ? 'Yes' : 'No'}`);
        console.log(`   Last Login: ${user.last_login || 'Never'}`);
        console.log(`   Created: ${user.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await client.end();
  }
}

listUsers();