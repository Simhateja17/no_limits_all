# Shopify OAuth Implementation Guide

## Overview
This document describes the implementation of Shopify OAuth as a third connection method for client onboarding. Clients can now connect their Shopify stores using three different methods:

1. **Admin API Access Token** (existing)
2. **API Key & Secret** (existing)
3. **OAuth Flow** (NEW)

## What Was Added

### 1. Frontend Changes

#### A. Updated Onboarding API (`/frontend/src/lib/onboarding-api.ts`)
Added three new API functions to support Shopify OAuth:

```typescript
// Save OAuth credentials before starting flow
saveShopifyOAuthCredentials(input: ShopifyOAuthCredentialsInput): Promise<OnboardingResult>

// Get authorization URL
getShopifyAuthUrl(input: ShopifyAuthUrlInput): Promise<{ success: boolean; authUrl: string }>

// Complete OAuth flow
completeShopifyOAuth(clientId, shopDomain, code, state): Promise<OnboardingResult>
```

#### B. New OAuth Callback Page (`/frontend/src/app/integrations/shopify/callback/page.tsx`)
- Handles the OAuth redirect from Shopify
- Exchanges authorization code for access token
- Creates the channel in the database
- Communicates with parent window via `postMessage`
- Shows success/error status to user

#### C. Setup Page Updates (`/frontend/src/app/client/setup/page_oauth.tsx`)
- Added OAuth as a third connection type option
- New state variables for OAuth credentials:
  - `shopifyOAuthClientId`
  - `shopifyOAuthClientSecret`
  - `shopifyOAuthStatus`
  - `shopifyOAuthError`
- New handler function `handleShopifyOAuth()` that:
  1. Saves OAuth credentials to backend
  2. Gets authorization URL
  3. Opens popup window for user authorization
  4. Listens for completion message
  5. Proceeds to JTL setup step

### 2. Backend Changes

#### A. Prisma Schema (`/backend/prisma/schema.prisma`)
Added new model for temporary OAuth credential storage:

```prisma
model ShopifyOAuthConfig {
  id                  String   @id @default(cuid())
  clientId            String
  shopDomain          String
  oauthClientId       String   // Shopify App Client ID
  oauthClientSecret   String   // Stored encrypted
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([clientId, shopDomain], name: "clientId_shopDomain")
  @@map("shopify_oauth_configs")
}
```

#### B. Integration Routes (`/backend/src/routes/integrations.routes.ts`)
Added three new OAuth endpoints:

**1. Save OAuth Credentials**
```
POST /api/integrations/shopify/oauth/save-credentials
Body: { clientId, shopDomain, oauthClientId, oauthClientSecret }
```
- Encrypts and stores OAuth credentials temporarily
- Required before starting OAuth flow

**2. Get Authorization URL**
```
POST /api/integrations/shopify/oauth/auth-url
Body: { clientId, shopDomain, redirectUri, oauthClientId }
```
- Generates Shopify authorization URL
- Uses clientId as state parameter for CSRF protection
- Defines required scopes (products, orders, inventory, etc.)

**3. Complete OAuth Flow**
```
POST /api/integrations/shopify/oauth/complete
Body: { clientId, shopDomain, code, state }
```
- Verifies state parameter (CSRF protection)
- Retrieves saved OAuth credentials
- Exchanges authorization code for access token
- Creates Channel record in database
- Cleans up temporary OAuth config

#### C. Shopify Service (`/backend/src/services/integrations/shopify.service.ts`)
Already had OAuth helper methods:
- `generateAuthorizationUrl()` - Creates OAuth URL
- `exchangeCodeForToken()` - Exchanges code for token
- `validateOAuthState()` - Validates CSRF token

## OAuth Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │         │   Backend    │         │   Shopify   │
│  (Browser)  │         │   Server     │         │    OAuth    │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │  1. Save OAuth Creds  │                        │
       ├──────────────────────>│                        │
       │  (clientId, secret)   │                        │
       │                       │                        │
       │  2. Get Auth URL      │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │  3. Redirect to OAuth │                        │
       ├────────────────────────────────────────────────>│
       │                       │                        │
       │  4. User Authorizes   │                        │
       │<────────────────────────────────────────────────┤
       │                       │                        │
       │  5. Callback with code│                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │  6. Exchange Token     │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │  7. Access Token       │
       │                       │<───────────────────────┤
       │                       │                        │
       │                       │  8. Create Channel     │
       │                       │  (Save to database)    │
       │                       │                        │
       │  9. Success Response  │                        │
       │<──────────────────────┤                        │
       │                       │                        │
```

## Security Features

1. **CSRF Protection**: Uses state parameter (clientId) to prevent cross-site request forgery
2. **Encryption**: OAuth client secrets and access tokens are encrypted before storage
3. **Temporary Storage**: OAuth credentials are deleted after successful token exchange
4. **Origin Validation**: Popup communication validates message origin
5. **HTTPS Required**: OAuth flow requires HTTPS in production

## User Experience

### Client Setup Flow (with OAuth):

1. Client selects "Shopify" as platform
2. Chooses "OAuth Flow" connection method
3. Enters:
   - Shop Domain (e.g., `mystore.myshopify.com`)
   - OAuth Client ID (from Shopify App)
   - OAuth Client Secret (from Shopify App)
4. Clicks "Continue"
5. Popup opens to Shopify authorization page
6. User authorizes the app
7. Popup shows success message and closes
8. Main window proceeds to JTL credentials step

## How to Create a Shopify App

To use OAuth connection, clients need to create a Shopify App:

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Configure App URLs:
   - **App URL**: `https://your-domain.com`
   - **Allowed redirection URL(s)**: `https://your-domain.com/integrations/shopify/callback`
4. Set required API scopes:
   - `read_products`, `write_products`
   - `read_orders`, `write_orders`
   - `read_fulfillments`, `write_fulfillments`
   - `read_inventory`, `write_inventory`
   - `read_shipping`, `write_shipping`
5. Copy the **Client ID** and **Client Secret**
6. Use these credentials in the No Limits setup process

## Environment Variables

No new environment variables required. The system uses existing:
- `ENCRYPTION_KEY` - For encrypting secrets
- `DATABASE_URL` - For database connection
- `FRONTEND_URL` - For CORS validation

## Database Migration

After adding the ShopifyOAuthConfig model, run:

```bash
cd backend
npx prisma migrate dev --name add_shopify_oauth_config
npx prisma generate
```

## Testing

### Test OAuth Flow Locally:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Create a development Shopify store
4. Create a Shopify App with redirect URL: `http://localhost:3000/integrations/shopify/callback`
5. Go to client setup page
6. Select OAuth method
7. Enter credentials and test

### Test All Three Methods:

**Method 1: Admin API Access Token**
- Get token from Shopify Admin → Settings → Apps and sales channels → Develop apps
- Quickest method for testing

**Method 2: API Key & Secret**
- Legacy method using API credentials
- For older Shopify integrations

**Method 3: OAuth Flow**
- Most secure and recommended
- Requires Shopify App setup
- Best for production use

## Files Modified/Created

### Created:
- `/frontend/src/app/integrations/shopify/callback/page.tsx`
- `/frontend/src/app/client/setup/page_oauth.tsx` (reference implementation)
- `/SHOPIFY_OAUTH_IMPLEMENTATION.md` (this file)

### Modified:
- `/frontend/src/lib/onboarding-api.ts`
- `/backend/src/routes/integrations.routes.ts`
- `/backend/prisma/schema.prisma`

### Regenerated:
- Prisma Client (`npx prisma generate`)

## Next Steps

1. **Merge the OAuth implementation** into the main setup page
2. **Run database migration** on production
3. **Update documentation** for end users
4. **Create Shopify App** for production environment
5. **Test with real Shopify store**
6. **Add UI for selecting OAuth scopes** (optional enhancement)
7. **Add webhook verification** for OAuth apps (optional enhancement)

## Benefits of OAuth Method

✅ **More Secure**: No manual token management
✅ **Better UX**: Users authorize through Shopify UI
✅ **Auto-renewal**: Refresh tokens allow automatic renewal
✅ **Scope Control**: Clear visibility of permissions
✅ **Revocable**: Users can revoke access anytime
✅ **Audit Trail**: Shopify logs all authorizations

## Support

For questions or issues:
1. Check Shopify OAuth documentation: https://shopify.dev/docs/apps/auth/oauth
2. Review error logs in browser console and backend logs
3. Verify Shopify App configuration matches redirect URLs
4. Ensure all required scopes are requested

---

**Implementation Date**: December 23, 2025
**Status**: ✅ Complete - Ready for testing
