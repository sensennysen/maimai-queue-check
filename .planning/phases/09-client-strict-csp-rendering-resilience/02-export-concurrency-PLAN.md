---
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/pages/ExportBest50Page.jsx
autonomous: true
---

# Plan 02: Implement Proxy Concurrency Limits and Graceful Degradation in Export

## Goal
Enforce a concurrency limit on the Best 50 Image proxy fetch using `p-limit` to prevent overloading Vercel Functions. Handle proxy timeouts by inserting a graceful placeholder icon and notifying the user that the export was incomplete. [PERF-04]

## Requirements Coverage
- **PERF-04**: Export rendering flow enforces proxy concurrency limits and graceful asset degradation to prevent client freezing.

## Tasks

### 1. Add `p-limit` dependency
<read_first>
- e:/git/smf-queue-check/package.json
</read_first>

<action>
Run `npm install p-limit` to add the concurrency library to the project dependencies.
</action>

<acceptance_criteria>
- `cat package.json | grep p-limit` exits 0.
</acceptance_criteria>

### 2. Implement `p-limit` and placeholders in `ExportBest50Page.jsx`
<read_first>
- e:/git/smf-queue-check/src/pages/ExportBest50Page.jsx
</read_first>

<action>
1. Add import: `import pLimit from 'p-limit';`
2. At the top of `handleDownload`, create a limit: `const limit = pLimit(5);`
3. Wrap the proxy fetch loop. Replace the `Promise.all(imageArray.map(async (img) ...))` with:
\`\`\`javascript
let hasFailures = false;
await Promise.all(imageArray.map((img) => limit(async () => {
  const originalSrc = img.src;
  if (!originalSrc || originalSrc.startsWith('data:') || originalSrc.startsWith('blob:') || originalSrc.includes(window.location.host)) return;
  const proxyUrl = \`/api/proxy?url=\${encodeURIComponent(originalSrc)}\`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Proxy failed');
    const blob = await response.blob();
    if (blob.type.startsWith('text/')) throw new Error('Invalid content');

    const localDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    img.src = localDataUrl;
    
    await new Promise((resolve) => {
      if (img.complete) resolve();
      else { img.onload = resolve; img.onerror = resolve; }
    });
  } catch (e) {
    console.warn(\`Proxy failed or timed out for: \${originalSrc}\`, e);
    hasFailures = true;
    // Fallback behavior: Generate an empty 1x1 transparent PNG or placeholder data URL
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E";
  }
})));
\`\`\`
4. If `hasFailures` is true after the generation, show a notification:
\`\`\`javascript
if (hasFailures) {
  notifications.show({
    title: 'Export Incomplete',
    message: 'Some album covers failed to load due to network timeouts. Placeholders were used instead.',
    color: 'yellow',
    icon: <IconAlertCircle size={16} />,
  });
}
\`\`\`
</action>

<acceptance_criteria>
- `grep -q "pLimit" src/pages/ExportBest50Page.jsx` exits 0.
- `grep -q "Export Incomplete" src/pages/ExportBest50Page.jsx` exits 0.
</acceptance_criteria>

## Verification
- Test exporting a Best 50 snapshot. Verify the proxy calls stagger 5 at a time.
- If simulated timeout occurs, verify the fallback SVG appears without throwing unhandled exceptions.

## Must Haves
- The export component MUST accurately limit outgoing proxy calls to 5 concurrent promises.
- An explicit visual notification MUST be fired if any proxy operation fails.
