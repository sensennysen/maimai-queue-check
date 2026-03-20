import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from '../utils/sanitizeHtml.js';

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const out = sanitizeHtml('<div>ok</div><script>alert(1)</script>');
    expect(out).toContain('<div>ok</div>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('removes event handler attributes', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(out).toContain('<img');
    expect(out).not.toContain('onerror=');
    expect(out).not.toContain('alert(1)');
  });

  it('neutralizes javascript: hrefs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).toContain('<a');
    expect(out).toContain('>x</a>');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('alert(1)');
  });

  it('strips all tags/attrs in text mode', () => {
    const out = sanitizeHtml('<p>hi</p>', { mode: 'text' });
    expect(out).toContain('hi');
    // No HTML tags should remain
    expect(out).not.toMatch(/<[^>]+>/);
    expect(out).not.toContain('<p');
  });
});

