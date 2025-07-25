import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import db from '../db/index.js';
import { users } from '../db/schema.js';
import { generateToken, authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().min(1).max(255), // Changed from email() to allow username
  password: z.string().min(1),
});

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100), 
  email: z.string().email().max(255),
  password: z.string().min(6).max(255),
  username: z.string().min(1).max(100).optional(),
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;

    // Find user by email or username
    const user = await db.select()
      .from(users)
      .where(
        or(
          eq(users.email, email),
          eq(users.username, email)
        )
      )
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const foundUser = user[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const fullName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username || foundUser.email;
    const token = generateToken({
      id: foundUser.id,
      email: foundUser.email,
      name: fullName,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: foundUser.id,
        name: fullName,
        email: foundUser.email,
        role: foundUser.role,
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { firstName, lastName, email, password, username } = validation.data;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.insert(users).values({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      username,
    }).returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
    });

    const createdUser = newUser[0];

    // Generate JWT token
    const fullName = `${createdUser.firstName || ''} ${createdUser.lastName || ''}`.trim() || createdUser.username || createdUser.email;
    const token = generateToken({
      id: createdUser.id,
      email: createdUser.email,
      name: fullName,
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: createdUser.id,
        name: fullName,
        email: createdUser.email,
        username: createdUser.username,
      }
    });
  } catch (error: any) {
    console.error('Error during registration:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
      role: users.role,
    }).from(users).where(eq(users.id, req.user.id)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const foundUser = user[0];
    const fullName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username || foundUser.email;
    
    res.json({
      id: foundUser.id,
      name: fullName,
      email: foundUser.email,
      username: foundUser.username,
      role: foundUser.role,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/auth/logout - User logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;
