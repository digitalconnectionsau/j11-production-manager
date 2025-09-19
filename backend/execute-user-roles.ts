import dotenv from 'dotenv';
import { db } from './src/db/index.js';
import { users, roles, userRoles } from './src/db/schema.js';
import { eq, inArray } from 'drizzle-orm';

// Load environment variables
dotenv.config();

async function executeUserRoleSetup() {
  try {
    console.log('🚀 EXECUTING User Role Setup...\n');
    
    // Get users and roles
    const craig = await db.select().from(users).where(eq(users.email, 'craig@digitalconnections.au')).limit(1);
    const glenn = await db.select().from(users).where(eq(users.email, 'glenn@joineryeleven.com.au')).limit(1);
    const jim = await db.select().from(users).where(eq(users.email, 'jim@joineryeleven.com.au')).limit(1);
    
    const superAdminRole = await db.select().from(roles).where(eq(roles.name, 'super_admin')).limit(1);
    const adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).limit(1);

    if (!craig.length || !glenn.length || !jim.length || !superAdminRole.length || !adminRole.length) {
      console.log('❌ Could not find required users or roles');
      return;
    }

    // Step 1: Clear any existing role assignments for these users
    console.log('🧹 Clearing existing role assignments...');
    await db.delete(userRoles).where(inArray(userRoles.userId, [
      craig[0].id, glenn[0].id, jim[0].id
    ]));
    console.log('✅ Cleared existing assignments');

    // Step 2: Assign new roles
    console.log('\n👤 Assigning new roles...');
    
    // Craig → Super Admin
    await db.insert(userRoles).values({
      userId: craig[0].id,
      roleId: superAdminRole[0].id,
      assignedBy: craig[0].id, // Self-assigned for super admin
    });
    console.log(`✅ ${craig[0].email} → Super Administrator`);

    // Glenn → Admin  
    await db.insert(userRoles).values({
      userId: glenn[0].id,
      roleId: adminRole[0].id,
      assignedBy: craig[0].id,
    });
    console.log(`✅ ${glenn[0].email} → Administrator`);

    // Jim → Admin
    await db.insert(userRoles).values({
      userId: jim[0].id,
      roleId: adminRole[0].id,
      assignedBy: craig[0].id,
    });
    console.log(`✅ ${jim[0].email} → Administrator`);

    // Step 3: Remove old admin accounts
    console.log('\n🗑️  Removing old admin accounts...');
    
    const usersToDelete = await db.select().from(users).where(
      inArray(users.email, ['admin@j11.com', 'admin@j11productions.com'])
    );

    if (usersToDelete.length > 0) {
      // First remove any role assignments
      const userIdsToDelete = usersToDelete.map(u => u.id);
      await db.delete(userRoles).where(inArray(userRoles.userId, userIdsToDelete));
      
      // Then delete the users
      await db.delete(users).where(inArray(users.id, userIdsToDelete));
      
      usersToDelete.forEach(user => {
        console.log(`🗑️  Removed: ${user.email}`);
      });
    }

    // Step 4: Verify the setup
    console.log('\n🔍 Verification - Current User Roles:');
    console.log('=====================================');
    
    const finalUsers = await db
      .select({
        userEmail: users.email,
        userName: users.firstName,
        roleName: roles.name,
        roleDisplay: roles.displayName,
        isSuperAdmin: roles.isSuperAdmin,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(userRoles.roleId, roles.id));

    finalUsers.forEach(user => {
      console.log(`✅ ${user.userEmail} → ${user.roleDisplay} ${user.isSuperAdmin ? '(SUPER ADMIN)' : ''}`);
    });

    const remainingUsers = await db.select({
      email: users.email,
      firstName: users.firstName,
    }).from(users);

    console.log(`\n📊 Summary:`);
    console.log(`- Total users remaining: ${remainingUsers.length}`);
    console.log(`- Users with roles assigned: ${finalUsers.length}`);
    console.log(`- Role assignments completed successfully!`);

    console.log('\n🎉 USER ROLE SETUP COMPLETE!');
    console.log('Next steps:');
    console.log('1. Update JWT secret');
    console.log('2. Apply permission checks to routes');
    console.log('3. Test the authentication system');

  } catch (error) {
    console.error('❌ Error executing user role setup:', error);
  }
  
  process.exit(0);
}

executeUserRoleSetup();