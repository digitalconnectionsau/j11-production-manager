import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users, roles, permissions, userRoles, rolePermissions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends express.Request {
  user?: any;
}

// Helper function to get user with all permissions
export async function getUserWithPermissions(userId: number) {
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

// Middleware to verify JWT token and check permissions
export const verifyTokenAndPermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      // Get user with permissions
      const userWithPermissions = await getUserWithPermissions(decoded.id);
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