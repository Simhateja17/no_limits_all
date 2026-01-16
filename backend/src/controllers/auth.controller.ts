import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
} from '../utils/auth.js';
import { UserRole } from '@prisma/client';
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword as resetPasswordService,
} from '../services/password-reset.service.js';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      name,
      role = 'CLIENT',
      storeName,
      storeUrl,
      storeType,
      employeeId,
      department,
      companyName,
      phone,
      address,
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as UserRole,
        employeeId,
        department,
        phone,
        // If role is CLIENT, create associated Client record
        ...(role === 'CLIENT' && {
          client: {
            create: {
              name: name || email.split('@')[0],
              companyName: companyName || name || email.split('@')[0],
              email,
              phone,
              address,
            },
          },
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        client: true,
      },
    });

    // If CLIENT role, automatically create a chat room for them
    if (role === 'CLIENT' && user.client) {
      await prisma.chatRoom.create({
        data: {
          clientId: user.client.id,
          participants: {
            create: {
              userId: user.id,
            },
          },
        },
      });
      console.log(`✅ Chat room automatically created for new client: ${user.email}`);
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        client: user.client,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        client: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {

      res.status(403).json({ error: 'Account is inactive' });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Also set access token as cookie for easier access
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        employeeId: user.employeeId,
        department: user.department,
        client: user.client,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
};

// Refresh access token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        client: true
      }
    });

    if (!user || !user.isActive) {
      // Clear cookies if user doesn't exist or is inactive
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(401).json({ error: 'Account no longer exists or has been deactivated' });
      return;
    }

    // For CLIENT users, verify that the associated client record exists and is active
    if (user.role === 'CLIENT') {
      if (!user.client || !user.client.isActive) {
        // Client record doesn't exist or is deactivated
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(401).json({ error: 'Client account no longer exists or has been deactivated' });
        return;
      }
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set new refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
    });
  } catch (error) {

    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatar: true,
        phone: true,
        employeeId: true,
        department: true,
        createdAt: true,
        lastLoginAt: true,
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            billingStatus: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Change password
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Request password reset (forgot password)
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const result = await requestPasswordReset(email.toLowerCase());

    // In production, you would send an email here with the reset link
    // For now, we return a success message (token is logged server-side)
    if (result.token && process.env.NODE_ENV !== 'production') {
      // Only include token in response for development/testing
      console.log(`[Auth] Password reset token for ${email}: ${result.token}`);
      console.log(`[Auth] Reset URL: ${process.env.FRONTEND_URL}/reset-password?token=${result.token}`);
    }

    // Always return same response to prevent email enumeration
    res.json({
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Verify reset token
export const verifyPasswordResetToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Reset token is required' });
      return;
    }

    const verification = verifyResetToken(token);

    if (!verification.valid) {
      res.status(400).json({ error: verification.error });
      return;
    }

    res.json({
      valid: true,
      message: 'Token is valid. You may reset your password.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
};

// Reset password with token
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    const result = await resetPasswordService(token, newPassword);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ message: result.message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
