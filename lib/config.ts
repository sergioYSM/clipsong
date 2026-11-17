// Public config, safe in the browser. The app runs in demo mode (local data,
// no accounts) until the Supabase variables are set.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const backendEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const billingEnabled = backendEnabled && process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true';
