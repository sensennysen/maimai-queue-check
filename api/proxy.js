// api/proxy.js

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

function isPrivateIpv4(ip) {
  if (ip === '0.0.0.0') return true;
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

  const [a, b] = parts;
  if (a === 127) return true; // loopback 127.0.0.0/8
  if (a === 10) return true; // private 10.0.0.0/8
  if (a === 192 && b === 168) return true; // private 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // private 172.16.0.0/12
  return false;
}

function isPrivateIpv6(ip) {
  const lower = String(ip).toLowerCase();
  if (lower === '::1') return true; // loopback
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true; // link-local fe80::/10
  }
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local fc00::/7
  return false;
}

function isBlockedTargetHost(hostname) {
  const host = String(hostname).toLowerCase();
  if (host === 'localhost') return true;

  const ipFamily = isIP(host);
  if (ipFamily === 4) return isPrivateIpv4(host);
  if (ipFamily === 6) return isPrivateIpv6(host);
  return false;
}

async function resolvesToBlockedIp(hostname) {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.some(({ address }) => isBlockedTargetHost(address));
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT = 5000; // 5 seconds
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid "url" parameter' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http(s) URLs are allowed' });
  }

  const hostname = parsed.hostname;
  if (isBlockedTargetHost(hostname)) {
    return res.status(403).json({ error: 'Target host is not allowed' });
  }

  if (isIP(hostname) === 0) {
    try {
      if (await resolvesToBlockedIp(hostname)) {
        return res.status(403).json({ error: 'Target host is not allowed' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid "url" parameter' });
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    // Use native fetch (available in Node.js 18+)
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the arrayBuffer and content type
    const contentType = response.headers.get('content-type');
    
    if (contentType && !ALLOWED_CONTENT_TYPES.some(type => contentType.startsWith(type))) {
      return res.status(403).json({ error: 'Content type not allowed' });
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      return res.status(413).json({ error: 'Response body too large' });
    }

    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
        return res.status(413).json({ error: 'Response body too large' });
    }

    const buffer = Buffer.from(arrayBuffer);

    // Set standard CORS headers (allowing YOUR app's domain to access it)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Send the image data back to the browser
    return res.send(buffer);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway Timeout' });
    }
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    clearTimeout(timeoutId);
  }
}
