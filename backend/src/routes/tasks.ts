import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import db from '../db/index.js';
import { productionTasks, users, type ProductionTask, type NewProductionTask } from '../db/schema.js';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedToId: z.number().positive().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedToId: z.number().positive().optional(),
});

// GET /api/tasks - Get all tasks with user details
router.get('/', async (req, res) => {
  try {
    const tasks = await db.select({
      id: productionTasks.id,
      title: productionTasks.title,
      description: productionTasks.description,
      status: productionTasks.status,
      priority: productionTasks.priority,
      createdAt: productionTasks.createdAt,
      updatedAt: productionTasks.updatedAt,
      assignedTo: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      }
    })
    .from(productionTasks)
    .leftJoin(users, eq(productionTasks.assignedToId, users.id))
    .orderBy(desc(productionTasks.createdAt));
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await db.select({
      id: productionTasks.id,
      title: productionTasks.title,
      description: productionTasks.description,
      status: productionTasks.status,
      priority: productionTasks.priority,
      createdAt: productionTasks.createdAt,
      updatedAt: productionTasks.updatedAt,
      assignedTo: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      }
    })
    .from(productionTasks)
    .leftJoin(users, eq(productionTasks.assignedToId, users.id))
    .where(eq(productionTasks.id, taskId))
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

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
  try {
    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const newTask: NewProductionTask = validation.data;
    const createdTask = await db.insert(productionTasks).values(newTask).returning();

    res.status(201).json(createdTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
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

    const updatedTask = await db.update(productionTasks)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(productionTasks.id, taskId))
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

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const deletedTask = await db.delete(productionTasks)
      .where(eq(productionTasks.id, taskId))
      .returning({ id: productionTasks.id });

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
