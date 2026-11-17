'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, backendEnabled } from '@/lib/config';

let client: SupabaseClient | null = null;
/** null in demo mode */
export function supabaseBrowser(): SupabaseClient | null {
  if (!backendEnabled) return null;
  return (client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY));
}
