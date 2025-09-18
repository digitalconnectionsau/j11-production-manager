import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/index.js';
import { users, roles, permissions, userRoles, rolePermissions } from '../db/schema.js';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Extend Express Request type to include user
interface AuthenticatedRequest extends express.Request {
  user?: any;
}

// Middleware to verify JWT token and check permissions
const verifyTokenAndPermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      // Get user with permissions
      const userWithPermissions = await getUserWithPermissions(decoded.userId);
      if (!userWithPermissions) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!userWithPermissions.isActive || userWithPermissions.isBlocked) {
        return res.status(401).json({ error: 'User account is inactive or blocked' });
      }

      // Check if user has required permission
      const hasPermission = userWithPermissions.permissions.some(
        (p: any) => p.name === requiredPermission
      );

      if (!hasPermission && !userWithPermissions.isSuperAdmin) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = userWithPermissions;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

// Helper function to get user with all permissions
async function getUserWithPermissions(userId: number) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) return null;

  // Get user's roles
  const userRolesList = await db
    .select({
      roleId: userRoles.roleId,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      isSuperAdmin: roles.isSuperAdmin,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  // Get all permissions for user's roles
  const userPermissions = await db
    .select({
      id: permissions.id,
      name: permissions.name,
      displayName: permissions.displayName,
      category: permissions.category,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
    .where(eq(userRoles.userId, userId));

  const isSuperAdmin = userRolesList.some(role => role.isSuperAdmin);

  return {
    ...user[0],
    roles: userRolesList,
    permissions: userPermissions,
    isSuperAdmin,
  };
}

// GET /api/users - Get all users with pagination and search
router.get('/', verifyTokenAndPermission('view_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20, search = '', department = '', role = '', status = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereCondition: any = undefined;
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.username, `%${search}%`)
        )
      );
    }

    // Department filter
    if (department) {
      conditions.push(eq(users.department, department as string));
    }

    // Role filter
    if (role) {
      conditions.push(eq(users.role, role as string));
    }

    // Status filter
    if (status === 'active') {
      conditions.push(and(eq(users.isActive, true), eq(users.isBlocked, false)));
    } else if (status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    } else if (status === 'blocked') {
      conditions.push(eq(users.isBlocked, true));
    }

    if (conditions.length > 0) {
      whereCondition = and(...conditions);
    }

    // Get users with pagination
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        mobile: users.mobile,
        department: users.department,
        position: users.position,
        phone: users.phone,
        isActive: users.isActive,
        isBlocked: users.isBlocked,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(desc(users.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: users.id })
      .from(users)
      .where(whereCondition);
    
    const totalCount = totalCountResult.length;

    // Get user roles for each user
    const usersWithRoles = await Promise.all(
      usersList.map(async (user) => {
        const userRolesList = await db
          .select({
            roleId: userRoles.roleId,
            roleName: roles.name,
            roleDisplayName: roles.displayName,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, user.id));

        return {
          ...user,
          roles: userRolesList,
        };
      })
    );

    res.json({
      users: usersWithRoles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', verifyTokenAndPermission('view_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userWithPermissions = await getUserWithPermissions(userId);
    
    if (!userWithPermissions) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = userWithPermissions;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user
router.post('/', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      email,
      username,
      firstName,
      lastName,
      password,
      mobile,
      department,
      position,
      phone,
      roleIds = [],
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        mobile,
        department,
        position,
        phone,
        isActive: true,
        isBlocked: false,
      })
      .returning();

    const userId = newUser[0].id;

    // Assign roles
    if (roleIds.length > 0) {
      const userRoleData = roleIds.map((roleId: number) => ({
        userId,
        roleId,
        assignedBy: req.user.id,
      }));
      
      await db.insert(userRoles).values(userRoleData);
    }

    // Get created user with roles
    const createdUser = await getUserWithPermissions(userId);
    const { password: _, ...userWithoutPassword } = createdUser!;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const {
      email,
      username,
      firstName,
      lastName,
      mobile,
      department,
      position,
      phone,
      isActive,
      isBlocked,
      roleIds = [],
    } = req.body;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is taken by another user
    if (email && email !== existingUser[0].email) {
      const emailExists = await db.select().from(users).where(eq(users.email, email));
      if (emailExists.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Update user
    await db
      .update(users)
      .set({
        email,
        username,
        firstName,
        lastName,
        mobile,
        department,
        position,
        phone,
        isActive,
        isBlocked,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update roles
    if (roleIds !== undefined) {
      // Remove existing roles
      await db.delete(userRoles).where(eq(userRoles.userId, userId));

      // Add new roles
      if (roleIds.length > 0) {
        const userRoleData = roleIds.map((roleId: number) => ({
          userId,
          roleId,
          assignedBy: req.user.id,
        }));
        
        await db.insert(userRoles).values(userRoleData);
      }
    }

    // Get updated user with roles
    const updatedUser = await getUserWithPermissions(userId);
    const { password, ...userWithoutPassword } = updatedUser!;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/users/:id/password - Change user password
router.put('/:id/password', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// DELETE /api/users/:id - Delete user (soft delete by setting inactive)
router.delete('/:id', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete by setting inactive
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/users/roles - Get all available roles
router.get('/roles/list', verifyTokenAndPermission('view_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const rolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        displayName: roles.displayName,
        description: roles.description,
        isSuperAdmin: roles.isSuperAdmin,
      })
      .from(roles)
      .orderBy(roles.displayName);

    res.json(rolesList);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/users/permissions - Get all available permissions
router.get('/permissions/list', verifyTokenAndPermission('view_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const permissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        displayName: permissions.displayName,
        description: permissions.description,
        category: permissions.category,
      })
      .from(permissions)
      .orderBy(permissions.category, permissions.displayName);

    // Group by category
    const groupedPermissions = permissionsList.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    res.json(groupedPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

export default router;
