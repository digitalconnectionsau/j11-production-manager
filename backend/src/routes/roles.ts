import express from 'express';
import { db } from '../db/index.js';
import { roles, permissions, rolePermissions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { verifyTokenAndPermission, type AuthenticatedRequest } from '../middleware/permissions.js';

const router = express.Router();

// GET /api/roles - Get all roles
router.get('/', verifyTokenAndPermission('view_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const rolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        displayName: roles.displayName,
        description: roles.description,
        isSuperAdmin: roles.isSuperAdmin,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .orderBy(desc(roles.createdAt));

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      rolesList.map(async (role) => {
        const rolePermissionsList = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            displayName: permissions.displayName,
            category: permissions.category,
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, role.id));

        return {
          ...role,
          permissions: rolePermissionsList,
        };
      })
    );

    res.json(rolesWithPermissions);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/roles/:id - Get role by ID
router.get('/:id', verifyTokenAndPermission('view_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const role = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    
    if (!role.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Get permissions for this role
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        displayName: permissions.displayName,
        category: permissions.category,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    res.json({
      ...role[0],
      permissions: rolePermissionsList,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /api/roles - Create new role
router.post('/', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, displayName, description, permissionIds = [] } = req.body;

    // Validate required fields
    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and display name are required' });
    }

    // Check if role name already exists
    const existingRole = await db.select().from(roles).where(eq(roles.name, name));
    if (existingRole.length > 0) {
      return res.status(400).json({ error: 'Role name already exists' });
    }

    // Create role
    const newRole = await db
      .insert(roles)
      .values({
        name,
        displayName,
        description,
        isSuperAdmin: false,
      })
      .returning();

    const roleId = newRole[0].id;

    // Assign permissions
    if (permissionIds.length > 0) {
      const rolePermissionData = permissionIds.map((permissionId: number) => ({
        roleId,
        permissionId,
      }));
      
      await db.insert(rolePermissions).values(rolePermissionData);
    }

    // Get created role with permissions
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        displayName: permissions.displayName,
        category: permissions.category,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    res.status(201).json({
      ...newRole[0],
      permissions: rolePermissionsList,
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/roles/:id - Update role
router.put('/:id', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, displayName, description, permissionIds = [] } = req.body;

    // Check if role exists
    const existingRole = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!existingRole.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Check if role name is taken by another role
    if (name && name !== existingRole[0].name) {
      const nameExists = await db.select().from(roles).where(eq(roles.name, name));
      if (nameExists.length > 0) {
        return res.status(400).json({ error: 'Role name already exists' });
      }
    }

    // Update role
    await db
      .update(roles)
      .set({
        name,
        displayName,
        description,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId));

    // Update permissions
    if (permissionIds !== undefined) {
      // Remove existing permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map((permissionId: number) => ({
          roleId,
          permissionId,
        }));
        
        await db.insert(rolePermissions).values(rolePermissionData);
      }
    }

    // Get updated role with permissions
    const updatedRole = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        displayName: permissions.displayName,
        category: permissions.category,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    res.json({
      ...updatedRole[0],
      permissions: rolePermissionsList,
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/roles/:id - Delete role
router.delete('/:id', verifyTokenAndPermission('manage_users'), async (req: AuthenticatedRequest, res) => {
  try {
    const roleId = parseInt(req.params.id);

    // Check if role exists
    const existingRole = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!existingRole.length) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent deletion of super admin role
    if (existingRole[0].isSuperAdmin) {
      return res.status(400).json({ error: 'Cannot delete super admin role' });
    }

    // Delete role (this will cascade to role_permissions due to foreign key)
    await db.delete(roles).where(eq(roles.id, roleId));

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export default router;