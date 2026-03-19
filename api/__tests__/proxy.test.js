import { describe, expect, it, vi } from 'vitest';

import handler from '../proxy.js';
import { createMockReq, createMockRes } from '../../test/utils/mockReqRes.js';

describe('/api/proxy', () => {
  it('returns 400 on missing url', async () => {
    const req = createMockReq({ query: {} });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(400);
    expect(res._state.body).toEqual({ error: 'Missing "url" parameter' });
  });

  it('proxies a buffer and propagates content-type', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (key) => (String(key).toLowerCase() === 'content-type' ? 'image/png' : null),
      },
      arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    }));

    vi.stubGlobal('fetch', fetchMock);

    const req = createMockReq({ query: { url: 'https://example.com/a.png' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(200);
    expect(res._state.headers['content-type']).toBe('image/png');
    expect(res._state.body).toBeInstanceOf(Buffer);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.todo('blocks non-http(s) schemes');
  it.todo('blocks private/loopback/link-local IP targets');
  it.todo('enforces host allowlist');
});

