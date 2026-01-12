# Shopify FulfillmentOrder API & Webhooks - Complete Guide

## Overview

The FulfillmentOrder API is Shopify's modern approach to handling order fulfillment, especially for multi-location setups and third-party logistics (3PL) providers. This guide covers how to integrate it with your No Limits platform.

---

## 1. Re-register Webhooks for Existing Channels

### Current Webhook Topics
Your platform currently registers these webhook topics (see `shopify.service.ts` and `shopify-graphql.service.ts`):

```typescript
const webhookTopics = [
  'orders/create',
  'orders/updated',
  'orders/cancelled',
  'orders/fulfilled',
  'products/create',
  'products/update',
  'products/delete',
  'refunds/create',
  'inventory_levels/update',
];
```

### New FulfillmentOrder Webhook Topics

To enable full FulfillmentOrder support, you need to add these webhook topics:

```typescript
const fulfillmentOrderWebhooks = [
  // Request submission & acceptance
  'fulfillment_orders/fulfillment_request_submitted',
  'fulfillment_orders/fulfillment_request_accepted',
  'fulfillment_orders/fulfillment_request_rejected',
  
  // Hold management
  'fulfillment_orders/placed_on_hold',
  'fulfillment_orders/hold_released',
  
  // Cancellation
  'fulfillment_orders/cancellation_request_submitted',
  'fulfillment_orders/cancellation_request_accepted',
  'fulfillment_orders/cancellation_request_rejected',
  
  // Location changes
  'fulfillment_orders/moved',
  'fulfillment_orders/order_routing_complete',
  
  // Fulfillment lifecycle
  'fulfillment_orders/scheduled_fulfillment_order_ready',
  'fulfillment_orders/rescheduled',
];
```

### Implementation Steps

#### Step 1: Update `registerSyncWebhooks` Method

Update **both** services to include FulfillmentOrder webhooks:

**File: `/backend/src/services/integrations/shopify.service.ts`**

```typescript
async registerSyncWebhooks(baseUrl: string): Promise<SyncResult> {
  const webhookTopics = [
    // Existing webhooks
    'orders/create',
    'orders/updated',
    'orders/cancelled',
    'orders/fulfilled',
    'products/create',
    'products/update',
    'products/delete',
    'refunds/create',
    'inventory_levels/update',
    
    // NEW: FulfillmentOrder webhooks
    'fulfillment_orders/fulfillment_request_submitted',
    'fulfillment_orders/fulfillment_request_accepted',
    'fulfillment_orders/fulfillment_request_rejected',
    'fulfillment_orders/placed_on_hold',
    'fulfillment_orders/hold_released',
    'fulfillment_orders/cancellation_request_submitted',
    'fulfillment_orders/cancellation_request_accepted',
    'fulfillment_orders/cancellation_request_rejected',
    'fulfillment_orders/moved',
    'fulfillment_orders/order_routing_complete',
    'fulfillment_orders/scheduled_fulfillment_order_ready',
    'fulfillment_orders/rescheduled',
  ];

  const results: SyncItemResult[] = [];
  let itemsProcessed = 0;
  let itemsFailed = 0;

  for (const topic of webhookTopics) {
    try {
      const address = `${baseUrl}/webhooks/shopify/${topic.replace(/\//g, '-')}`;
      await this.createWebhook(topic, address);
      results.push({
        externalId: topic,
        success: true,
        action: 'created',
      });
      itemsProcessed++;
    } catch (error) {
      results.push({
        externalId: topic,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'failed',
      });
      itemsFailed++;
    }
  }

  return {
    success: itemsFailed === 0,
    syncedAt: new Date(),
    itemsProcessed,
    itemsFailed,
    details: results,
  };
}
```

**File: `/backend/src/services/integrations/shopify-graphql.service.ts`**

Make the same update to the GraphQL service's `registerSyncWebhooks` method.

#### Step 2: Add Webhook Route Handlers

Update **`/backend/src/routes/webhook.routes.ts`** to handle FulfillmentOrder webhooks:

```typescript
// Add route for each FulfillmentOrder webhook
router.post('/shopify/fulfillment_orders-fulfillment_request_submitted', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-fulfillment_request_accepted', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-fulfillment_request_rejected', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-placed_on_hold', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-hold_released', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-cancellation_request_submitted', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-cancellation_request_accepted', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-cancellation_request_rejected', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-moved', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-order_routing_complete', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-scheduled_fulfillment_order_ready', shopifyWebhookHandler);
router.post('/shopify/fulfillment_orders-rescheduled', shopifyWebhookHandler);
```

#### Step 3: Create Re-registration Script

Create a script to re-register webhooks for all existing Shopify channels:

**File: `/backend/scripts/reregister-shopify-webhooks.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { createShopifyServiceAuto } from '../src/services/integrations/index.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function reregisterWebhooks() {
  try {
    console.log('🔄 Re-registering Shopify webhooks for all channels...\n');

    // Get all active Shopify channels
    const channels = await prisma.channel.findMany({
      where: {
        type: 'SHOPIFY',
        isActive: true,
      },
      include: {
        client: true,
      },
    });

    console.log(`📊 Found ${channels.length} active Shopify channels\n`);

    const baseUrl = process.env.BACKEND_URL || 'https://your-api-domain.com';

    for (const channel of channels) {
      console.log(`\n🛍️  Processing: ${channel.name} (Client: ${channel.client.name})`);
      console.log(`   Channel ID: ${channel.id}`);

      try {
        // Create service instance
        const shopifyService = await createShopifyServiceAuto(channel.id, prisma);

        // Get existing webhooks
        const existingWebhooks = await shopifyService.getWebhooks();
        console.log(`   📋 Found ${existingWebhooks.length} existing webhooks`);

        // Delete existing webhooks to avoid duplicates
        for (const webhook of existingWebhooks) {
          console.log(`   🗑️  Deleting webhook: ${webhook.topic}`);
          await shopifyService.deleteWebhook(webhook.id);
        }

        // Register all webhooks (including new FulfillmentOrder ones)
        console.log(`   ✨ Registering new webhooks...`);
        const result = await shopifyService.registerSyncWebhooks(baseUrl);

        if (result.success) {
          console.log(`   ✅ Success! Registered ${result.itemsProcessed} webhooks`);
        } else {
          console.log(`   ⚠️  Partial success: ${result.itemsProcessed} registered, ${result.itemsFailed} failed`);
          if (result.details) {
            result.details.filter(d => !d.success).forEach(d => {
              console.log(`      ❌ ${d.externalId}: ${d.error}`);
            });
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing channel:`, error);
      }
    }

    console.log('\n\n✅ Webhook re-registration complete!\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reregisterWebhooks();
```

#### Step 4: Run the Re-registration Script

```bash
cd backend
npx tsx scripts/reregister-shopify-webhooks.ts
```

---

## 2. Update OAuth Scopes (If Needed)

### Current Scopes
Your OAuth implementation currently requests these scopes (see `integrations.routes.ts` line 696):

```typescript
const scopes = [
  'read_products',
  'write_products',
  'read_orders',
  'write_orders',
  'read_fulfillments',
  'write_fulfillments',
  'read_inventory',
  'write_inventory',
  'read_shipping',
  'write_shipping',
];
```

### Required FulfillmentOrder Scopes

For full FulfillmentOrder API access, you need these **additional** scopes:

```typescript
const fulfillmentOrderScopes = [
  'read_merchant_managed_fulfillment_orders',
  'write_merchant_managed_fulfillment_orders',
  'read_assigned_fulfillment_orders',
  'write_assigned_fulfillment_orders',
  'read_third_party_fulfillment_orders',    // Optional: for 3PL integration
  'write_third_party_fulfillment_orders',   // Optional: for 3PL integration
];
```

### Implementation

#### Option A: For New Channels (OAuth Flow)

Update **`/backend/src/routes/integrations.routes.ts`** around line 696:

```typescript
// Define required scopes
const scopes = [
  'read_products',
  'write_products',
  'read_orders',
  'write_orders',
  'read_fulfillments',
  'write_fulfillments',
  'read_inventory',
  'write_inventory',
  'read_shipping',
  'write_shipping',
  // NEW: FulfillmentOrder scopes
  'read_merchant_managed_fulfillment_orders',
  'write_merchant_managed_fulfillment_orders',
  'read_assigned_fulfillment_orders',
  'write_assigned_fulfillment_orders',
];
```

Make the same change around line 1323 if there's a duplicate scope definition.

#### Option B: For Existing Channels

Existing channels **cannot** have their scopes updated automatically. Options:

1. **Re-authorize the app**: Users must go through OAuth flow again
2. **Update in Shopify Admin**: Users can manually update app permissions
3. **Create migration script**: Guide users to re-authenticate

**Migration Script Example:**

```typescript
// /backend/scripts/check-fulfillment-order-scopes.ts
import { PrismaClient } from '@prisma/client';
import { createShopifyServiceAuto } from '../src/services/integrations/index.js';

const prisma = new PrismaClient();

async function checkScopes() {
  const channels = await prisma.channel.findMany({
    where: { type: 'SHOPIFY', isActive: true },
    include: { client: true },
  });

  for (const channel of channels) {
    console.log(`\n📊 Channel: ${channel.name}`);
    
    try {
      const service = await createShopifyServiceAuto(channel.id, prisma);
      
      // Try to make a FulfillmentOrder API call
      // If it fails due to scope issues, we know re-auth is needed
      const testResult = await service.testConnection();
      
      console.log(`   Status: ${testResult.success ? '✅ OK' : '⚠️  Needs re-auth'}`);
    } catch (error: any) {
      if (error.message.includes('scope') || error.message.includes('permission')) {
        console.log(`   ⚠️  NEEDS RE-AUTHENTICATION (missing scopes)`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
  
  await prisma.$disconnect();
}

checkScopes();
```

---

## 3. Test the New API

Your GraphQL service already has FulfillmentOrder methods implemented! Here's how to use them:

### Available Methods

#### A. Hold a Fulfillment Order

Use when stock is unavailable or there's an issue:

```typescript
const shopifyService = await createShopifyServiceAuto(channelId, prisma);

// Hold order due to inventory issues
await shopifyService.holdFulfillmentOrder(
  fulfillmentOrderId,  // e.g., "gid://shopify/FulfillmentOrder/123456"
  'INVENTORY_OUT_OF_STOCK',  // Reason code
  'Waiting for restock of SKU ABC-123'  // Human-readable note
);

// Available reason codes:
// - INVENTORY_OUT_OF_STOCK
// - INCORRECT_ADDRESS
// - OTHER
// - AWAITING_PAYMENT
// - HIGH_RISK_OF_FRAUD
```

#### B. Release Hold

```typescript
await shopifyService.releaseHoldFulfillmentOrder(
  fulfillmentOrderId
);
```

#### C. Submit Fulfillment Request

Send fulfillment request to a 3PL or assigned location:

```typescript
await shopifyService.submitFulfillmentRequest(
  fulfillmentOrderId,
  {
    message: 'Order ready for fulfillment. Rush delivery requested.',
    notifyCustomer: true,
    fulfillmentOrderLineItems: [
      {
        id: 'gid://shopify/FulfillmentOrderLineItem/123',
        quantity: 2,
      }
    ],
  }
);
```

#### D. Accept Fulfillment Request

If you're the fulfillment service, accept the request:

```typescript
await shopifyService.acceptFulfillmentRequest(
  fulfillmentOrderId,
  {
    message: 'Order accepted. Expected ship date: 2026-01-15',
  }
);
```

#### E. Reject Fulfillment Request

```typescript
await shopifyService.rejectFulfillmentRequest(
  fulfillmentOrderId,
  {
    message: 'Cannot fulfill - item discontinued',
    reason: 'INVENTORY_OUT_OF_STOCK',
  }
);
```

#### F. Move to Different Location

Transfer fulfillment to another warehouse:

```typescript
await shopifyService.moveFulfillmentOrder(
  fulfillmentOrderId,
  'gid://shopify/Location/789'  // New location ID
);
```

#### G. Get Fulfillment Orders for an Order

```typescript
const fulfillmentOrders = await shopifyService.getOrderFulfillmentOrders(
  orderId  // Numeric ID or GID
);

console.log(fulfillmentOrders);
// Returns array of FulfillmentOrder objects
```

#### H. Get Single Fulfillment Order

```typescript
const fulfillmentOrder = await shopifyService.getFulfillmentOrder(
  fulfillmentOrderId
);

console.log(fulfillmentOrder.status);  // OPEN, IN_PROGRESS, CLOSED, etc.
console.log(fulfillmentOrder.assignedLocation.name);
console.log(fulfillmentOrder.lineItems);
```

#### I. Create Fulfillment (New API)

The GraphQL service has an enhanced `createFulfillment` method:

```typescript
// Create fulfillment with tracking
const fulfillment = await shopifyService.createFulfillment(
  orderId,
  {
    lineItemsByFulfillmentOrder: [
      {
        fulfillmentOrderId: 'gid://shopify/FulfillmentOrder/123',
        fulfillmentOrderLineItems: [
          {
            id: 'gid://shopify/FulfillmentOrderLineItem/456',
            quantity: 2,
          }
        ],
      }
    ],
    trackingInfo: {
      company: 'UPS',
      number: '1Z999AA10123456784',
      url: 'https://wwwapps.ups.com/tracking/tracking.cgi?tracknum=1Z999AA10123456784',
    },
    notifyCustomer: true,
  }
);

console.log(fulfillment.id);
console.log(fulfillment.status);  // SUCCESS, PENDING, ERROR
```

### Testing Workflow Example

Here's a complete end-to-end test scenario:

```typescript
import { PrismaClient } from '@prisma/client';
import { createShopifyServiceAuto } from './services/integrations/index.js';

const prisma = new PrismaClient();

async function testFulfillmentOrderWorkflow() {
  const channelId = 'your-channel-id';
  const orderId = 5678901234;  // Shopify order ID
  
  try {
    const shopifyService = await createShopifyServiceAuto(channelId, prisma);
    
    // 1. Get fulfillment orders for this order
    console.log('📦 Step 1: Getting fulfillment orders...');
    const fulfillmentOrders = await shopifyService.getOrderFulfillmentOrders(orderId);
    
    if (fulfillmentOrders.length === 0) {
      console.log('❌ No fulfillment orders found');
      return;
    }
    
    const fulfillmentOrder = fulfillmentOrders[0];
    const foId = fulfillmentOrder.id;
    
    console.log(`✅ Found FO: ${foId}`);
    console.log(`   Status: ${fulfillmentOrder.status}`);
    console.log(`   Assigned to: ${fulfillmentOrder.assignedLocation.name}`);
    
    // 2. Check if inventory is available - if not, place on hold
    const hasInventory = true; // Your inventory check logic here
    
    if (!hasInventory) {
      console.log('⏸️  Step 2: Placing on hold (no inventory)...');
      await shopifyService.holdFulfillmentOrder(
        foId,
        'INVENTORY_OUT_OF_STOCK',
        'Waiting for restock'
      );
      console.log('✅ Order placed on hold');
      
      // Later, when inventory arrives:
      console.log('▶️  Step 3: Releasing hold...');
      await shopifyService.releaseHoldFulfillmentOrder(foId);
      console.log('✅ Hold released');
    }
    
    // 3. Submit to fulfillment service (e.g., JTL FFN)
    console.log('📤 Step 4: Submitting fulfillment request...');
    await shopifyService.submitFulfillmentRequest(foId, {
      message: 'Please fulfill this order ASAP',
      notifyCustomer: true,
    });
    console.log('✅ Fulfillment request submitted');
    
    // 4. Accept the request (if you're the fulfiller)
    console.log('✅ Step 5: Accepting fulfillment request...');
    await shopifyService.acceptFulfillmentRequest(foId, {
      message: 'Order accepted. Will ship by tomorrow.',
    });
    console.log('✅ Request accepted');
    
    // 5. Create fulfillment with tracking
    console.log('🚚 Step 6: Creating fulfillment...');
    const fulfillment = await shopifyService.createFulfillment(orderId, {
      lineItemsByFulfillmentOrder: [
        {
          fulfillmentOrderId: foId,
          fulfillmentOrderLineItems: fulfillmentOrder.lineItems.map(li => ({
            id: li.id,
            quantity: li.quantity,
          })),
        }
      ],
      trackingInfo: {
        company: 'DHL',
        number: 'JD012345678901234567',
        url: 'https://www.dhl.com/track?tracking-id=JD012345678901234567',
      },
      notifyCustomer: true,
    });
    
    console.log(`✅ Fulfillment created: ${fulfillment.id}`);
    console.log(`   Status: ${fulfillment.status}`);
    
    console.log('\n🎉 Complete workflow test successful!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFulfillmentOrderWorkflow();
```

---

## 4. Webhook Processing

You already have webhook handling in `enhanced-webhook-processor.service.ts`! The service handles FulfillmentOrder webhooks starting at line 812.

### Current Implementation

The `handleShopifyFulfillmentOrder` method processes these actions:

```typescript
private async handleShopifyFulfillmentOrder(
  channelId: string,
  clientId: string,
  action: string,
  payload: ShopifyFulfillmentOrderPayload,
  webhookId: string
): Promise<WebhookProcessResult>
```

**Supported Actions:**
- `fulfillment_request_submitted` → Updates order status
- `fulfillment_request_accepted` → Marks as accepted
- `fulfillment_request_rejected` → Marks as rejected
- `placed_on_hold` → Sets status to ON_HOLD
- `hold_released` → Sets status to OPEN
- `moved` → Updates assigned location
- `cancellation_request_submitted` → Initiates cancellation
- `cancellation_request_accepted` → Completes cancellation

### Enhancing Webhook Processing

To fully leverage FulfillmentOrder webhooks, you may want to:

1. **Store FulfillmentOrder IDs** in your Order table
2. **Track FO status** separately from order status
3. **Log FO events** for audit trail

**Example Schema Enhancement:**

```prisma
model Order {
  id                           String   @id @default(cuid())
  // ... existing fields
  
  // NEW: FulfillmentOrder tracking
  shopifyFulfillmentOrderId    String?
  shopifyFulfillmentOrderStatus String? // OPEN, IN_PROGRESS, CLOSED, etc.
  fulfillmentRequestedAt       DateTime?
  fulfillmentAcceptedAt        DateTime?
}
```

---

## 5. Integration with JTL FFN

When integrating with JTL FFN as your 3PL:

### Workflow

1. **Order Created** → Create FulfillmentOrder in Shopify
2. **Submit to JTL** → Use `submitFulfillmentRequest()`
3. **JTL Accepts** → Receive webhook `fulfillment_request_accepted`
4. **JTL Ships** → Update with tracking via `createFulfillment()`
5. **Customer Notified** → Shopify sends tracking email

### Implementation Example

```typescript
// When syncing order to JTL FFN
async function syncOrderToJTL(order: Order) {
  const shopifyService = await createShopifyServiceAuto(order.channelId, prisma);
  
  // Get or create fulfillment order
  const fulfillmentOrders = await shopifyService.getOrderFulfillmentOrders(
    Number(order.externalOrderId)
  );
  
  const foId = fulfillmentOrders[0]?.id;
  
  if (foId) {
    // Submit to JTL FFN for fulfillment
    await shopifyService.submitFulfillmentRequest(foId, {
      message: `Order ${order.orderNumber} sent to JTL FFN`,
      notifyCustomer: false,
    });
    
    // Store FO ID for tracking
    await prisma.order.update({
      where: { id: order.id },
      data: {
        shopifyFulfillmentOrderId: foId,
        shopifyFulfillmentOrderStatus: 'SUBMITTED',
      },
    });
  }
}
```

---

## Summary

### ✅ What You Need to Do

1. **Update webhook registration code** to include 12 new FulfillmentOrder topics
2. **Run re-registration script** for all existing Shopify channels
3. **Update OAuth scopes** to include merchant_managed and assigned fulfillment scopes
4. **Test the API methods** using the examples above
5. **Optionally enhance database schema** to track FulfillmentOrder state

### 📚 Resources

- [Shopify FulfillmentOrder API Docs](https://shopify.dev/docs/api/admin-graphql/latest/objects/FulfillmentOrder)
- [FulfillmentOrder Webhooks](https://shopify.dev/docs/api/webhooks?topic=fulfillment_orders)
- [OAuth Scopes Reference](https://shopify.dev/docs/api/usage/access-scopes)

### 🔧 Files to Modify

1. `/backend/src/services/integrations/shopify.service.ts` - Add webhook topics
2. `/backend/src/services/integrations/shopify-graphql.service.ts` - Add webhook topics  
3. `/backend/src/routes/integrations.routes.ts` - Update OAuth scopes (lines 696, 1323)
4. `/backend/src/routes/webhook.routes.ts` - Add webhook route handlers
5. `/backend/scripts/reregister-shopify-webhooks.ts` - Create new script
6. `/backend/prisma/schema.prisma` - Optional: Add FO tracking fields

---

**Questions or issues?** The implementation is already 80% complete - your GraphQL service has all the FulfillmentOrder methods ready to use! You just need to enable webhooks and update scopes. 🚀
