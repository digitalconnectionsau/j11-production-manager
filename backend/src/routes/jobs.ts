import { Router } from 'express';
import { db } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { jobs, projects, clients, jobStatuses } from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const allJobs = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
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
        projectName: projects.name,
        clientName: clients.name,
        statusInfo: {
          id: jobStatuses.id,
          name: jobStatuses.name,
          displayName: jobStatuses.displayName,
          color: jobStatuses.color,
          backgroundColor: jobStatuses.backgroundColor,
          isDefault: jobStatuses.isDefault,
          isFinal: jobStatuses.isFinal,
        },
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(jobStatuses, eq(jobs.statusId, jobStatuses.id))
      .orderBy(desc(jobs.createdAt));

    res.json(allJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    const job = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
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
        projectName: projects.name,
        clientName: clients.name,
        statusInfo: {
          id: jobStatuses.id,
          name: jobStatuses.name,
          displayName: jobStatuses.displayName,
          color: jobStatuses.color,
          backgroundColor: jobStatuses.backgroundColor,
          isDefault: jobStatuses.isDefault,
          isFinal: jobStatuses.isFinal,
        },
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(jobStatuses, eq(jobs.statusId, jobStatuses.id))
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create new job
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { 
      projectId, 
      unit, 
      type, 
      items, 
      nestingDate, 
      machiningDate, 
      assemblyDate, 
      deliveryDate, 
      status = 'not-assigned', 
      comments 
    } = req.body;

    if (!projectId || !items) {
      return res.status(400).json({ error: 'Project ID and items are required' });
    }

    const [newJob] = await db
      .insert(jobs)
      .values({
        projectId,
        unit,
        type,
        items,
        nestingDate,
        machiningDate,
        assemblyDate,
        deliveryDate,
        statusId: status || 1, // Convert status to statusId, default to 1
        comments,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { 
      unit, 
      type, 
      items, 
      nestingDate, 
      machiningDate, 
      assemblyDate, 
      deliveryDate, 
      status, 
      statusId,
      comments 
    } = req.body;

    const [updatedJob] = await db
      .update(jobs)
      .set({
        unit,
        type,
        items,
        nestingDate,
        machiningDate,
        assemblyDate,
        deliveryDate,
        status,
        statusId,
        comments,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    if (!updatedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);

    const [deletedJob] = await db
      .delete(jobs)
      .where(eq(jobs.id, jobId))
      .returning();

    if (!deletedJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
