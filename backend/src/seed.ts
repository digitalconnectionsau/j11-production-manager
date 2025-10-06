import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import db from './db/index.js';
import { users, roles, userRoles } from './db/schema.js';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

async function seedAdminUser() {
  try {
    console.log('🔗 Using DATABASE_URL:', process.env.DATABASE_URL);
    
    const adminEmail = 'admin@j11productions.com';
    const adminPassword = 'j11!@#$';
    
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // Create admin user
    const adminUser = await db.insert(users).values({
      firstName: 'J11',
      lastName: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      username: 'j11-admin',
      role: 'admin',
    }).returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    });
    
    console.log('✅ Admin user created successfully:', adminUser[0]);
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    
    // Assign super_admin role to the admin user
    const superAdminRole = await db.select()
      .from(roles)
      .where(eq(roles.name, 'super_admin'))
      .limit(1);
    
    if (superAdminRole.length > 0) {
      // Check if user already has the role
      const existingRole = await db.select()
        .from(userRoles)
        .where(eq(userRoles.userId, adminUser[0].id))
        .limit(1);
      
      if (existingRole.length === 0) {
        await db.insert(userRoles).values({
          userId: adminUser[0].id,
          roleId: superAdminRole[0].id,
          assignedBy: adminUser[0].id, // Self-assigned
        });
        console.log('✅ Super admin role assigned to admin user');
      } else {
        console.log('✅ Admin user already has roles assigned');
      }
    } else {
      console.log('⚠️  Super admin role not found. Please run database migrations first.');
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Run seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedAdminUser();
  process.exit(0);
}

export { seedAdminUser };
