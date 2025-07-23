import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import db from '../db/index.js';
import { users, type User, type NewUser } from '../db/schema.js';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
      role: users.role,
    }).from(users);
    
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
      role: users.role,
    }).from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const newUser: NewUser = validation.data;
    const createdUser = await db.insert(users).values(newUser).returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
    });

    res.status(201).json(createdUser[0]);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Since the users table doesn't have these columns, let's simplify the response

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const deletedUser = await db.delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (deletedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
