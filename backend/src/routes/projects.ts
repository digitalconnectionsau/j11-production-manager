import express from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects, clients, jobs, jobStatuses } from '../db/schema.js';
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
          .from(jobs)
          .where(eq(jobs.projectId, project.id));

        const completedJobCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(
            sql`${jobs.projectId} = ${project.id} AND ${jobs.status} IN ('nesting-complete', 'machining-complete', 'assembly-complete', 'delivered')`
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

    // Get all jobs for this project
    const projectJobs = await db
      .select({
        id: jobs.id,
        unit: jobs.unit,
        type: jobs.type,
        items: jobs.items,
        nestingDate: jobs.nestingDate,
        machiningDate: jobs.machiningDate,
        assemblyDate: jobs.assemblyDate,
        deliveryDate: jobs.deliveryDate,
        status: jobs.status,
        statusId: jobs.statusId,
        comments: jobs.comments,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        statusInfo: {
          id: jobStatuses.id,
          name: jobStatuses.name,
          displayName: jobStatuses.displayName,
          color: jobStatuses.color,
          backgroundColor: jobStatuses.backgroundColor,
          isDefault: jobStatuses.isDefault,
          isFinal: jobStatuses.isFinal,
          targetColumns: jobStatuses.targetColumns,
        },
      })
      .from(jobs)
      .leftJoin(jobStatuses, eq(jobs.statusId, jobStatuses.id))
      .where(eq(jobs.projectId, projectId))
      .orderBy(desc(jobs.createdAt));

    const projectWithDetails = {
      ...project[0],
      client: project[0].clientName ? {
        id: project[0].clientId,
        name: project[0].clientName,
        company: project[0].clientCompany,
        email: project[0].clientEmail,
        phone: project[0].clientPhone,
      } : null,
      jobs: projectJobs,
      jobCount: projectJobs.length,
      completedJobCount: projectJobs.filter(job => 
        ['nesting-complete', 'machining-complete', 'assembly-complete', 'delivered'].includes(job.status || '')
      ).length,
      progress: projectJobs.length > 0 
        ? Math.round((projectJobs.filter(job => 
            ['nesting-complete', 'machining-complete', 'assembly-complete', 'delivered'].includes(job.status || '')
          ).length / projectJobs.length) * 100)
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

// POST /api/projects/:id/jobs - Create a new job for a project
router.post('/:id/jobs', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { unit, type, items, status, nestingDate, machiningDate, assemblyDate, deliveryDate, comments } = req.body;

    if (!items) {
      return res.status(400).json({ error: 'Items field is required' });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Convert status string to statusId if provided
    let statusId = 1; // Default to first status
    if (status) {
      if (typeof status === 'number') {
        statusId = status;
      } else {
        // Look up status by name
        const statusRecord = await db
          .select({ id: jobStatuses.id })
          .from(jobStatuses)
          .where(eq(jobStatuses.name, status))
          .limit(1);
        
        if (statusRecord.length > 0) {
          statusId = statusRecord[0].id;
        }
      }
    }

    const newJob = await db
      .insert(jobs)
      .values({
        projectId,
        unit: unit || null,
        type: type || null,
        items,
        statusId,
        nestingDate: nestingDate || null,
        machiningDate: machiningDate || null,
        assemblyDate: assemblyDate || null,
        deliveryDate: deliveryDate || null,
        comments: comments || null,
      })
      .returning();

    res.status(201).json(newJob[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// POST /api/projects/:id/jobs/bulk - Create multiple jobs for a project
router.post('/:id/jobs/bulk', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { jobs: jobsData } = req.body;

    if (!Array.isArray(jobsData) || jobsData.length === 0) {
      return res.status(400).json({ error: 'Jobs array is required and cannot be empty' });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate all jobs before inserting
    for (const job of jobsData) {
      if (!job.items) {
        return res.status(400).json({ error: 'All jobs must have an items field' });
      }
    }

    const newJobs = await db
      .insert(jobs)
      .values(jobsData.map((job: any) => ({
        projectId,
        unit: job.unit || null,
        type: job.type || null,
        items: job.items,
        statusId: job.status || 1,
        nestingDate: job.nestingDate || null,
        machiningDate: job.machiningDate || null,
        assemblyDate: job.assemblyDate || null,
        deliveryDate: job.deliveryDate || null,
        comments: job.comments || null,
      })))
      .returning();

    res.status(201).json({ 
      message: `Successfully created ${newJobs.length} jobs`,
      created: newJobs.length,
      jobs: newJobs 
    });
  } catch (error) {
    console.error('Error creating bulk jobs:', error);
    res.status(500).json({ error: 'Failed to create jobs' });
  }
});

export default router;
