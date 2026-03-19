import { describe, expect, it, vi } from 'vitest';

const hostileName = '\\"\\><img src=x onerror=alert(1)>';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              display_name: hostileName,
              display_photo_url: null,
              dx_display_photo_url: null,
              is_public: true,
            },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

import handler from '../profile-meta.js';
import { createMockReq, createMockRes } from '../../test/utils/mockReqRes.js';

describe('/api/profile-meta', () => {
  it('documents current injection risk (unescaped display_name)', async () => {
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
    expect(html).toContain(hostileName);
    expect(html).toContain('<img');
    expect(html).toContain('onerror=');
  });

  it.todo('escapes/encodes user-controlled values in HTML output');
});

