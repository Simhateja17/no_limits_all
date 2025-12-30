# Bi-Directional Product Sync System

## Overview

This system implements **true bi-directional product sync** between:
- **No-Limits Platform** (central hub)
- **Shopify**
- **WooCommerce**
- **JTL-FFN** (Fulfillment)

Products can be created and edited in **any platform**, and changes automatically sync to all others while preventing infinite loops and respecting field ownership rules.

---

## 🎯 Core Principles

### 1. **Both Sides Can Create/Edit**
- Merchants can create products in Shopify/WooCommerce
- Merchants can create products in No-Limits
- Changes sync automatically in both directions

### 2. **Origin Tracking** (Loop Prevention)
Every update stores:
```typescript
lastUpdatedBy: 'SHOPIFY' | 'WOOCOMMERCE' | 'NOLIMITS' | 'JTL' | 'SYSTEM'
lastUpdatedAt: DateTime
```

When a webhook arrives, we check:
- If it matches our recent outbound sync → **IGNORE** (echo detection)
- Else → **PROCESS** the incoming change

### 3. **Field-Level Ownership**

#### 🟢 Commerce-Owned (Shopify/WooCommerce Authoritative)
- `netSalesPrice` (price)
- `compareAtPrice` (sale price)
- `taxable`
- `seoTitle`, `seoDescription`
- `tags`, `collections`, `categories`
- `productType`, `vendor`

#### 🔵 Ops/Warehouse-Owned (No-Limits Authoritative)
- `sku`, `gtin` (barcode), `han`
- `weightInKg`, `heightInCm`, `lengthInCm`, `widthInCm`
- `packagingUnit`, `packagingQty`
- `hazmat`, `hazmatClass`
- `warehouseNotes`, `storageLocation`
- `minStockLevel`, `reorderPoint`
- `customsCode`, `countryOfOrigin`, `manufacturer`

#### ⚪ Shared (Last-Write-Wins)
- `name`, `description`
- `imageUrl`, `images`
- `isActive`

#### 🟡 Stock (Ops/JTL Only)
- `available`, `reserved`, `announced`
- **Never** overwritten by commerce platforms

### 4. **Conflict Rules Are Deterministic**

When the same field is updated within 5 minutes from different origins:
- **Commerce fields**: Prefer Shopify/WooCommerce
- **Ops fields**: Prefer No-Limits
- **Shared fields**: Last-write-wins (with conflict log)
- **Stock**: Only No-Limits/JTL can update

### 5. **Async, Idempotent Sync**

- All sync operations are queued asynchronously
- Jobs are processed in batches with retry logic
- Exponential backoff for failed jobs
- Deduplication prevents duplicate processing

---

## 📐 Architecture

```
Shopify    /  WooCommerce
   ▲                    │
   │ Webhooks   │ API Push
   │                     ▼
         Your Platform (Source Controller)
                  ┌───────────────┐
                  │ ProductSync   │
                  │ Service       │
                  │ - Origin      │
                  │   Tracking    │
                  │ - Field       │
                  │   Ownership   │
                  └───────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
       Shopify    WooCommerce    JTL-FFN
                                (Fulfillment)
```

---

## 🔄 Sync Flows

### A) Merchant Creates Product in Shopify

1. **Shopify** → Webhook → **No-Limits**
2. **ProductSyncService** receives webhook
3. Check if echo (recently pushed from us?) → **NO**
4. Extract commerce-owned fields
5. Create/update product in DB
6. Set `lastUpdatedBy = 'SHOPIFY'`
7. Queue jobs:
   - Push to **WooCommerce** (if linked)
   - Push to **JTL** (ops fields only)
8. Background processor executes jobs

### B) Merchant Edits Product in No-Limits

1. **No-Limits UI** → API → **ProductSyncService**
2. Update product in DB
3. Set `lastUpdatedBy = 'NOLIMITS'`
4. Queue jobs:
   - Push to **Shopify** (commerce + shared fields)
   - Push to **WooCommerce** (commerce + shared fields)
   - Push to **JTL** (ops fields)
5. Shopify/WooCommerce receive updates
6. Webhooks fire back to No-Limits
7. **Echo detection**: Check recent sync log → **IGNORE**

### C) JTL Updates Stock

1. **JTL Polling Service** checks stock every 2 minutes
2. Detect stock change (e.g., order fulfilled)
3. Update product:
   ```typescript
   available: 45 → 42
   lastUpdatedBy = 'JTL'
   ```
4. Queue jobs:
   - Push stock to **Shopify**
   - Push stock to **WooCommerce**
5. Commerce platforms show updated stock

---

## 🛠️ Implementation Components

### 1. Database Schema

#### Product Model (Enhanced)
```prisma
model Product {
  // ... existing fields ...
  
  // Commerce-owned fields
  compareAtPrice  Decimal?
  taxable         Boolean   @default(true)
  seoTitle        String?
  seoDescription  String?
  tags            String[]  @default([])
  collections     String[]  @default([])
  productType     String?
  vendor          String?
  
  // Ops-owned fields
  packagingUnit   String?
  packagingQty    Int       @default(1)
  hazmat          Boolean   @default(false)
  hazmatClass     String?
  warehouseNotes  String?
  storageLocation String?
  minStockLevel   Int       @default(0)
  reorderPoint    Int       @default(0)
  
  // Sync tracking
  lastUpdatedBy     SyncOrigin  @default(NOLIMITS)
  lastSyncedAt      DateTime?
  syncStatus        SyncStatus  @default(PENDING)
  syncChecksum      String?
  fieldOwnership    Json?
  lastFieldUpdates  Json?
  
  // JTL integration
  jtlProductId    String?
  jtlSyncStatus   SyncStatus  @default(PENDING)
  
  // Relations
  syncLogs        ProductSyncLog[]
  syncQueue       ProductSyncQueue[]
}
```

#### ProductSyncLog (Audit Trail)
```prisma
model ProductSyncLog {
  id              String      @id @default(cuid())
  action          String      // "create", "update", "delete", "conflict"
  origin          SyncOrigin
  targetPlatform  String      // "shopify", "woocommerce", "jtl"
  changedFields   String[]
  oldValues       Json?
  newValues       Json?
  success         Boolean
  errorMessage    String?
  createdAt       DateTime    @default(now())
}
```

#### ProductSyncQueue (Async Jobs)
```prisma
model ProductSyncQueue {
  id              String      @id @default(cuid())
  operation       String      // "push_to_shopify", "push_to_woocommerce", "push_to_jtl"
  priority        Int         @default(0)
  triggerOrigin   SyncOrigin
  triggerEventId  String?
  status          String      @default("pending")
  attempts        Int         @default(0)
  maxAttempts     Int         @default(3)
  scheduledFor    DateTime    @default(now())
}
```

### 2. ProductSyncService

**Location**: [`/backend/src/services/integrations/product-sync.service.ts`](/Users/teja/no_limits/backend/src/services/integrations/product-sync.service.ts)

#### Key Methods:

**Incoming Sync (Platform → No-Limits)**
```typescript
async processIncomingProduct(
  origin: 'shopify' | 'woocommerce',
  clientId: string,
  channelId: string,
  data: IncomingProductData,
  webhookEventId?: string
): Promise<ProductSyncResult>
```

**Outgoing Sync (No-Limits → Platforms)**
```typescript
async pushProductToAllPlatforms(
  productId: string,
  origin: 'nolimits' | 'system' = 'nolimits',
  options?: {
    skipPlatforms?: string[];
    fieldsToSync?: string[];
  }
): Promise<ProductSyncResult>
```

**Queue Management**
```typescript
async queueSyncToOtherPlatforms(
  productId: string,
  triggerOrigin: string,
  triggerEventId?: string
): Promise<void>
```

### 3. EnhancedWebhookProcessor

**Location**: [`/backend/src/services/integrations/enhanced-webhook-processor.service.ts`](/Users/teja/no_limits/backend/src/services/integrations/enhanced-webhook-processor.service.ts)

Handles incoming webhooks from Shopify/WooCommerce with:
- Deduplication (prevents duplicate processing)
- Echo detection (ignores our own updates)
- Field ownership enforcement
- Async queue triggering

### 4. SyncQueueProcessor

**Location**: [`/backend/src/services/integrations/sync-queue-processor.service.ts`](/Users/teja/no_limits/backend/src/services/integrations/sync-queue-processor.service.ts)

Background job processor:
- Polls queue every 5 seconds
- Processes jobs in batches (default: 10)
- Retry logic with exponential backoff
- Metrics and monitoring

### 5. JTLPollingService

**Location**: [`/backend/src/services/integrations/sync-queue-processor.service.ts`](/Users/teja/no_limits/backend/src/services/integrations/sync-queue-processor.service.ts)

Polls JTL-FFN for updates (webhooks not supported):
- Stock level changes
- Product updates
- Runs every 2 minutes (configurable)

---

## 📡 API Endpoints

### Product Sync Status

```bash
GET /api/integrations/product-sync/status/:clientId
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "synced": 145,
    "pending": 3,
    "conflict": 1,
    "error": 1,
    "lastSyncAt": "2025-01-15T10:30:00Z"
  }
}
```

### Get Field Ownership Config

```bash
GET /api/integrations/product-sync/field-ownership
```

### Sync Product to All Platforms

```bash
POST /api/integrations/product-sync/product/:productId/sync
{
  "skipPlatforms": ["woocommerce"]  // Optional
}
```

### Queue Product for Async Sync

```bash
POST /api/integrations/product-sync/product/:productId/queue
{
  "priority": 1  // Optional, higher = more urgent
}
```

### Get Sync Queue Status

```bash
GET /api/integrations/product-sync/product/:productId/queue-status
```

Response:
```json
{
  "success": true,
  "data": {
    "pending": 2,
    "processing": 1,
    "completed": 10,
    "failed": 0,
    "jobs": [
      {
        "id": "job_123",
        "operation": "push_to_shopify",
        "status": "processing",
        "attempts": 1,
        "scheduledFor": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Get Conflicts

```bash
GET /api/integrations/product-sync/conflicts/:clientId
```

### Resolve Conflict

```bash
POST /api/integrations/product-sync/conflicts/:productId/resolve
{
  "resolution": "accept_local" | "accept_remote" | "merge",
  "mergeData": {
    "name": "Merged Name",
    "price": 29.99
  }
}
```

### Create Product and Sync

```bash
POST /api/integrations/product-sync/create
{
  "clientId": "client_123",
  "name": "New Product",
  "sku": "PROD-001",
  "price": 19.99,
  "quantity": 100,
  "channelIds": ["channel_shopify", "channel_woo"]  // Optional
}
```

### Get Sync Logs

```bash
GET /api/integrations/product-sync/product/:productId/logs?limit=20&offset=0
```

### Full Sync for Client

```bash
POST /api/integrations/product-sync/client/:clientId/full-sync
```

---

## 🎛️ Configuration

### Environment Variables

```env
# Shopify
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Queue Processor
SYNC_QUEUE_BATCH_SIZE=10
SYNC_QUEUE_POLL_INTERVAL_MS=5000
SYNC_MAX_RETRIES=3

# JTL Polling
JTL_POLL_INTERVAL_MS=120000  # 2 minutes
```

### Code Configuration

**In `initializeEnhancedSync()`:**
```typescript
syncQueueProcessor = new SyncQueueProcessor(prisma, {
  batchSize: 10,
  pollIntervalMs: 5000,
  maxRetries: 3,
  retryDelayMs: 60000,
  retryBackoffMultiplier: 2,
});

jtlPollingService = new JTLPollingService(
  prisma, 
  2 * 60 * 1000  // 2 minutes
);
```

---

## 🚀 Deployment

### 1. Database Migration

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 2. Start Server

The enhanced sync processors start automatically:

```bash
npm run dev
```

Output:
```
✅ Enhanced product sync system initialized
🔄 Enhanced sync processors started:
   - Sync Queue Processor (batch size: 10, interval: 5s)
   - JTL Polling Service (interval: 2min)
✨ All systems operational!
```

### 3. Webhook Setup

#### Shopify

Configure webhooks in Shopify Admin:
- URL: `https://your-domain.com/api/integrations/webhooks/shopify-enhanced/products/create`
- Topics:
  - `products/create`
  - `products/update`
  - `products/delete`
  - `inventory_levels/update`

#### WooCommerce

Use WooCommerce REST API or plugins:
- URL: `https://your-domain.com/api/integrations/webhooks/woocommerce-enhanced/product.created`
- Topics:
  - `product.created`
  - `product.updated`
  - `product.deleted`

---

## 🧪 Testing

### Test Echo Detection

1. Create product in No-Limits
2. Watch logs: Should push to Shopify
3. Shopify webhook fires back
4. Logs should show: `Skipping echo from our own update`

### Test Field Ownership

1. Update price in Shopify → Should sync to No-Limits
2. Update warehouse notes in No-Limits → Should **NOT** sync to Shopify
3. Update warehouse notes in No-Limits → Should sync to JTL

### Test Conflict Resolution

1. Update product name in Shopify
2. **Immediately** update product name in No-Limits (within 5 min)
3. Check `/conflicts` endpoint
4. Should show conflict with both values
5. Resolve manually

---

## 🎯 Best Practices

### 1. Monitor Sync Status

```typescript
// Check overall health
GET /api/integrations/product-sync/status/:clientId

// Check queue metrics
GET /api/integrations/product-sync/metrics
```

### 2. Review Conflicts Regularly

```typescript
// Get conflicts
GET /api/integrations/product-sync/conflicts/:clientId

// Auto-resolve or manual review
POST /api/integrations/product-sync/conflicts/:productId/resolve
```

### 3. Clean Up Old Jobs

```typescript
// In production, schedule daily cleanup
syncQueueProcessor.cleanupOldJobs(7);  // Remove jobs older than 7 days
```

### 4. Field Ownership Exceptions

If you need custom ownership rules:

```typescript
// In product-sync.service.ts
const FIELD_OWNERSHIP = {
  commerce: ['price', ...],
  ops: ['sku', ...],
  shared: ['name', ...],
  
  // Custom rules per client (future enhancement)
  customRules: {
    'client_123': {
      price: 'ops'  // This client manages price internally
    }
  }
};
```

---

## 🐛 Troubleshooting

### Products Not Syncing

1. Check sync status: `GET /api/integrations/product-sync/status/:clientId`
2. Check queue: `GET /api/integrations/product-sync/product/:productId/queue-status`
3. Review logs: `GET /api/integrations/product-sync/product/:productId/logs`

### Infinite Loops

- Should be prevented by echo detection
- Check logs for repeated webhook processing
- Verify `lastUpdatedBy` is being set correctly

### Stock Not Updating

- JTL polling service should run every 2 minutes
- Check JTL credentials are valid
- Review JTL-specific logs

---

## 📚 Reference

### Sync Origins

- `NOLIMITS`: Created/edited in No-Limits platform
- `SHOPIFY`: Created/edited in Shopify
- `WOOCOMMERCE`: Created/edited in WooCommerce
- `JTL`: Created/edited in JTL-FFN
- `SYSTEM`: System-generated (migrations, scripts)

### Sync Statuses

- `SYNCED`: All platforms in sync
- `PENDING`: Sync queued/in progress
- `CONFLICT`: Requires manual resolution
- `ERROR`: Sync failed after retries

### Queue Job Statuses

- `pending`: Waiting to be processed
- `processing`: Currently being executed
- `completed`: Successfully synced
- `failed`: Failed after max retries
- `skipped`: Skipped (e.g., duplicate)

---

## 🎓 Advanced Topics

### Custom Field Mapping

For platform-specific fields, store in `platformData`:

```typescript
productChannel.platformData = {
  shopify: {
    inventory_item_id: 12345,
    variant_id: 67890
  },
  woocommerce: {
    product_id: 999,
    variation_id: null
  }
}
```

### Batch Operations

For bulk imports:

```typescript
// Import 1000 products
for (const batch of chunks(products, 100)) {
  await Promise.all(
    batch.map(p => productSyncService.processIncomingProduct(...))
  );
  await new Promise(r => setTimeout(r, 1000));  // Rate limiting
}
```

### Multi-Warehouse Support

When integrating multiple JTL warehouses:

```typescript
// Track warehouse-specific stock
product.warehouseStock = {
  'warehouse_1': { available: 50, reserved: 5 },
  'warehouse_2': { available: 30, reserved: 2 }
}
```

---

## ✅ Checklist for Production

- [ ] Database migration applied
- [ ] Webhooks configured (Shopify, WooCommerce)
- [ ] JTL OAuth connected
- [ ] Environment variables set
- [ ] Background processors running
- [ ] Monitoring/alerts setup
- [ ] Conflict resolution workflow defined
- [ ] Client onboarding documentation
- [ ] Testing completed
- [ ] Backup strategy in place

---

## 🤝 Support

For issues or questions:
1. Check logs: `/api/integrations/product-sync/product/:id/logs`
2. Review queue status: `/api/integrations/product-sync/product/:id/queue-status`
3. Contact support with product ID and sync log details

---

**Built with ❤️ using:**
- Prisma ORM
- Express.js
- TypeScript
- PostgreSQL
- Shopify/WooCommerce/JTL APIs
