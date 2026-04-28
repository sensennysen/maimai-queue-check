import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => []),
}));

import { lookup } from 'node:dns/promises';
import handler from '../proxy.js';
import { createMockReq, createMockRes } from '../../test/utils/mockReqRes.js';

describe('/api/proxy', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

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
    expect(res._state.headers['x-content-type-options']).toBe('nosniff');
    expect(res._state.body).toBeInstanceOf(Buffer);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects disallowed content-types', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: {
        get: (key) => (String(key).toLowerCase() === 'content-type' ? 'text/html' : null),
      },
    }));

    vi.stubGlobal('fetch', fetchMock);

    const req = createMockReq({ query: { url: 'https://example.com/exploit.html' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(403);
    expect(res._state.body).toEqual({ error: 'Content type not allowed' });
  });

  it('rejects large payloads via content-length', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: {
        get: (key) => ({
          'content-type': 'image/png',
          'content-length': '10000000' // 10MB
        }[key.toLowerCase()]),
      },
    }));

    vi.stubGlobal('fetch', fetchMock);

    const req = createMockReq({ query: { url: 'https://example.com/huge.png' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(413);
  });

  it('terminates on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    }));

    const req = createMockReq({ query: { url: 'https://example.com/slow.png' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(504);
  });

  it('rejects non-http(s) schemes with 400', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const req = createMockReq({ query: { url: 'file:///etc/passwd' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks localhost / loopback targets without calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const req = createMockReq({ query: { url: 'http://127.0.0.1/test.png' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res._state.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks a hostname that resolves to loopback/private IP (DNS)', async () => {
    lookup.mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const req = createMockReq({ query: { url: 'https://evil.test/test.png' } });
    const res = createMockRes();

    await handler(req, res);

    expect(lookup).toHaveBeenCalledOnce();
    expect(res._state.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

