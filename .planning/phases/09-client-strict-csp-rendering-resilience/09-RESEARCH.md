# Phase 09: Client Strict CSP & Rendering Resilience - Research

## Standard Stack

*   **CSP Generation (Development):** A custom Vite `transformIndexHtml` plugin hook OR `vite-plugin-csp-guard` that calculates SHA-256 hashes for Vite's inline scripts and injects the CSP `<meta>` tag into `index.html`.
*   **Concurrency Limiting:** `p-limit` (an industry-standard, lightweight library by Sindre Sorhus) for throttling simultaneous Promise executions on the frontend.

## Architecture Patterns

*   **Vite Strictly-Hashed CSP:** Instead of fighting Vite's dev server by hand, dynamically inject a `Content-Security-Policy` meta tag during the `transformIndexHtml` phase in Vite. Capture any inline `<script>` or `<style>` tags Vite injects (especially for React Refresh HMR), hash their exact contents (`sha256-...`), and append those hashes to the `script-src` and `style-src` directives. This allows strict CSP in local dev without resorting to `unsafe-inline` or `unsafe-eval`.
*   **Promise Pooling / Throttling:** Wrap the `api/proxy` fetch calls inside a `p-limit` queue configured with a safe cap (e.g., 5-10 concurrent requests). This turns `Promise.all` from a thundering herd into a controlled stream.

## Don't Hand-Roll

*   **Concurrency Queues:** Do not build a custom `Promise.race()` generic queue processor. Use `p-limit` which handles edge cases and is battle-tested.
*   **HTML Metatag Injection:** Do not struggle to manually maintain hashes in `index.html` as Vite's preamble changes. Write a Vite plugin snippet that reads the base CSP and dynamically attaches development hashes.

## Common Pitfalls

*   **Vite HMR Breakage:** Vite's internal React Refresh preamble is an inline script. Without `unsafe-inline` or a specific hash dynamically generated during local serve, HMR will break silently or throw CSP console errors.
*   **`eval()` inside Dependencies:** If any third-party dependencies use `eval()`, they will instantly crash under strict CSP. Double-check older dependencies.
*   **`Promise.all` Thundering Herd:** Using `Promise.all` on an array of 50 proxy fetches will dispatch all 50 network requests simultaneously. This can cause Vercel Functions to rate-limit (HTTP 429) or silently timeout, resulting in broken or incomplete canvas renders.

## Code Examples

### Vite CSP Transform Plugin
```javascript
import crypto from 'crypto';

export function strictCspPlugin() {
  return {
    name: 'strict-csp',
    transformIndexHtml(html) {
      // Extract inline scripts, hash them, and inject meta CSP
      const scriptRegex = /<script(?:.*?)>(.*?)<\/script>/gs;
      let match;
      const hashes = [];
      while ((match = scriptRegex.exec(html)) !== null) {
        if (match[1].trim()) {
          const hash = crypto.createHash('sha256').update(match[1]).digest('base64');
          hashes.push(`'sha256-${hash}'`);
        }
      }
      
      const csp = `default-src 'self'; script-src 'self' ${hashes.join(' ')};`;
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`);
    }
  };
}
```

### Limiting Concurrency with p-limit
```javascript
import pLimit from 'p-limit';

const limit = pLimit(5); // Only 5 concurrent proxy requests at a time

await Promise.all(
  imageArray.map((img) => 
    limit(async () => {
      // Fetch proxy logic for image localization here
      const response = await fetch(\`/api/proxy?url=\${encodeURIComponent(img.src)}\`);
      // ...
    })
  )
);
```
