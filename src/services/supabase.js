/**
 * SUPABASE SERVICE FACADE
 * 
 * This file maintains backward compatibility by re-exporting all services
 * from the new domain-specific modules in the ./supabase directory.
 * 
 * New code should ideally import directly from the sub-modules, e.g.:
 * import { authService } from './supabase/auth';
 */

export { supabase } from './supabase/client';
export * from './supabase/auth';
export * from './supabase/profile';
export * from './supabase/queue';
export * from './supabase/admin';
export * from './supabase/contact';
export * from './supabase/import';
export * from './supabase/discussion';
export * from './supabase/audit';
export * from './supabase/follow';
export * from './supabase/feed';
export * from './supabase/playlist';
