---
wave: 1
depends_on: []
files_modified:
  - vercel.json
  - vite.config.js
autonomous: true
---

# Plan 01: Enforce Strict CSP in Local Development and Production

## Goal
Implement a custom Vite HTML transform plugin to inject a strict Content-Security-Policy during development, removing `unsafe-eval` from local dev and production (`vercel.json`) while supporting Vite HMR through dynamic script hashing. [SEC-06]

## Requirements Coverage
- **SEC-06**: Strict CSP enforcement with restrictive script-src policies, removing unsafe-eval.

## Tasks

### 1. Update `vercel.json` production headers
<read_first>
- e:/git/smf-queue-check/vercel.json
</read_first>

<action>
Modify `vercel.json` to update the `Content-Security-Policy` header in the `"/(.*)"` route.
- Remove `'unsafe-eval'` from the `script-src` directive.
- Ensure the CSP looks like: `"default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co https://*.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com https://www.thebugging.com https://api.allorigins.win https://corsproxy.io https://fonts.googleapis.com https://fonts.gstatic.com https://maimaidx-eng.com https://placehold.co https://mpqcheckph.vercel.app /api/proxy;"`
</action>

<acceptance_criteria>
- `grep -q "'unsafe-eval'" vercel.json` exits with 1 (not found).
</acceptance_criteria>

### 2. Implement strict CSP hash plugin in Vite
<read_first>
- e:/git/smf-queue-check/vite.config.js
</read_first>

<action>
Add a custom plugin `strictCspPlugin()` to `vite.config.js` that transforms the HTML.
1. Import `crypto` from `node:crypto`.
2. Define the plugin:
\`\`\`javascript
function strictCspPlugin() {
  return {
    name: 'strict-csp',
    transformIndexHtml(html) {
      const scriptRegex = /<script(?:.*?)>(.*?)<\\/script>/gs;
      let match;
      const hashes = [];
      while ((match = scriptRegex.exec(html)) !== null) {
        if (match[1].trim()) {
          const hash = crypto.createHash('sha256').update(match[1]).digest('base64');
          hashes.push(\`'sha256-\${hash}'\`);
        }
      }
      const csp = \`default-src 'self'; script-src 'self' 'unsafe-inline' \${hashes.join(' ')} https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co /api/proxy;\`;
      return html.replace('<head>', \`<head>\\n  <meta http-equiv="Content-Security-Policy" content="\${csp}">\`);
    }
  };
}
\`\`\`
3. Add `strictCspPlugin()` to the `plugins` array in the Vite config.
</action>

<acceptance_criteria>
- `grep -q "Content-Security-Policy" vite.config.js` exits 0.
- `grep -q "createHash('sha256')" vite.config.js` exits 0.
</acceptance_criteria>

## Verification
- Start `npm run dev` and ensure no CSP `eval` violations block the rendering of the app in the browser.
- Run `npm run build` successfully.

## Must Haves
- The application MUST boot correctly in local development without throwing `unsafe-eval` errors.
- External scripts MUST gracefully degrade if affected (though most are scoped safely). 
