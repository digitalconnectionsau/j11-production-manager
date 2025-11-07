import { Router } from 'express';
import bcrypt from 'bcrypt';
import { eq, or, and, gt } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/index.js';
import { users, passwordResetTokens } from '../db/schema.js';
import { generateToken, authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import { 
  logAuthActivity, 
  AuthAction, 
  LoginFailureReason,
  getClientIp,
  getUserAgent
} from '../services/authActivityService.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().min(1).max(255), // Changed from email() to allow username
  password: z.string().min(1),
});

// Password validation: min 8 chars, at least one uppercase, one lowercase, one number, one special char
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(255)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100), 
  email: z.string().email().max(255),
  password: passwordSchema,
  username: z.string().min(1).max(100).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// POST /api/auth/login - User login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.errors;
      let message = 'Please check your input';
      
      // Provide specific validation feedback
      if (errors.find(e => e.path[0] === 'email')) {
        message = 'Please enter a valid email address or username';
      }
      if (errors.find(e => e.path[0] === 'password')) {
        message = 'Password is required';
      }
      
      return res.status(400).json({ 
        error: message,
        field: errors[0]?.path[0], // Which field has the error
        details: validation.error.errors 
      });
    }

    const { email, password } = validation.data;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

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
      // Log failed login attempt
      await logAuthActivity({
        email,
        action: AuthAction.LOGIN_FAILED,
        failureReason: LoginFailureReason.USER_NOT_FOUND,
        ipAddress,
        userAgent,
      });
      
      return res.status(401).json({ 
        error: 'No account found with this email or username',
        suggestion: 'Please check your email/username or create a new account'
      });
    }

    const foundUser = user[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await logAuthActivity({
        userId: foundUser.id,
        email: foundUser.email,
        action: AuthAction.LOGIN_FAILED,
        failureReason: LoginFailureReason.WRONG_PASSWORD,
        ipAddress,
        userAgent,
      });
      
      return res.status(401).json({ 
        error: 'Incorrect password',
        suggestion: 'Please check your password or use "Forgot Password" to reset it'
      });
    }

    // Check if user account is blocked or inactive
    if (foundUser.isBlocked) {
      // Log blocked account attempt
      await logAuthActivity({
        userId: foundUser.id,
        email: foundUser.email,
        action: AuthAction.LOGIN_FAILED,
        failureReason: LoginFailureReason.ACCOUNT_BLOCKED,
        ipAddress,
        userAgent,
      });
      
      return res.status(403).json({ 
        error: 'Account blocked',
        message: 'Your account has been blocked due to security reasons. Please contact an administrator.',
        contactInfo: 'Contact support for account recovery'
      });
    }

    if (!foundUser.isActive) {
      // Log inactive account attempt
      await logAuthActivity({
        userId: foundUser.id,
        email: foundUser.email,
        action: AuthAction.LOGIN_FAILED,
        failureReason: LoginFailureReason.ACCOUNT_INACTIVE,
        ipAddress,
        userAgent,
      });
      
      return res.status(403).json({ 
        error: 'Account inactive',
        message: 'Your account is currently inactive. Please contact an administrator to activate your account.',
        contactInfo: 'Contact support for account activation'
      });
    }

    // Generate JWT token
    const fullName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username || foundUser.email;
    const token = generateToken({
      id: foundUser.id,
      email: foundUser.email,
      name: fullName,
    });

    // Log successful login
    await logAuthActivity({
      userId: foundUser.id,
      email: foundUser.email,
      action: AuthAction.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
    });

    // Update last login timestamp
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, foundUser.id));

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
router.post('/register', authLimiter, async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.errors;
      const fieldErrors: { [key: string]: string } = {};
      
      // Create user-friendly error messages for each field
      errors.forEach(error => {
        const field = error.path[0] as string;
        switch (field) {
          case 'firstName':
            fieldErrors[field] = 'First name is required';
            break;
          case 'lastName':
            fieldErrors[field] = 'Last name is required';
            break;
          case 'email':
            fieldErrors[field] = error.code === 'invalid_string' 
              ? 'Please enter a valid email address' 
              : 'Email is required';
            break;
          case 'password':
            fieldErrors[field] = 'Password must be at least 6 characters long';
            break;
          case 'username':
            fieldErrors[field] = 'Username is required';
            break;
          default:
            fieldErrors[field] = error.message;
        }
      });
      
      return res.status(400).json({ 
        error: 'Please check the following fields',
        fieldErrors,
        details: validation.error.errors 
      });
    }

    const { firstName, lastName, email, password, username } = validation.data;

    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        error: 'Email already registered',
        message: 'An account with this email address already exists. Please use a different email or try logging in.',
        suggestion: 'Try logging in or use the "Forgot Password" feature'
      });
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUsername.length > 0) {
        return res.status(409).json({ 
          error: 'Username already taken',
          message: 'This username is already in use. Please choose a different username.',
          field: 'username'
        });
      }
    }

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
      message: 'Registration successful! Welcome to J11 Production Manager.',
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
    
    // Handle database constraint errors
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint?.includes('email')) {
        return res.status(409).json({ 
          error: 'Email already registered',
          message: 'An account with this email address already exists.',
          field: 'email'
        });
      }
      if (error.constraint?.includes('username')) {
        return res.status(409).json({ 
          error: 'Username already taken',
          message: 'This username is already in use.',
          field: 'username'
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'Unable to create account. Please try again later.'
    });
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
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      email: foundUser.email,
      username: foundUser.username,
      role: foundUser.role,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile - Update current user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { firstName, lastName, username, mobile, department, position, phone } = req.body;

    // Validate that at least one field is provided
    if (!firstName && !lastName && !username && !mobile && !department && !position && !phone) {
      return res.status(400).json({ error: 'At least one field must be provided for update' });
    }

    // Check if username is already taken (if provided and different from current)
    if (username) {
      const existingUser = await db.select()
        .from(users)
        .where(and(eq(users.username, username), eq(users.id, req.user.id)))
        .limit(1);
      
      if (existingUser.length === 0) {
        const usernameExists = await db.select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        if (usernameExists.length > 0) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }
    }

    // Update user profile
    const updatedUser = await db
      .update(users)
      .set({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: username || undefined,
        mobile: mobile || undefined,
        department: department || undefined,
        position: position || undefined,
        phone: phone || undefined,
      })
      .where(eq(users.id, req.user.id))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        username: users.username,
        mobile: users.mobile,
        department: users.department,
        position: users.position,
        phone: users.phone,
      });

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = updatedUser[0];
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: fullName,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        department: user.department,
        position: user.position,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/logout - User logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    console.log('🔐 Password reset request received for:', req.body?.email);
    
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      const errors = validation.error.errors;
      const emailError = errors.find(e => e.path[0] === 'email');
      
      let message = 'Please provide a valid email address';
      if (emailError?.code === 'invalid_string') {
        message = 'Please enter a valid email address format (e.g., user@example.com)';
      }
      
      return res.status(400).json({ 
        error: message,
        field: 'email',
        details: validation.error.errors 
      });
    }

    const { email } = validation.data;
    console.log('✅ Email validation passed for:', email);

    // Find user by email
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    console.log(`📊 Database query completed, found ${user.length} users`);

    // Always return success to prevent email enumeration
    if (user.length === 0) {
      console.log('⚠️ User not found for email:', email);
      return res.json({ 
        message: 'If an account with that email exists, password reset instructions have been sent.',
        info: 'Please check your email (including spam folder) for reset instructions.'
      });
    }

    const foundUser = user[0];
    console.log('👤 User found:', foundUser.username || foundUser.email);
    
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Check if user account is active
    if (foundUser.isBlocked) {
      return res.status(403).json({
        error: 'Account blocked',
        message: 'Your account has been blocked. Please contact an administrator for assistance.',
        contactInfo: 'Contact support for account recovery'
      });
    }

    if (!foundUser.isActive) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is currently inactive. Please contact an administrator.',
        contactInfo: 'Contact support for account activation'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    console.log('🔑 Reset token generated, inserting into database...');

    // Store reset token in database
    await db.insert(passwordResetTokens).values({
      userId: foundUser.id,
      token: resetToken,
      expiresAt,
      used: false,
    });

    console.log('✅ Reset token stored in database');

    // Send password reset email
    const userName = `${foundUser.firstName || ''} ${foundUser.lastName || ''}`.trim() || foundUser.username || 'User';
    console.log('📧 Attempting to send email to:', email);
    
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log(`✅ Password reset email sent to ${email} for user: ${userName}`);
      
      // Log password reset request
      await logAuthActivity({
        userId: foundUser.id,
        email: foundUser.email,
        action: AuthAction.PASSWORD_RESET_REQUEST,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('❌ Failed to send password reset email to:', email, error);
      return res.status(500).json({ 
        error: 'Email delivery failed',
        message: 'Unable to send reset email at this time. Please try again in a few minutes.',
        suggestion: 'If the problem persists, please contact support'
      });
    }

    res.json({ 
      message: 'Password reset instructions have been sent to your email address.',
      info: 'Please check your email (including spam folder) and follow the instructions to reset your password.',
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('❌ Error in forgot-password:', error);
    res.status(500).json({ 
      error: 'Request failed',
      message: 'Unable to process password reset request. Please try again later.'
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      const errors = validation.error.errors;
      const tokenError = errors.find(e => e.path[0] === 'token');
      const passwordError = errors.find(e => e.path[0] === 'password');
      
      let message = 'Invalid request data';
      let field = 'general';
      
      if (tokenError) {
        message = 'Reset token is required and must be valid';
        field = 'token';
      } else if (passwordError) {
        message = 'Password must be at least 6 characters long';
        field = 'password';
      }
      
      return res.status(400).json({ 
        error: message,
        field,
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
      // Check if token exists but is expired or used
      const tokenCheck = await db.select({
        used: passwordResetTokens.used,
        expiresAt: passwordResetTokens.expiresAt
      })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);

      if (tokenCheck.length > 0) {
        const tokenInfo = tokenCheck[0];
        if (tokenInfo.used) {
          return res.status(400).json({ 
            error: 'Reset link already used',
            message: 'This reset link has already been used. Each link can only be used once.',
            field: 'token',
            suggestion: 'If you need to reset your password again, please request a new reset link'
          });
        } else if (new Date() > tokenInfo.expiresAt) {
          return res.status(400).json({ 
            error: 'Reset link expired',
            message: 'This reset link has expired. Reset links are valid for 1 hour.',
            field: 'token',
            suggestion: 'Please request a new password reset link'
          });
        }
      }
      
      return res.status(400).json({ 
        error: 'Invalid reset link',
        message: 'This reset link is not valid. Please request a new password reset.',
        field: 'token',
        suggestion: 'Click "Forgot Password" to get a new reset link'
      });
    }

    const { password_reset_tokens: resetToken, users: user } = resetRecord[0];

    // Check user account status
    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Account blocked',
        message: 'Your account has been blocked. Please contact an administrator for assistance.',
        contactInfo: 'Contact support for account recovery'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is currently inactive. Please contact an administrator.',
        contactInfo: 'Contact support for account activation'
      });
    }

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

    // Log successful password reset
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);
    await logAuthActivity({
      userId: user.id,
      email: user.email,
      action: AuthAction.PASSWORD_RESET_SUCCESS,
      ipAddress,
      userAgent,
    });

    res.json({ 
      message: 'Password has been reset successfully!',
      info: 'You can now log in with your new password.',
      redirectTo: '/login'
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ 
      error: 'Password reset failed',
      message: 'Unable to reset password at this time. Please try again or request a new reset link.'
    });
  }
});

// POST /api/auth/request-password-reset - Alias for forgot-password (backward compatibility)
router.post('/request-password-reset', async (req, res) => {
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
    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log(`✅ Password reset email sent to ${email} for user: ${userName}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email to:', email, error);
      return res.status(500).json({ 
        error: 'Failed to send reset email. Please try again later.' 
      });
    }

    res.json({ 
      message: 'Password reset instructions have been sent to your email address.' 
    });
  } catch (error) {
    console.error('❌ Error in request-password-reset:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

export default router;
