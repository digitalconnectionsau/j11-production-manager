import { Router } from 'express';
import { db } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { productionTasks, projectTasks, projects, users } from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all jobs/tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await db
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
      .from(productionTasks)
      .orderBy(desc(productionTasks.createdAt));

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single job/task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const task = await db
      .select({
        id: productionTasks.id,
        title: productionTasks.title,
        description: productionTasks.description,
        status: productionTasks.status,
        priority: productionTasks.priority,
        assignedToId: productionTasks.assignedToId,
        createdAt: productionTasks.createdAt,
        updatedAt: productionTasks.updatedAt,
        assignedToFirstName: users.firstName,
        assignedToLastName: users.lastName,
        assignedToEmail: users.email,
      })
      .from(productionTasks)
      .leftJoin(users, eq(productionTasks.assignedToId, users.id))
      .where(eq(productionTasks.id, taskId))
      .limit(1);

    if (task.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get project information for this task
    const projectInfo = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
      })
      .from(projectTasks)
      .innerJoin(projects, eq(projectTasks.projectId, projects.id))
      .where(eq(projectTasks.taskId, taskId))
      .limit(1);

    const taskWithDetails = {
      ...task[0],
      assignedTo: task[0].assignedToFirstName || task[0].assignedToLastName ? {
        id: task[0].assignedToId,
        name: `${task[0].assignedToFirstName || ''} ${task[0].assignedToLastName || ''}`.trim(),
        email: task[0].assignedToEmail,
      } : null,
      project: projectInfo.length > 0 ? {
        id: projectInfo[0].projectId,
        name: projectInfo[0].projectName,
      } : null,
    };

    // Remove the flattened fields
    const { assignedToFirstName, assignedToLastName, assignedToEmail, ...cleanTask } = taskWithDetails;

    res.json(cleanTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new job/task
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, status = 'pending', priority = 'medium', assignedToId, projectId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [newTask] = await db
      .insert(productionTasks)
      .values({
        title,
        description,
        status,
        priority,
        assignedToId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // If projectId is provided, link the task to the project
    if (projectId) {
      await db
        .insert(projectTasks)
        .values({
          projectId,
          taskId: newTask.id,
        });
    }

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update job/task
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, status, priority, assignedToId } = req.body;

    const [updatedTask] = await db
      .update(productionTasks)
      .set({
        title,
        description,
        status,
        priority,
        assignedToId,
        updatedAt: new Date(),
      })
      .where(eq(productionTasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete job/task
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const taskId = parseInt(req.params.id);

    // First remove any project associations
    await db
      .delete(projectTasks)
      .where(eq(projectTasks.taskId, taskId));

    // Then delete the task
    const [deletedTask] = await db
      .delete(productionTasks)
      .where(eq(productionTasks.id, taskId))
      .returning();

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
