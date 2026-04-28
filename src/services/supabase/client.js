import { createClient } from '@supabase/supabase-js';
import { STORAGE_KEYS } from '../../constants/storage';
import { APP_CONFIG } from '../../constants/config';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Migrate old auth session key to the new 'auth' key
const oldAuth = window.localStorage.getItem(STORAGE_KEYS.LEGACY_AUTH);
if (oldAuth) {
  window.localStorage.setItem(STORAGE_KEYS.AUTH, oldAuth);
  window.localStorage.removeItem(STORAGE_KEYS.LEGACY_AUTH);
}

// Create Supabase client with explicit session persistence configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: STORAGE_KEYS.AUTH,
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      // Intentionally limited to 10 events per second globally to constrain
      // client/server load. (tuned constraint)
      eventsPerSecond: APP_CONFIG.REALTIME_EVENTS_PER_SECOND,
    },
  },
});
