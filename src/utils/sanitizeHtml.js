import DOMPurify from 'dompurify';

const RICH_HTML_OPTIONS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  // Forbid inline event handlers (XSS via attributes)
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onmouseenter',
    'onmouseleave',
    'onkeydown',
    'onkeyup',
    'onkeypress',
  ],
};

const TEXT_HTML_OPTIONS = {
  // Plain-text mode: strip all tags/attrs
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

export function sanitizeHtml(dirtyHtml, { mode = 'rich' } = {}) {
  const input = dirtyHtml ?? '';
  if (mode === 'text') {
    return DOMPurify.sanitize(String(input), TEXT_HTML_OPTIONS);
  }

  // Default to rich mode
  return DOMPurify.sanitize(String(input), RICH_HTML_OPTIONS);
}

