import { Router } from 'express';
import { db } from '../db/index.js';
import { jobs, projects, clients, jobStatuses } from '../db/schema.js';
import { eq, desc, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { verifyTokenAndPermission, type AuthenticatedRequest } from '../middleware/permissions.js';

const router = Router();

// Validation schemas - adapted for jobs table
const createTaskSchema = z.object({
  projectId: z.number().positive(),
  items: z.string().min(1).max(255), // Required field in jobs table
  unit: z.string().max(100).optional(),
  type: z.string().max(255).optional(),
  comments: z.string().optional(),
  statusId: z.number().positive().optional(),
  nestingDate: z.string().max(10).optional(),
  machiningDate: z.string().max(10).optional(),
  assemblyDate: z.string().max(10).optional(),
  deliveryDate: z.string().max(10).optional(),
});

const updateTaskSchema = z.object({
  projectId: z.number().positive().optional(),
  items: z.string().min(1).max(255).optional(),
  unit: z.string().max(100).optional(),
  type: z.string().max(255).optional(),
  comments: z.string().optional(),
  statusId: z.number().positive().optional(),
  nestingDate: z.string().max(10).optional(),
  machiningDate: z.string().max(10).optional(),
  assemblyDate: z.string().max(10).optional(),
  deliveryDate: z.string().max(10).optional(),
});

// GET /api/tasks - Get all jobs as tasks
router.get('/', verifyTokenAndPermission('view_jobs'), async (req: AuthenticatedRequest, res) => {
  try {
    const tasks = await db.select({
      id: jobs.id,
      projectId: jobs.projectId,
      unit: jobs.unit,
      type: jobs.type,
      items: jobs.items,
      comments: jobs.comments,
      statusId: jobs.statusId,
      nestingDate: jobs.nestingDate,
      machiningDate: jobs.machiningDate,
      assemblyDate: jobs.assemblyDate,
      deliveryDate: jobs.deliveryDate,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      project: {
        id: projects.id,
        name: projects.name,
      },
      status: {
        id: jobStatuses.id,
        name: jobStatuses.name,
        displayName: jobStatuses.displayName,
        color: jobStatuses.color,
        backgroundColor: jobStatuses.backgroundColor,
      }
    })
    .from(jobs)
    .leftJoin(projects, eq(jobs.projectId, projects.id))
    .leftJoin(jobStatuses, eq(jobs.statusId, jobStatuses.id))
    .orderBy(desc(jobs.createdAt));
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get job by ID as task
router.get('/:id', verifyTokenAndPermission('view_jobs'), async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await db.select({
      id: jobs.id,
      projectId: jobs.projectId,
      unit: jobs.unit,
      type: jobs.type,
      items: jobs.items,
      comments: jobs.comments,
      statusId: jobs.statusId,
      nestingDate: jobs.nestingDate,
      machiningDate: jobs.machiningDate,
      assemblyDate: jobs.assemblyDate,
      deliveryDate: jobs.deliveryDate,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      project: {
        id: projects.id,
        name: projects.name,
      },
      status: {
        id: jobStatuses.id,
        name: jobStatuses.name,
        displayName: jobStatuses.displayName,
        color: jobStatuses.color,
        backgroundColor: jobStatuses.backgroundColor,
      }
    })
    .from(jobs)
    .leftJoin(projects, eq(jobs.projectId, projects.id))
    .leftJoin(jobStatuses, eq(jobs.statusId, jobStatuses.id))
    .where(eq(jobs.id, taskId))
    .limit(1);

    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create new job as task
router.post('/', verifyTokenAndPermission('add_jobs'), async (req: AuthenticatedRequest, res) => {
  try {
    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const newTask = {
      ...validation.data,
      statusId: validation.data.statusId || 1, // Default to first status if not provided
    };
    const createdTask = await db.insert(jobs).values(newTask).returning();

    res.status(201).json(createdTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update job as task
router.put('/:id', verifyTokenAndPermission('edit_jobs'), async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const validation = updateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const updatedTask = await db.update(jobs)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(jobs.id, taskId))
      .returning();

    if (updatedTask.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete job as task
router.delete('/:id', verifyTokenAndPermission('delete_jobs'), async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const deletedTask = await db.delete(jobs)
      .where(eq(jobs.id, taskId))
      .returning({ id: jobs.id });

    if (deletedTask.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
