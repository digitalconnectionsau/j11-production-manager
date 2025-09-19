import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './backend/src/db/schema.js';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

async function listUsers() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🔗 Connecting to database...');
    
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      department: users.department,
      position: users.position,
      mobile: users.mobile,
      phone: users.phone,
      isActive: users.isActive,
      isBlocked: users.isBlocked,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
    }).from(users);

    console.log('\n📊 Current Users in Database:');
    console.log('============================================');
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database.');
      console.log('\n💡 You may need to seed the database first.');
      console.log('Run: cd backend && npm run seed');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. 👤 User ID: ${user.id}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 Username: ${user.username || 'Not set'}`);
        console.log(`   👤 Name: ${user.firstName || ''} ${user.lastName || ''}`);
        console.log(`   🏷️  Role: ${user.role}`);
        console.log(`   🏢 Department: ${user.department || 'Not set'}`);
        console.log(`   💼 Position: ${user.position || 'Not set'}`);
        console.log(`   📱 Mobile: ${user.mobile || 'Not set'}`);
        console.log(`   ☎️  Phone: ${user.phone || 'Not set'}`);
        console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`   🚫 Blocked: ${user.isBlocked ? 'Yes' : 'No'}`);
        console.log(`   🕐 Last Login: ${user.lastLogin || 'Never'}`);
        console.log(`   📅 Created: ${user.createdAt}`);
      });
      
      console.log(`\n📈 Total Users: ${allUsers.length}`);
      console.log(`✅ Active Users: ${allUsers.filter(u => u.isActive && !u.isBlocked).length}`);
      console.log(`🚫 Blocked Users: ${allUsers.filter(u => u.isBlocked).length}`);
      console.log(`💤 Inactive Users: ${allUsers.filter(u => !u.isActive).length}`);
    }

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await client.end();
  }
}

listUsers();