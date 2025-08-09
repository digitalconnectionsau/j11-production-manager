import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, or, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/index.js';
import { users, passwordResetTokens } from '../db/schema.js';
import { generateToken, authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

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

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(255),
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

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address',
        details: validation.error.errors 
      });
    }

    const { email } = validation.data;

    // Find user by email
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (user.length === 0) {
      return res.json({ 
        message: 'If an account with that email exists, password reset instructions have been sent.' 
      });
    }

    const foundUser = user[0];

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    await db.insert(passwordResetTokens).values({
      userId: foundUser.id,
      token: resetToken,
      expiresAt,
      used: false,
    });

    // Send password reset email
    const userName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username || 'User';
    const emailSent = await sendPasswordResetEmail(email, resetToken, userName);

    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
      return res.status(500).json({ 
        error: 'Failed to send reset email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'Password reset instructions have been sent to your email address.' 
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.errors 
      });
    }

    const { token, password } = validation.data;

    // Find valid reset token
    const resetRecord = await db.select()
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (resetRecord.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }

    const { password_reset_tokens: resetToken, users: user } = resetRecord[0];

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    // Mark reset token as used
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    res.json({ 
      message: 'Password has been successfully reset. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
