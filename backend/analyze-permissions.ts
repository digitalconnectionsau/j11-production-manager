import dotenv from 'dotenv';
import { db } from './src/db/index.js';
import { permissions, roles, rolePermissions, userRoles, users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

async function analyzePermissions() {
  try {
    console.log('🔐 Analyzing Permission System...\n');
    
    // Get all permissions
    const allPermissions = await db.select().from(permissions);
    console.log('📋 Available Permissions:');
    console.log('=========================');
    if (allPermissions.length === 0) {
      console.log('❌ No permissions found in database');
    } else {
      allPermissions.forEach(perm => {
        console.log(`   ${perm.name} (${perm.category}) - ${perm.displayName}`);
      });
    }

    // Get all roles
    const allRoles = await db.select().from(roles);
    console.log('\n🏷️  Available Roles:');
    console.log('====================');
    if (allRoles.length === 0) {
      console.log('❌ No roles found in database');
    } else {
      allRoles.forEach(role => {
        console.log(`   ${role.name} - ${role.displayName} (Super Admin: ${role.isSuperAdmin ? 'Yes' : 'No'})`);
      });
    }

    // Get role permissions
    const rolePerms = await db
      .select({
        roleName: roles.name,
        roleDisplay: roles.displayName,
        permissionName: permissions.name,
        permissionDisplay: permissions.displayName,
        category: permissions.category,
      })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    console.log('\n🔗 Role-Permission Assignments:');
    console.log('================================');
    if (rolePerms.length === 0) {
      console.log('❌ No role-permission assignments found');
    } else {
      const roleMap = new Map();
      rolePerms.forEach(rp => {
        if (!roleMap.has(rp.roleName)) {
          roleMap.set(rp.roleName, []);
        }
        roleMap.get(rp.roleName).push(rp);
      });

      roleMap.forEach((perms, roleName) => {
        console.log(`\n   📝 ${roleName}:`);
        perms.forEach(p => {
          console.log(`      • ${p.permissionName} (${p.category})`);
        });
      });
    }

    // Get user role assignments
    const userRolesList = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        userName: users.firstName,
        roleName: roles.name,
        roleDisplay: roles.displayName,
        isSuperAdmin: roles.isSuperAdmin,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(userRoles.roleId, roles.id));

    console.log('\n👥 User Role Assignments:');
    console.log('=========================');
    if (userRolesList.length === 0) {
      console.log('❌ No user-role assignments found');
    } else {
      const userMap = new Map();
      userRolesList.forEach(ur => {
        if (!userMap.has(ur.userEmail)) {
          userMap.set(ur.userEmail, []);
        }
        userMap.get(ur.userEmail).push(ur);
      });

      userMap.forEach((roles, userEmail) => {
        console.log(`\n   👤 ${userEmail}:`);
        roles.forEach(r => {
          console.log(`      • ${r.roleName} ${r.isSuperAdmin ? '(SUPER ADMIN)' : ''}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing permissions:', error);
  }
  
  process.exit(0);
}

analyzePermissions();