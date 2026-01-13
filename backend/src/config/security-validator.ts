/**
 * Security Configuration Validator
 * Ensures critical security settings are properly configured
 * Fails fast in production if security requirements are not met
 */

interface SecurityCheck {
  name: string;
  check: () => boolean;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  fix: string;
}

const securityChecks: SecurityCheck[] = [
  // Critical checks - application should not start without these in production
  {
    name: 'JWT_SECRET',
    check: () => {
      const secret = process.env.JWT_SECRET;
      return !!secret &&
             secret !== 'your-secret-key-change-in-production' &&
             secret.length >= 32;
    },
    severity: 'critical',
    message: 'JWT_SECRET is missing, weak, or uses default value',
    fix: 'Set JWT_SECRET to a random 32+ character string: openssl rand -hex 32',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    check: () => {
      const secret = process.env.JWT_REFRESH_SECRET;
      return !!secret &&
             secret !== 'your-refresh-secret-change-in-production' &&
             secret.length >= 32;
    },
    severity: 'critical',
    message: 'JWT_REFRESH_SECRET is missing, weak, or uses default value',
    fix: 'Set JWT_REFRESH_SECRET to a random 32+ character string: openssl rand -hex 32',
  },
  {
    name: 'ENCRYPTION_KEY',
    check: () => {
      const key = process.env.ENCRYPTION_KEY;
      return !!key && key.length === 64; // 32 bytes = 64 hex chars
    },
    severity: 'critical',
    message: 'ENCRYPTION_KEY is missing or invalid (must be 64 hex characters)',
    fix: 'Set ENCRYPTION_KEY to a 32-byte hex string: openssl rand -hex 32',
  },
  {
    name: 'DATABASE_URL',
    check: () => {
      const url = process.env.DATABASE_URL;
      if (!url) return false;
      // Check for common insecure patterns
      if (url.includes('password=password')) return false;
      if (url.includes('password=123456')) return false;
      return true;
    },
    severity: 'critical',
    message: 'DATABASE_URL is missing or uses weak credentials',
    fix: 'Set DATABASE_URL with strong credentials',
  },

  // High severity checks
  {
    name: 'SHOPIFY_WEBHOOK_SECRET',
    check: () => {
      // Only required if Shopify is configured
      if (!process.env.SHOPIFY_API_KEY) return true;
      return !!process.env.SHOPIFY_WEBHOOK_SECRET;
    },
    severity: 'high',
    message: 'SHOPIFY_WEBHOOK_SECRET is missing (webhooks will not be verified)',
    fix: 'Set SHOPIFY_WEBHOOK_SECRET from your Shopify app settings',
  },
  {
    name: 'CORS_ALLOWED_ORIGINS',
    check: () => {
      // Warn if using wildcard in production
      const cors = process.env.CORS_ALLOWED_ORIGINS;
      if (cors === '*') return false;
      return true;
    },
    severity: 'high',
    message: 'CORS is configured with wildcard (*) allowing all origins',
    fix: 'Set CORS_ALLOWED_ORIGINS to specific trusted domains',
  },
  {
    name: 'NODE_ENV',
    check: () => {
      return process.env.NODE_ENV === 'production';
    },
    severity: 'high',
    message: 'NODE_ENV is not set to production',
    fix: 'Set NODE_ENV=production for production deployments',
  },

  // Medium severity checks
  {
    name: 'SSL_ENABLED',
    check: () => {
      // Check if SSL is likely enabled (HTTPS in URLs or SSL flag)
      const frontendUrl = process.env.FRONTEND_URL || '';
      const backendUrl = process.env.BACKEND_URL || '';
      return frontendUrl.startsWith('https://') || backendUrl.startsWith('https://');
    },
    severity: 'medium',
    message: 'Application may not be using HTTPS',
    fix: 'Ensure FRONTEND_URL and BACKEND_URL use https://',
  },
  {
    name: 'SESSION_EXPIRY',
    check: () => {
      const expiry = parseInt(process.env.JWT_EXPIRY_MINUTES || '60');
      return expiry <= 60; // Should be 1 hour or less
    },
    severity: 'medium',
    message: 'JWT expiry time is too long (should be <= 60 minutes)',
    fix: 'Set JWT_EXPIRY_MINUTES to 60 or less',
  },
];

export interface ValidationResult {
  passed: boolean;
  criticalErrors: string[];
  highWarnings: string[];
  mediumWarnings: string[];
}

/**
 * Validate security configuration
 * Returns validation result with categorized issues
 */
export function validateSecurityConfig(): ValidationResult {
  const result: ValidationResult = {
    passed: true,
    criticalErrors: [],
    highWarnings: [],
    mediumWarnings: [],
  };

  for (const check of securityChecks) {
    if (!check.check()) {
      const message = `[${check.name}] ${check.message}\n   Fix: ${check.fix}`;

      switch (check.severity) {
        case 'critical':
          result.criticalErrors.push(message);
          result.passed = false;
          break;
        case 'high':
          result.highWarnings.push(message);
          break;
        case 'medium':
          result.mediumWarnings.push(message);
          break;
      }
    }
  }

  return result;
}

/**
 * Enforce security configuration
 * Logs warnings and exits in production if critical checks fail
 */
export function enforceSecurityConfig(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const result = validateSecurityConfig();

  console.log('\n========================================');
  console.log('🔒 SECURITY CONFIGURATION CHECK');
  console.log('========================================\n');

  // Critical errors
  if (result.criticalErrors.length > 0) {
    console.error('❌ CRITICAL SECURITY ISSUES:');
    result.criticalErrors.forEach(err => console.error(`   ${err}\n`));

    if (isProduction) {
      console.error('\n🚫 Application cannot start with critical security issues in production.\n');
      process.exit(1);
    } else {
      console.warn('\n⚠️  Running with security issues in development mode.\n');
    }
  }

  // High warnings
  if (result.highWarnings.length > 0) {
    console.warn('⚠️  HIGH PRIORITY WARNINGS:');
    result.highWarnings.forEach(warn => console.warn(`   ${warn}\n`));
  }

  // Medium warnings
  if (result.mediumWarnings.length > 0) {
    console.info('ℹ️  RECOMMENDATIONS:');
    result.mediumWarnings.forEach(warn => console.info(`   ${warn}\n`));
  }

  if (result.passed && result.highWarnings.length === 0 && result.mediumWarnings.length === 0) {
    console.log('✅ All security checks passed!\n');
  }

  console.log('========================================\n');
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get secure default value or throw in production
 */
export function requireEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;

  if (!value) {
    if (isProduction()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    console.warn(`[Security] Missing environment variable: ${name}`);
    return '';
  }

  return value;
}

export default {
  validateSecurityConfig,
  enforceSecurityConfig,
  isProduction,
  requireEnvVar,
};
