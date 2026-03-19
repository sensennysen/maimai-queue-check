import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export function sanitizeHtml(dirtyHtml) {
  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
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
  });
}

