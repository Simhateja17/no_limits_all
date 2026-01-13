/**
 * Email Service
 * Provides transactional email functionality using Resend
 */

import { Resend } from 'resend';
import { logger } from './logger.service.js';

// Resend client instance
let resendClient: Resend | null = null;

// Default sender
const DEFAULT_FROM = process.env.EMAIL_FROM || 'No-Limits Platform <noreply@nolimits.com>';

// Email templates
export const EmailTemplates = {
  PASSWORD_RESET: 'password-reset',
  WELCOME: 'welcome',
  ORDER_CONFIRMATION: 'order-confirmation',
  ORDER_SHIPPED: 'order-shipped',
  LOW_STOCK_ALERT: 'low-stock-alert',
  SYNC_ERROR_ALERT: 'sync-error-alert',
  ACCOUNT_DEACTIVATED: 'account-deactivated',
  TWO_FACTOR_CODE: 'two-factor-code',
  INVOICE: 'invoice',
} as const;

export type EmailTemplate = (typeof EmailTemplates)[keyof typeof EmailTemplates];

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: EmailTemplate;
  data?: Record<string, unknown>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Initialize email service
 */
export function initializeEmail(): boolean {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn('RESEND_API_KEY not configured - email service disabled');
    return false;
  }

  try {
    resendClient = new Resend(apiKey);
    logger.info('Email service initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize email service', { error });
    return false;
  }
}

/**
 * Check if email service is available
 */
export function isEmailAvailable(): boolean {
  return resendClient !== null;
}

/**
 * Render email template
 */
function renderTemplate(template: EmailTemplate, data: Record<string, unknown>): { html: string; text: string } {
  // Template rendering based on template type
  switch (template) {
    case EmailTemplates.PASSWORD_RESET:
      return renderPasswordResetTemplate(data);
    case EmailTemplates.WELCOME:
      return renderWelcomeTemplate(data);
    case EmailTemplates.ORDER_CONFIRMATION:
      return renderOrderConfirmationTemplate(data);
    case EmailTemplates.ORDER_SHIPPED:
      return renderOrderShippedTemplate(data);
    case EmailTemplates.LOW_STOCK_ALERT:
      return renderLowStockAlertTemplate(data);
    case EmailTemplates.SYNC_ERROR_ALERT:
      return renderSyncErrorAlertTemplate(data);
    case EmailTemplates.TWO_FACTOR_CODE:
      return renderTwoFactorCodeTemplate(data);
    default:
      return { html: '', text: '' };
  }
}

// ============= TEMPLATE RENDERERS =============

function renderPasswordResetTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { name, resetUrl, expiresIn = '1 hour' } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">No-Limits Platform</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in ${expiresIn}. If you didn't request this reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetUrl}</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

Hi ${name || 'there'},

We received a request to reset your password. Visit the following link to create a new password:

${resetUrl}

This link will expire in ${expiresIn}. If you didn't request this reset, you can safely ignore this email.

- No-Limits Platform Team
  `.trim();

  return { html, text };
}

function renderWelcomeTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { name, loginUrl, companyName } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to No-Limits Platform</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to No-Limits! </h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Your account is ready</h2>
        <p>Hi ${name},</p>
        <p>Welcome to No-Limits Platform! Your account${companyName ? ` for ${companyName}` : ''} has been successfully created.</p>
        <p>Here's what you can do now:</p>
        <ul>
          <li>Connect your Shopify or WooCommerce store</li>
          <li>Manage your inventory and orders</li>
          <li>Track shipments in real-time</li>
          <li>Access analytics and reports</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
        </div>
        <p>Need help? Our support team is here to assist you.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to No-Limits Platform!

Hi ${name},

Your account${companyName ? ` for ${companyName}` : ''} has been successfully created.

Get started: ${loginUrl}

Here's what you can do:
- Connect your Shopify or WooCommerce store
- Manage your inventory and orders
- Track shipments in real-time
- Access analytics and reports

Need help? Our support team is here to assist you.

- No-Limits Platform Team
  `.trim();

  return { html, text };
}

function renderOrderConfirmationTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { orderNumber, customerName, items, total, trackingUrl } = data as {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: string }>;
    total: string;
    trackingUrl?: string;
  };

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #667eea; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${customerName},</p>
        <p>Thank you for your order! We've received your order <strong>#${orderNumber}</strong> and are processing it now.</p>

        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; font-weight: bold;">Total</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${total}</td>
            </tr>
          </tfoot>
        </table>

        ${trackingUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${trackingUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmation - #${orderNumber}

Hi ${customerName},

Thank you for your order! We've received your order and are processing it now.

Order Details:
${items.map(item => `- ${item.name} x${item.quantity}: ${item.price}`).join('\n')}

Total: ${total}

${trackingUrl ? `Track your order: ${trackingUrl}` : ''}

- No-Limits Platform Team
  `.trim();

  return { html, text };
}

function renderOrderShippedTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { orderNumber, customerName, trackingNumber, trackingUrl, carrier } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Order Has Shipped!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #28a745; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Your Order Has Shipped!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${customerName},</p>
        <p>Great news! Your order <strong>#${orderNumber}</strong> is on its way!</p>

        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Carrier:</strong> ${carrier}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${trackingUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Package</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Your Order Has Shipped!

Hi ${customerName},

Great news! Your order #${orderNumber} is on its way!

Carrier: ${carrier}
Tracking Number: ${trackingNumber}

Track your package: ${trackingUrl}

- No-Limits Platform Team
  `.trim();

  return { html, text };
}

function renderLowStockAlertTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { products, dashboardUrl } = data as {
    products: Array<{ name: string; sku: string; currentStock: number; threshold: number }>;
    dashboardUrl: string;
  };

  const productsHtml = products.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.sku}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; color: ${p.currentStock === 0 ? '#dc3545' : '#ffc107'};">${p.currentStock}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.threshold}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Low Stock Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ffc107; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #333; margin: 0;">Low Stock Alert</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>The following products are running low on stock:</p>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #333; color: white;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px;">SKU</th>
              <th style="padding: 10px;">Stock</th>
              <th style="padding: 10px;">Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Low Stock Alert

The following products are running low on stock:

${products.map(p => `- ${p.name} (${p.sku}): ${p.currentStock} units (threshold: ${p.threshold})`).join('\n')}

View dashboard: ${dashboardUrl}
  `.trim();

  return { html, text };
}

function renderSyncErrorAlertTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { errorType, platform, details, timestamp, dashboardUrl } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Sync Error Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Sync Error Detected</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>A synchronization error has occurred:</p>

        <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p><strong>Error Type:</strong> ${errorType}</p>
          <p><strong>Platform:</strong> ${platform}</p>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Details:</strong></p>
          <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${details}</pre>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${dashboardUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Sync Error Alert

A synchronization error has occurred:

Error Type: ${errorType}
Platform: ${platform}
Time: ${timestamp}

Details:
${details}

View in dashboard: ${dashboardUrl}
  `.trim();

  return { html, text };
}

function renderTwoFactorCodeTemplate(data: Record<string, unknown>): { html: string; text: string } {
  const { code, name, expiresIn = '10 minutes' } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #667eea; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Verification Code</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
        <p>Hi ${name || 'there'},</p>
        <p>Your verification code is:</p>
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in ${expiresIn}.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Verification Code

Hi ${name || 'there'},

Your verification code is: ${code}

This code expires in ${expiresIn}.

If you didn't request this code, please ignore this email.
  `.trim();

  return { html, text };
}

// ============= EMAIL SENDING =============

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!resendClient) {
    logger.warn('Email service not initialized - email not sent', {
      to: options.to,
      subject: options.subject,
    });

    // Log email content in development
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Email would have been sent:', options);
    }

    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    // Render template if provided
    let { html, text } = options;
    if (options.template && options.data) {
      const rendered = renderTemplate(options.template, options.data);
      html = html || rendered.html;
      text = text || rendered.text;
    }

    const result = await resendClient.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html,
      text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: result.data?.id,
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============= CONVENIENCE METHODS =============

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - No-Limits Platform',
    template: EmailTemplates.PASSWORD_RESET,
    data: { name, resetUrl, expiresIn: '1 hour' },
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  companyName?: string
): Promise<EmailResult> {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  return sendEmail({
    to: email,
    subject: 'Welcome to No-Limits Platform!',
    template: EmailTemplates.WELCOME,
    data: { name, companyName, loginUrl },
  });
}

/**
 * Send 2FA code email
 */
export async function sendTwoFactorCodeEmail(
  email: string,
  name: string,
  code: string
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: 'Your Verification Code - No-Limits Platform',
    template: EmailTemplates.TWO_FACTOR_CODE,
    data: { name, code, expiresIn: '10 minutes' },
  });
}

/**
 * Send low stock alert
 */
export async function sendLowStockAlert(
  adminEmails: string[],
  products: Array<{ name: string; sku: string; currentStock: number; threshold: number }>
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.FRONTEND_URL}/inventory`;

  return sendEmail({
    to: adminEmails,
    subject: 'Low Stock Alert - Action Required',
    template: EmailTemplates.LOW_STOCK_ALERT,
    data: { products, dashboardUrl },
  });
}

/**
 * Send sync error alert
 */
export async function sendSyncErrorAlert(
  adminEmails: string[],
  errorType: string,
  platform: string,
  details: string
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.FRONTEND_URL}/sync`;

  return sendEmail({
    to: adminEmails,
    subject: `Sync Error: ${platform} - ${errorType}`,
    template: EmailTemplates.SYNC_ERROR_ALERT,
    data: {
      errorType,
      platform,
      details,
      timestamp: new Date().toISOString(),
      dashboardUrl,
    },
  });
}

export default {
  initializeEmail,
  isEmailAvailable,
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTwoFactorCodeEmail,
  sendLowStockAlert,
  sendSyncErrorAlert,
  EmailTemplates,
};
