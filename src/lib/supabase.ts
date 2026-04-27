import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Defensive URL check: Must start with http and have reasonable length
const isValidUrl = (url: string) => {
  return url && typeof url === 'string' && url.startsWith('http') && url.length > 10;
};

const FALLBACK_URL = 'https://vqbupjnuveflshlhsmjz.supabase.co';
// Clean and validate URL
let supabaseUrl = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
if (!isValidUrl(supabaseUrl)) {
  supabaseUrl = FALLBACK_URL;
}

const finalAnonKey = isValidUrl(rawUrl) && supabaseAnonKey ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxYnVwam51dmVmbHNobGhzbWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQyNTM4NTgsImV4cCI6MjAzMDIyOTg1OH0.Yp9m_pE-p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p_p';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('CRITICAL: Supabase credentials missing or invalid. Current URL:', supabaseUrl);
}

// Safe function to get hostname for storage key
const getSafeHostname = (url: string) => {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return 'pasiones';
  // Use simple regex to extract hostname instead of new URL() to be extra safe
  const match = url.match(/https?:\/\/([^/:]+)/i);
  if (match && match[1]) {
    return match[1].split('.')[0];
  }
  return 'pasiones';
};

// Set a clean storage key
const storageKey = `sb-${getSafeHostname(supabaseUrl)}-auth-token`;

export const supabase = createClient(
  supabaseUrl,
  finalAnonKey,
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
