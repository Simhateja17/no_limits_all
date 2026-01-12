/**
 * Password Reset Service
 * Handles secure password reset flow with time-limited tokens
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Token expiry time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

// In-memory token store (use Redis in production for distributed systems)
// Format: { token: { email, expiresAt, used } }
const resetTokenStore = new Map<string, {
  email: string;
  expiresAt: Date;
  used: boolean;
}>();

/**
 * Generate a secure password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash the reset token for storage (optional extra security)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Request a password reset
 * Creates a reset token and stores it
 *
 * @param email - User's email address
 * @returns Reset token (to be sent via email) or null if user not found
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  token?: string;
  message: string;
}> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // But only generate token if user exists
    if (!user) {
      console.log(`[PasswordReset] Reset requested for unknown email: ${email}`);
      return {
        success: true,
        message: 'If an account exists with this email, a reset link will be sent.',
      };
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`[PasswordReset] Reset requested for inactive user: ${email}`);
      return {
        success: true,
        message: 'If an account exists with this email, a reset link will be sent.',
      };
    }

    // Generate reset token
    const token = generateResetToken();
    const hashedToken = hashToken(token);

    // Store token with expiry
    resetTokenStore.set(hashedToken, {
      email: user.email,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      used: false,
    });

    // Clean up expired tokens periodically
    if (resetTokenStore.size > 1000) {
      cleanupExpiredTokens();
    }

    console.log(`[PasswordReset] Token generated for user: ${email}`);

    return {
      success: true,
      token, // This should be sent via email, not returned to client in production
      message: 'If an account exists with this email, a reset link will be sent.',
    };
  } catch (error) {
    console.error('[PasswordReset] Error requesting reset:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again later.',
    };
  }
}

/**
 * Verify a reset token is valid
 */
export function verifyResetToken(token: string): {
  valid: boolean;
  email?: string;
  error?: string;
} {
  const hashedToken = hashToken(token);
  const tokenData = resetTokenStore.get(hashedToken);

  if (!tokenData) {
    return { valid: false, error: 'Invalid or expired reset token' };
  }

  if (tokenData.used) {
    return { valid: false, error: 'This reset link has already been used' };
  }

  if (tokenData.expiresAt < new Date()) {
    resetTokenStore.delete(hashedToken);
    return { valid: false, error: 'Reset link has expired. Please request a new one.' };
  }

  return { valid: true, email: tokenData.email };
}

/**
 * Reset password using a valid token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Verify token
    const verification = verifyResetToken(token);
    if (!verification.valid || !verification.email) {
      return { success: false, message: verification.error || 'Invalid token' };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long' };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: verification.email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // Optional: Force re-login by updating a token version field
      },
    });

    // Mark token as used
    const hashedToken = hashToken(token);
    const tokenData = resetTokenStore.get(hashedToken);
    if (tokenData) {
      tokenData.used = true;
    }

    console.log(`[PasswordReset] Password reset successful for: ${verification.email}`);

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  } catch (error) {
    console.error('[PasswordReset] Error resetting password:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again later.',
    };
  }
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  let cleaned = 0;

  for (const [token, data] of resetTokenStore) {
    if (data.expiresAt < now || data.used) {
      resetTokenStore.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[PasswordReset] Cleaned up ${cleaned} expired tokens`);
  }
}

/**
 * Generate a secure temporary password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(16);
  let password = '';

  for (let i = 0; i < 16; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  return password;
}

export default {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  generateTemporaryPassword,
};
