import express from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects, clients, projectTasks, productionTasks } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/projects - Get all projects with client and job counts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        clientId: projects.clientId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.name,
        clientCompany: clients.company,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(projects.createdAt));

    // Get job counts for each project
    const projectsWithJobCounts = await Promise.all(
      allProjects.map(async (project) => {
        const jobCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(projectTasks)
          .where(eq(projectTasks.projectId, project.id));

        const completedJobCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(projectTasks)
          .innerJoin(productionTasks, eq(projectTasks.taskId, productionTasks.id))
          .where(
            sql`${projectTasks.projectId} = ${project.id} AND ${productionTasks.status} = 'completed'`
          );

        return {
          ...project,
          jobCount: jobCount[0]?.count || 0,
          completedJobCount: completedJobCount[0]?.count || 0,
          progress: jobCount[0]?.count > 0 
            ? Math.round(((completedJobCount[0]?.count || 0) / jobCount[0].count) * 100)
            : 0,
          client: project.clientName ? {
            id: project.clientId,
            name: project.clientName,
            company: project.clientCompany
          } : null
        };
      })
    );

    res.json(projectsWithJobCounts);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get a specific project with full details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const project = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        clientId: projects.clientId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: clients.name,
        clientCompany: clients.company,
        clientEmail: clients.email,
        clientPhone: clients.phone,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all jobs/tasks for this project
    const jobs = await db
      .select({
        id: productionTasks.id,
        title: productionTasks.title,
        description: productionTasks.description,
        status: productionTasks.status,
        priority: productionTasks.priority,
        assignedToId: productionTasks.assignedToId,
        createdAt: productionTasks.createdAt,
        updatedAt: productionTasks.updatedAt,
      })
      .from(projectTasks)
      .innerJoin(productionTasks, eq(projectTasks.taskId, productionTasks.id))
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(desc(productionTasks.createdAt));

    const projectWithDetails = {
      ...project[0],
      client: project[0].clientName ? {
        id: project[0].clientId,
        name: project[0].clientName,
        company: project[0].clientCompany,
        email: project[0].clientEmail,
        phone: project[0].clientPhone,
      } : null,
      jobs: jobs,
      jobCount: jobs.length,
      completedJobCount: jobs.filter(job => job.status === 'completed').length,
      progress: jobs.length > 0 
        ? Math.round((jobs.filter(job => job.status === 'completed').length / jobs.length) * 100)
        : 0
    };

    res.json(projectWithDetails);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create a new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, status, clientId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const newProject = await db
      .insert(projects)
      .values({
        name,
        description: description || null,
        status: status || 'active',
        clientId: clientId || null,
      })
      .returning();

    res.status(201).json(newProject[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { name, description, status, clientId } = req.body;

    const updatedProject = await db
      .update(projects)
      .set({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        status: status || undefined,
        clientId: clientId !== undefined ? clientId : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (updatedProject.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(updatedProject[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const deletedProject = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning({ id: projects.id });

    if (deletedProject.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
