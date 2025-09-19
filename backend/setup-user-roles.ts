import dotenv from 'dotenv';
import { db } from './src/db/index.js';
import { users, roles, userRoles } from './src/db/schema.js';
import { eq, inArray } from 'drizzle-orm';

// Load environment variables
dotenv.config();

async function setupUserRoles() {
  try {
    console.log('🔧 Setting up User Role Assignments...\n');
    
    // Step 1: Show current users
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    }).from(users);

    console.log('📋 Current Users:');
    console.log('=================');
    allUsers.forEach(user => {
      console.log(`${user.id}. ${user.email} - ${user.firstName} ${user.lastName} (${user.role})`);
    });

    // Step 2: Show available roles
    const allRoles = await db.select().from(roles);
    console.log('\n🏷️  Available Roles:');
    console.log('====================');
    allRoles.forEach(role => {
      console.log(`${role.id}. ${role.name} - ${role.displayName} (Super Admin: ${role.isSuperAdmin})`);
    });

    // Step 3: Find the specific users and roles
    const craig = allUsers.find(u => u.email === 'craig@digitalconnections.au');
    const glenn = allUsers.find(u => u.email === 'glenn@joineryeleven.com.au');
    const jim = allUsers.find(u => u.email === 'jim@joineryeleven.com.au');
    
    const superAdminRole = allRoles.find(r => r.name === 'super_admin');
    const adminRole = allRoles.find(r => r.name === 'admin');

    if (!craig || !glenn || !jim) {
      console.log('❌ Could not find required users');
      return;
    }

    if (!superAdminRole || !adminRole) {
      console.log('❌ Could not find required roles');
      return;
    }

    console.log('\n🎯 Assignment Plan:');
    console.log('===================');
    console.log(`${craig.email} → ${superAdminRole.displayName}`);
    console.log(`${glenn.email} → ${adminRole.displayName}`);
    console.log(`${jim.email} → ${adminRole.displayName}`);

    // Step 4: Users to remove
    const usersToRemove = allUsers.filter(u => 
      u.email === 'admin@j11.com' || 
      u.email === 'admin@j11productions.com'
    );

    console.log('\n🗑️  Users to Remove:');
    console.log('====================');
    usersToRemove.forEach(user => {
      console.log(`${user.email} - ${user.firstName} ${user.lastName}`);
    });

    // Ask for confirmation
    console.log('\n⚠️  CONFIRMATION REQUIRED:');
    console.log('This will:');
    console.log('1. Assign Craig to Super Administrator role');
    console.log('2. Assign Glenn and Jim to Administrator role');
    console.log(`3. DELETE ${usersToRemove.length} user accounts permanently`);
    console.log('\nContinue? Type "YES" to proceed or anything else to cancel:');

    // For now, just show the plan without executing
    console.log('\n📝 SQL Commands that would be executed:');
    console.log('=======================================');
    
    // Show role assignments
    console.log(`-- Assign Craig to Super Admin role:`);
    console.log(`INSERT INTO user_roles (user_id, role_id) VALUES (${craig.id}, ${superAdminRole.id});`);
    
    console.log(`-- Assign Glenn to Admin role:`);
    console.log(`INSERT INTO user_roles (user_id, role_id) VALUES (${glenn.id}, ${adminRole.id});`);
    
    console.log(`-- Assign Jim to Admin role:`);
    console.log(`INSERT INTO user_roles (user_id, role_id) VALUES (${jim.id}, ${adminRole.id});`);

    // Show user deletions
    if (usersToRemove.length > 0) {
      const userIds = usersToRemove.map(u => u.id).join(', ');
      console.log(`-- Delete unused admin accounts:`);
      console.log(`DELETE FROM users WHERE id IN (${userIds});`);
    }

    console.log('\n✅ Ready to execute. Run with --execute flag to apply changes.');

  } catch (error) {
    console.error('❌ Error setting up user roles:', error);
  }
  
  process.exit(0);
}

setupUserRoles();