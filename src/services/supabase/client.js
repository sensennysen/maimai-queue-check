import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Migrate old auth session key to the new 'auth' key
const oldAuth = window.localStorage.getItem('smf-queue-auth');
if (oldAuth) {
  window.localStorage.setItem('auth', oldAuth);
  window.localStorage.removeItem('smf-queue-auth');
}

// Create Supabase client with explicit session persistence configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      // Intentionally limited to 10 events per second globally to constrain
      // client/server load. (PERF-01 tuned constraint)
      eventsPerSecond: 10,
    },
  },
});
