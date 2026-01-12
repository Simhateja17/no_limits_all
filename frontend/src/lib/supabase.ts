/**
 * Supabase Client Configuration
 * Configured for Realtime chat and database access
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client for frontend use
 * Includes Realtime configuration for chat
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for realtime events
    },
  },
  db: {
    schema: 'public',
  },
});

/**
 * Helper to get Supabase auth token from your JWT
 * This allows Row Level Security (RLS) to work with your existing auth
 */
export const setSupabaseAuth = (accessToken: string) => {
  // Set the JWT token for Supabase to use in RLS policies
  supabase.realtime.setAuth(accessToken);
};
