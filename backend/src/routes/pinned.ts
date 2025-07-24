import { Router } from 'express';
import { db } from '../db/index.js';
import { eq, and, desc, asc } from 'drizzle-orm';
import { pinnedProjects, projects, clients } from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get pinned projects for the current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const pinned = await db
      .select({
        id: pinnedProjects.id,
        projectId: pinnedProjects.projectId,
        order: pinnedProjects.order,
        createdAt: pinnedProjects.createdAt,
        projectName: projects.name,
        projectDescription: projects.description,
        projectStatus: projects.status,
        projectClientId: projects.clientId,
        clientName: clients.name,
        clientCompany: clients.company,
      })
      .from(pinnedProjects)
      .innerJoin(projects, eq(pinnedProjects.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(pinnedProjects.userId, userId))
      .orderBy(asc(pinnedProjects.order));

    // Transform the data to match frontend expectations
    const pinnedProjectsData = pinned.map(item => ({
      id: item.id,
      projectId: item.projectId,
      order: item.order,
      createdAt: item.createdAt,
      project: {
        id: item.projectId,
        name: item.projectName,
        description: item.projectDescription,
        status: item.projectStatus,
        clientId: item.projectClientId,
        client: item.clientName ? {
          id: item.projectClientId,
          name: item.clientName,
          company: item.clientCompany,
        } : null,
      },
    }));

    res.json(pinnedProjectsData);
  } catch (error) {
    console.error('Error fetching pinned projects:', error);
    res.status(500).json({ error: 'Failed to fetch pinned projects' });
  }
});

// Pin a project
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Check if project is already pinned
    const existing = await db
      .select()
      .from(pinnedProjects)
      .where(and(
        eq(pinnedProjects.userId, userId),
        eq(pinnedProjects.projectId, projectId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Project is already pinned' });
    }

    // Get the highest order number and add 1
    const maxOrder = await db
      .select({ maxOrder: pinnedProjects.order })
      .from(pinnedProjects)
      .where(eq(pinnedProjects.userId, userId))
      .orderBy(desc(pinnedProjects.order))
      .limit(1);

    const newOrder = maxOrder.length > 0 ? (maxOrder[0].maxOrder || 0) + 1 : 1;

    // Create new pinned project
    const [newPinned] = await db
      .insert(pinnedProjects)
      .values({
        projectId,
        userId,
        order: newOrder,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json(newPinned);
  } catch (error) {
    console.error('Error pinning project:', error);
    res.status(500).json({ error: 'Failed to pin project' });
  }
});

// Unpin a project
router.delete('/:projectId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const projectId = parseInt(req.params.projectId);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [deleted] = await db
      .delete(pinnedProjects)
      .where(and(
        eq(pinnedProjects.userId, userId),
        eq(pinnedProjects.projectId, projectId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Pinned project not found' });
    }

    res.json({ message: 'Project unpinned successfully' });
  } catch (error) {
    console.error('Error unpinning project:', error);
    res.status(500).json({ error: 'Failed to unpin project' });
  }
});

// Update pinned projects order
router.put('/reorder', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { pinnedProjectsOrder } = req.body; // Array of { id, order } objects

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!Array.isArray(pinnedProjectsOrder)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Update each pinned project's order
    const updates = pinnedProjectsOrder.map(async (item: { id: number; order: number }) => {
      return db
        .update(pinnedProjects)
        .set({ order: item.order })
        .where(and(
          eq(pinnedProjects.id, item.id),
          eq(pinnedProjects.userId, userId)
        ));
    });

    await Promise.all(updates);

    res.json({ message: 'Pinned projects order updated successfully' });
  } catch (error) {
    console.error('Error updating pinned projects order:', error);
    res.status(500).json({ error: 'Failed to update pinned projects order' });
  }
});

export default router;
