import dotenv from 'dotenv';
import db from './src/db/index.js';
import { users } from './src/db/schema.js';

// Load environment variables
dotenv.config();

async function listUsers() {
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
      console.log('Run: npm run seed');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. 👤 User ID: ${user.id}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 Username: ${user.username || 'Not set'}`);
        console.log(`   👤 Name: ${(user.firstName || '')} ${(user.lastName || '')}`);
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
      
      console.log('\n🔑 Login Credentials Available:');
      console.log('================================');
      console.log('Default Admin User:');
      console.log('📧 Email: admin@j11productions.com');
      console.log('🔑 Password: j11!@#$');
    }

  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
  
  process.exit(0);
}

listUsers();