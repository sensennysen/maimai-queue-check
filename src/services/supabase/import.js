import { supabase } from './client';

/**
 * Import sessions: the app creates a row (pending), the bookmarklet POSTs payload to the
 * Edge Function which updates the row (complete). RLS must allow: INSERT where user_id = auth.uid();
 * SELECT where user_id = auth.uid(). The Edge Function uses the service role to update by id.
 */
const SESSION_TTL_MINUTES = 15;

/**
 * Generate a short, URL-safe session token (e.g. for display in the app and entry in the bookmarklet).
 * @returns {string}
 */
function generateSessionToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Create a new import session for the current user. The returned token is shown in the app
 * and entered in the bookmarklet overlay; the bookmarklet then POSTs the scraped payload
 * to the Edge Function with this token.
 *
 * RLS must allow: INSERT for authenticated user (user_id = auth.uid()), SELECT for own rows.
 *
 * @param {string} userId
 * @returns {Promise<{ token: string, expiresAt: string }>}
 */
export async function createImportSession(userId) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('import_sessions')
    .insert({
      id: token,
      user_id: userId,
      status: 'pending',
      expires_at: expiresAt
    });

  if (error) throw error;
  return { token, expiresAt };
}

/**
 * Fetch an import session by token (for polling). Only returns rows owned by the current user (RLS).
 *
 * @param {string} token
 * @returns {Promise<{ status: string, payload: unknown } | null>}
 */
export async function getImportSession(token) {
  const { data, error } = await supabase
    .from('import_sessions')
    .select('status, payload')
    .eq('id', token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Delete an import session (e.g. after successful processing or when expired).
 * Keeps the table small and avoids retaining sensitive payloads.
 * RLS must allow DELETE for rows where user_id = auth.uid().
 *
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function deleteImportSession(token) {
  const { error } = await supabase
    .from('import_sessions')
    .delete()
    .eq('id', token);

  if (error) throw error;
}
