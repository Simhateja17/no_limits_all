# 🚢 Shipping Methods Testing Guide

## Quick Access

**Direct URL to Shipping Page:**
```
http://localhost:3000/admin/shipping
```

## How to Test in Frontend

### 1. **Login & Access**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login as **ADMIN** or **SUPER_ADMIN**
4. Navigate to: `http://localhost:3000/admin/shipping`

### 2. **What You Can Test**

#### 📦 **Shipping Methods Tab**
- View all JTL shipping methods synced from JTL FFN
- Click **"Sync from JTL"** button to fetch latest shipping methods
- See shipping method details: carrier, shipping type, pricing
- Set default shipping method for clients

#### 🔗 **Channel Mappings Tab**
- Create mappings: Shopify/WooCommerce shipping → JTL shipping method
- Example: Map "Standard Shipping" from Shopify to JTL method "FULF0A0001"
- View existing mappings
- Delete mappings

#### ⚠️ **Shipping Mismatches**
- See alert banner when there are unresolved mismatches
- Click to view orders with unmapped shipping methods
- Resolve mismatches by creating mappings

### 3. **Test Scenarios**

#### ✅ **Scenario 1: Sync JTL Shipping Methods**
```bash
# Via API (requires client with JTL credentials)
curl -X POST http://localhost:3001/api/shipping-methods/jtl/{clientId}/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```
Or use the **"Sync from JTL"** button in the UI

**Expected Result:**
- Shipping methods appear in the table
- Shows JTL IDs like `FULF0A0001`, `FULF0A0002`
- Displays carrier names (DHL, UPS, etc.)

#### ✅ **Scenario 2: Create Channel Mapping**
1. Go to **"Channel Mappings"** tab
2. Click **"Create Mapping"**
3. Fill in:
   - Channel Type: `SHOPIFY`
   - Shipping Code: `standard`
   - Shipping Title: `Standard Shipping`
   - Select JTL Shipping Method from dropdown
4. Save

**Expected Result:**
- Mapping appears in the table
- When order comes in with "standard" shipping code → Mapped to JTL method

#### ✅ **Scenario 3: Test Mismatch Detection**

**Setup:** Remove all mappings for a specific shipping code

**Trigger:** Send order webhook with unmapped shipping method:
```bash
curl -X POST http://localhost:3001/api/integrations/webhooks/shopify \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-order-123",
    "shipping_lines": [{
      "code": "unmapped_express",
      "title": "Express Shipping (Not Mapped)"
    }],
    ...
  }'
```

**Expected Result:**
- Mismatch alert banner appears
- Click to see mismatch details
- If client has default shipping method → **Fallback used** ✅
- If NO default → **Order on hold** ⚠️

#### ✅ **Scenario 4: Resolve Mismatch**
1. Click on mismatch alert
2. Click **"Resolve"** on a mismatch
3. Options:
   - Create mapping for this shipping method
   - Use client's default shipping method
4. Add resolution note
5. Save

**Expected Result:**
- Mismatch marked as resolved
- Order shipping method updated

### 4. **Testing Notifications**

Real-time notifications appear when:
- Order uses fallback shipping method (MEDIUM priority)
- Order put on hold due to unmapped shipping (HIGH priority)

**Check notifications:**
```bash
# Get notifications for logged-in user
curl http://localhost:3001/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl http://localhost:3001/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. **UI Features to Test**

- ✅ **Table sorting** - Click column headers
- ✅ **Search/Filter** - Search by shipping method name or code
- ✅ **Dialog forms** - Create/edit mappings
- ✅ **Badge indicators** - Active/Inactive, Default, JTL-synced
- ✅ **Client default selection** - Dropdown to set fallback shipping
- ✅ **Responsive design** - Test on different screen sizes

---

## 🔧 API Testing (Alternative to UI)

### Get All Shipping Methods
```bash
curl http://localhost:3001/api/shipping-methods \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Mapping
```bash
curl -X POST http://localhost:3001/api/shipping-methods/mappings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelType": "SHOPIFY",
    "channelShippingCode": "standard",
    "channelShippingTitle": "Standard Shipping",
    "shippingMethodId": "clx123...",
    "clientId": "client123"
  }'
```

### Get Mismatches
```bash
curl http://localhost:3001/api/shipping-methods/mismatches \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

**Issue: Page shows blank or error**
- Check browser console for errors
- Verify backend is running: `http://localhost:3001/api/health`
- Ensure you're logged in as ADMIN/SUPER_ADMIN

**Issue: "Sync from JTL" fails**
- Client must have JTL credentials configured
- Check JTL API credentials in client settings
- Verify JTL access token is valid

**Issue: Notifications not appearing**
- Check Socket.IO connection in browser console
- Verify backend Socket.IO is initialized
- Try refreshing the page

---

## 📍 Important Notes

1. **Database Migration Required**: Before testing, ensure database schema is updated:
   ```bash
   cd backend
   npx prisma db push
   ```

2. **Navigation Link**: Currently not in navbar. Access directly via:
   `http://localhost:3000/admin/shipping`

3. **Role Required**: ADMIN or SUPER_ADMIN only

4. **Test Data**: You may need to create test clients and configure JTL credentials first

---

## ✅ Success Checklist

- [ ] Can access shipping page at `/admin/shipping`
- [ ] Can sync shipping methods from JTL FFN
- [ ] Can create channel mappings (Shopify/WooCommerce → JTL)
- [ ] Mismatches are detected when unmapped shipping method arrives
- [ ] Notifications appear for shipping issues
- [ ] Can resolve mismatches via UI
- [ ] Client default shipping method works as fallback
