# Supabase Realtime Setup Guide

## ⚠️ IMPORTANT: Enable Realtime on Chat Tables

You need to enable Realtime on your `ChatMessage` table in the Supabase dashboard.

### Steps to Enable Realtime:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/ydzikxftogcggykkoetu

2. **Open Database Tab**
   - Click on "Database" in the left sidebar
   - Click on "Replication" submenu

3. **Enable Replication for ChatMessage Table**
   - Find the `ChatMessage` table in the list
   - Toggle the switch to **ON** next to `ChatMessage`
   - This enables real-time broadcasting of INSERT/UPDATE/DELETE events

4. **Verify Configuration**
   - Go to "API" tab
   - Click on "Realtime" section
   - You should see `ChatMessage` listed as enabled

### Alternative: Enable via SQL

You can also enable it by running this SQL in the SQL Editor:

```sql
-- Enable realtime for ChatMessage table
ALTER PUBLICATION supabase_realtime ADD TABLE "ChatMessage";
```

### Test Connection

After enabling, you can test the connection by:

1. Running your frontend app
2. Opening browser console
3. You should see: `📡 Supabase channel status: SUBSCRIBED`

### Troubleshooting

**If messages don't appear in real-time:**

1. Check that Realtime is enabled for `ChatMessage` table
2. Verify environment variables in frontend `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check browser console for connection errors
4. Ensure you're using the correct table name (case-sensitive)

**Common Issues:**

- **403 Forbidden**: Check Row Level Security (RLS) policies
- **Connection timeout**: Check network/firewall settings
- **Messages not appearing**: Verify Realtime is enabled on the table

### Row Level Security (RLS) Policies

Make sure your RLS policies allow reading from `ChatMessage`:

```sql
-- Allow users to read messages in rooms they're participants of
CREATE POLICY "Users can read messages in their rooms"
ON "ChatMessage"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "ChatParticipant"
    WHERE "ChatParticipant"."chatRoomId" = "ChatMessage"."chatRoomId"
    AND "ChatParticipant"."userId" = auth.uid()
  )
);
```

**Note**: Since you're using custom JWT auth (not Supabase Auth), you may need to adjust RLS policies or use service role key for backend operations.

### Next Steps

After enabling Realtime:
1. ✅ Update chat components to use `useSupabaseRealtime` hook
2. ✅ Test message sending and receiving
3. ✅ Remove Socket.IO dependencies
