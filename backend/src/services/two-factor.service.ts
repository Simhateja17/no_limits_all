/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) for 2FA
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { logger } from './logger.service.js';
import { sendTwoFactorCodeEmail } from './email.service.js';

// Configure authenticator
authenticator.options = {
  digits: 6,
  step: 30, // 30 seconds validity
  window: 1, // Allow 1 step before/after for time drift
};

// App name for TOTP
const APP_NAME = 'No-Limits Platform';

// Backup codes configuration
const BACKUP_CODE_LENGTH = 8;
const BACKUP_CODE_COUNT = 10;

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  usedBackupCode?: boolean;
}

/**
 * Generate a new 2FA secret for a user
 */
export function generateSecret(userEmail: string): string {
  return authenticator.generateSecret();
}

/**
 * Generate setup data for enabling 2FA
 */
export async function setupTwoFactor(
  userId: string,
  userEmail: string
): Promise<TwoFactorSetupResult> {
  // Generate secret
  const secret = generateSecret(userEmail);

  // Generate TOTP auth URL
  const otpAuthUrl = authenticator.keyuri(userEmail, APP_NAME, secret);

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 256,
    margin: 2,
  });

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  logger.info('2FA setup initiated', { userId });

  return {
    secret,
    qrCodeUrl: otpAuthUrl,
    qrCodeDataUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    logger.error('TOTP verification error', { error });
    return false;
  }
}

/**
 * Verify 2FA code (TOTP or backup code)
 */
export function verifyTwoFactor(
  secret: string,
  token: string,
  backupCodes?: string[]
): TwoFactorVerifyResult {
  // Clean the token (remove spaces, dashes)
  const cleanToken = token.replace(/[\s-]/g, '');

  // First try TOTP verification
  if (cleanToken.length === 6 && /^\d{6}$/.test(cleanToken)) {
    const valid = verifyTOTP(secret, cleanToken);
    if (valid) {
      return { valid: true };
    }
  }

  // Then try backup codes
  if (backupCodes && cleanToken.length === BACKUP_CODE_LENGTH) {
    const normalizedToken = cleanToken.toUpperCase();
    const index = backupCodes.findIndex(
      (code) => code.toUpperCase() === normalizedToken
    );

    if (index !== -1) {
      return {
        valid: true,
        usedBackupCode: true,
      };
    }
  }

  return { valid: false };
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate random bytes and convert to alphanumeric
    const bytes = crypto.randomBytes(Math.ceil(BACKUP_CODE_LENGTH / 2));
    const code = bytes
      .toString('hex')
      .toUpperCase()
      .slice(0, BACKUP_CODE_LENGTH);
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) =>
    crypto.createHash('sha256').update(code.toUpperCase()).digest('hex')
  );
}

/**
 * Verify a backup code against hashed codes
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; index: number } {
  const hashedInput = crypto
    .createHash('sha256')
    .update(code.toUpperCase())
    .digest('hex');

  const index = hashedCodes.indexOf(hashedInput);
  return {
    valid: index !== -1,
    index,
  };
}

/**
 * Generate a time-limited email verification code
 */
export function generateEmailCode(): { code: string; expiresAt: Date } {
  // Generate 6-digit numeric code
  const code = crypto.randomInt(100000, 999999).toString();

  // Code expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return { code, expiresAt };
}

/**
 * Send 2FA code via email (fallback method)
 */
export async function sendEmailCode(
  email: string,
  name: string
): Promise<{ code: string; expiresAt: Date } | null> {
  const { code, expiresAt } = generateEmailCode();

  const result = await sendTwoFactorCodeEmail(email, name, code);

  if (result.success) {
    logger.info('2FA email code sent', { email });
    return { code, expiresAt };
  }

  logger.error('Failed to send 2FA email code', { email });
  return null;
}

/**
 * Verify email code
 */
export function verifyEmailCode(
  inputCode: string,
  storedCode: string,
  expiresAt: Date
): boolean {
  // Check expiration
  if (new Date() > expiresAt) {
    return false;
  }

  // Compare codes (constant-time comparison)
  return crypto.timingSafeEqual(
    Buffer.from(inputCode),
    Buffer.from(storedCode)
  );
}

/**
 * Generate remember device token
 */
export function generateRememberToken(): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Token valid for 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return { token, hashedToken, expiresAt };
}

/**
 * Verify remember device token
 */
export function verifyRememberToken(
  inputToken: string,
  hashedToken: string,
  expiresAt: Date
): boolean {
  // Check expiration
  if (new Date() > expiresAt) {
    return false;
  }

  // Hash input and compare
  const hashedInput = crypto
    .createHash('sha256')
    .update(inputToken)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hashedInput),
    Buffer.from(hashedToken)
  );
}

/**
 * Check if 2FA should be required based on role
 */
export function is2FARequired(role: string): boolean {
  // Require 2FA for admin roles
  const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
  return adminRoles.includes(role);
}

/**
 * Check if 2FA is recommended (but not required)
 */
export function is2FARecommended(role: string): boolean {
  // Recommend 2FA for all internal users
  const recommendedRoles = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'];
  return recommendedRoles.includes(role);
}

export default {
  generateSecret,
  setupTwoFactor,
  verifyTOTP,
  verifyTwoFactor,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  generateEmailCode,
  sendEmailCode,
  verifyEmailCode,
  generateRememberToken,
  verifyRememberToken,
  is2FARequired,
  is2FARecommended,
};
