# 🚀 Supabase Realtime Migration Guide

## What I've Done So Far ✅

### 1. **Installed Supabase Client**
- ✅ Added `@supabase/supabase-js` to frontend dependencies
- ✅ Location: `/frontend/package.json`

### 2. **Environment Variables**
- ✅ Added Supabase config to `/frontend/.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://ydzikxftogcggykkoetu.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  ```
- ✅ Updated `/frontend/.env.production` with same values

### 3. **Created Supabase Client**
- ✅ File: `/frontend/src/lib/supabase.ts`
- ✅ Configured for Realtime with auth support
- ✅ Includes helper for JWT integration

### 4. **Created Realtime Hook**
- ✅ File: `/frontend/src/lib/hooks/useSupabaseRealtime.ts`
- ✅ Replaces `useSocket` hook
- ✅ Features:
  - Real-time message listening via database changes
  - Presence tracking (online/offline users)
  - Typing indicators via broadcast
  - Automatic reconnection

### 5. **Updated Chat Component**
- ✅ File: `/frontend/src/app/admin/chat/page_supabase.tsx`
- ✅ Uses new `useSupabaseRealtime` hook
- ✅ Same UI, better infrastructure

## What You Need to Do Next 🎯

### STEP 1: Enable Realtime in Supabase Dashboard (CRITICAL!)

**📖 Read the detailed guide:** `/SUPABASE_REALTIME_SETUP.md`

**Quick Steps:**
1. Go to https://supabase.com/dashboard/project/ydzikxftogcggykkoetu
2. Click "Database" → "Replication"
3. Toggle **ON** for `ChatMessage` table

**Or run this SQL:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE "ChatMessage";
```

### STEP 2: Replace Old Chat Components

You have 3 chat pages to update:
1. `/frontend/src/app/admin/chat/page.tsx` (Admin)
2. `/frontend/src/app/client/chat/page.tsx` (Client)
3. `/frontend/src/app/employee/chat/page.tsx` (Employee)

**Option A: Copy from template**
```bash
# For admin
cp /frontend/src/app/admin/chat/page_supabase.tsx \\
   /frontend/src/app/admin/chat/page.tsx
```

**Option B: Make these changes in each file:**

**Replace this import:**
```typescript
// OLD
import { useSocket } from '@/lib/hooks/useSocket';

// NEW
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
```

**Replace the hook usage:**
```typescript
// OLD
const socket = useSocket({
  token: token || undefined,
  autoConnect: !!token,
});

// Join room
useEffect(() => {
  if (!selectedContact || !socket.isConnected) return;
  socket.joinRoom(selectedContact.id);
  return () => socket.leaveRoom(selectedContact.id);
}, [selectedContact, socket]);

// NEW
const { isConnected, typingUsers, sendTypingIndicator, onMessage, onlineUsers } =
  useSupabaseRealtime({
    roomId: selectedContact?.id,
    userId: user?.id,
    userName: user?.name || user?.email,
    enabled: !!selectedContact && isAuthenticated,
  });

// No need for manual join/leave - handled automatically!
```

**Update message listener:**
```typescript
// OLD
const unsubscribe = socket.onMessage((message: ChatMessage) => {
  setMessages((prev) => [...prev, message]);
});

// NEW
const unsubscribe = onMessage((message: ChatMessage) => {
  setMessages((prev) => {
    if (prev.some((msg) => msg.id === message.id)) return prev;
    return [...prev, message];
  });
});
```

**Update typing indicator:**
```typescript
// OLD
socket.emitTyping(roomId, isTyping);

// NEW
sendTypingIndicator(isTyping);
```

### STEP 3: Update Client & Employee Chat Pages

Same pattern as above for:
- `/frontend/src/app/client/chat/page.tsx`
- `/frontend/src/app/employee/chat/page.tsx`

### STEP 4: Remove Socket.IO Code (Backend)

After verifying Supabase Realtime works:

1. **Remove Socket.IO initialization:**
   - File: `/backend/src/index.ts`
   - Delete: `initializeSocket(httpServer)`

2. **Delete Socket.IO service:**
   ```bash
   rm /backend/src/services/socket.ts
   ```

3. **Remove from package.json:**
   ```bash
   cd backend
   npm uninstall socket.io @socket.io/redis-adapter
   ```

4. **Clean up chat controller:**
   - File: `/backend/src/controllers/chat.controller.ts`
   - Remove lines 3, 336-340 (emitToRoom calls)

### STEP 5: Remove Socket.IO Frontend Code

1. **Delete old socket files:**
   ```bash
   rm /frontend/src/lib/socket.ts
   rm /frontend/src/lib/hooks/useSocket.ts
   ```

2. **Uninstall:**
   ```bash
   cd frontend
   npm uninstall socket.io-client
   ```

### STEP 6: Test Everything

**Test Checklist:**
- [ ] Can send messages between Admin and Client
- [ ] Messages appear in real-time without refresh
- [ ] Typing indicators work
- [ ] Online/offline status updates
- [ ] Messages persist after page reload
- [ ] Multiple admins see each other's messages
- [ ] Browser console shows: `📡 Supabase channel status: SUBSCRIBED`

**Test with 2 browser windows:**
1. Window 1: Login as Admin
2. Window 2: Login as Client
3. Send messages back and forth
4. Type to see typing indicators
5. Close one window to see offline status

## Architecture Comparison

### Before (Socket.IO)
```
Frontend → WebSocket → Backend Socket.IO Server → Database
                       ↓
                  Emit to clients
```

### After (Supabase Realtime)
```
Frontend → Supabase Realtime ← Database Triggers
     ↓
  REST API → Backend → Database
```

**Benefits:**
- ✅ No WebSocket server to maintain
- ✅ Auto-reconnection built-in
- ✅ Scales horizontally (no Redis needed)
- ✅ Lower latency (direct DB connection)
- ✅ Built-in presence tracking

## Rollback Plan (If Needed)

If something goes wrong:

1. **Revert chat pages:**
   ```bash
   git checkout main -- frontend/src/app/*/chat/page.tsx
   ```

2. **Keep Socket.IO running** (don't delete backend files yet)

3. **Disable Supabase Realtime** in dashboard

## Common Issues & Solutions

### Issue: "Not subscribed to channel"
**Solution:** Enable Realtime for `ChatMessage` table in Supabase dashboard

### Issue: Messages don't appear in real-time
**Solution:**
1. Check Realtime is enabled
2. Check browser console for errors
3. Verify table name is `ChatMessage` (case-sensitive)

### Issue: "RLS policy violation"
**Solution:** You're using custom JWT auth, not Supabase Auth. Either:
- Use service role key for backend operations
- Disable RLS on chat tables (less secure)
- Create RLS policies that work with your JWT

### Issue: Can't see online users
**Solution:** Presence tracking requires active subscription. Check `isConnected === true`

## Performance Notes

**Supabase Realtime Limits:**
- 100 concurrent connections per project (free tier)
- 10 messages per second per channel
- Upgrade to Pro for more: https://supabase.com/pricing

**Your current usage:**
- ~10-20 concurrent users (well within limit)
- Chat messages are low frequency
- ✅ You're good on free tier for now

## Next Steps After Migration

1. **Add message pagination** (load 50 at a time)
2. **Add unread count** (use `lastReadAt` timestamps)
3. **Add file uploads** (use Supabase Storage)
4. **Add message search** (Supabase full-text search)
5. **Add notifications** (Supabase Edge Functions)

## Support

If you have issues:
1. Check browser console for errors
2. Check Supabase dashboard → Logs
3. Verify environment variables are set
4. Test with `NEXT_PUBLIC_SUPABASE_URL` directly in code

## Summary

**Completed:**
- ✅ Supabase client setup
- ✅ Realtime hook created
- ✅ Example chat page updated

**Remaining (YOU):**
- ⏳ Enable Realtime in Supabase dashboard (5 min)
- ⏳ Update 3 chat pages (15 min)
- ⏳ Test functionality (10 min)
- ⏳ Remove Socket.IO code (5 min)

**Total estimated time: 35 minutes**

Let me know when you're ready to test! 🚀
