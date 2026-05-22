import { describe, expect, it, vi } from 'vitest';

const hostileName = '\\"\\><img src=x onerror=alert(1)>';
const rpcResult = vi.hoisted(() => ({
  current: {
    data: null,
    error: null,
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async () => rpcResult.current,
  }),
}));

import handler from '../profile-meta.js';
import { createMockReq, createMockRes } from '../../test/utils/mockReqRes.js';

describe('/api/profile-meta', () => {
  it('escapes/encodes user-controlled values in HTML output', async () => {
    rpcResult.current = {
      data: {
        display_name: hostileName,
        display_photo_url: null,
        dx_display_photo_url: null,
        is_public: true,
      },
      error: null,
    };

    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

    const req = createMockReq({
      query: { slug: 'testslug' },
      headers: { host: 'example.com' },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(200);
    expect(res._state.headers['content-type']).toBe('text/html');

    const html = String(res._state.body);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror=');
    expect(html).not.toContain(hostileName);
    expect(html).toContain('&lt;img');
    expect(html).toContain('window.location.assign(');
  });

  it('does not emit metadata for a restricted profile', async () => {
    rpcResult.current = {
      data: {
        is_public: false,
        is_restricted: true,
      },
      error: null,
    };

    const req = createMockReq({ query: { slug: 'private-player' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(404);
    expect(res._state.body).toBe('Profile not found');
  });
});

