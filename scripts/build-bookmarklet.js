/**
 * Builds public/bookmarklet.js from src/assets/bookmarklet.js by injecting
 * the Supabase Edge Function URL (from VITE_SUPABASE_URL) and optionally minifying.
 * Run before deploy so the bookmarklet knows where to POST import payloads.
 *
 * Requires: VITE_SUPABASE_URL in env or .env (e.g. https://xxx.supabase.co).
 * The Edge Function must be deployed as "receive-import" (or set VITE_IMPORT_FUNCTION_NAME).
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

dotenv.config({ path: join(root, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const functionName = process.env.VITE_IMPORT_FUNCTION_NAME || 'receive-import';
const placeholder = '__IMPORT_EDGE_FUNCTION_URL__';
const edgeUrl = supabaseUrl
  ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`
  : '';

const srcPath = join(root, 'src', 'assets', 'bookmarklet.js');
const outPath = join(root, 'public', 'bookmarklet.js');

let content = readFileSync(srcPath, 'utf8');
content = content.replace(new RegExp(placeholder.replace(/./g, '\\$&'), 'g'), edgeUrl);

writeFileSync(outPath, content, 'utf8');
console.log('Built public/bookmarklet.js' + (edgeUrl ? ` (edge: ${functionName})` : ' (no VITE_SUPABASE_URL)'));
