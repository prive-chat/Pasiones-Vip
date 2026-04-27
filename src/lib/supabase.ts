import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean URL: remove trailing slashes or /rest/v1 if accidentally included
const supabaseUrl = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('CRITICAL: Supabase credentials missing or invalid. Current URL:', supabaseUrl);
}

// Safe function to get hostname for storage key
const getSafeHostname = (url: string) => {
  try {
    if (!url || !url.startsWith('http')) return 'pasiones';
    return new URL(url).hostname.split('.')[0];
  } catch (e) {
    return 'pasiones';
  }
};

// Set a clean storage key
const storageKey = `sb-${getSafeHostname(supabaseUrl)}-auth-token`;

export const supabase = createClient(
  supabaseUrl || 'https://vqbupjnuveflshlhsmjz.supabase.co',
  supabaseAnonKey,
  {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce' 
    }
  }
);
