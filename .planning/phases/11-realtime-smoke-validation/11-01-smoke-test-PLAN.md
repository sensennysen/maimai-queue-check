---
wave: 1
depends_on: []
files_modified: ["src/__tests__/realtime-smoke.test.js"]
autonomous: true
---

# Plan 01: Implement Realtime Smoke Test

## Objective
Implement a Vitest test suite (`realtime-smoke.test.js`) that connects to the local Supabase instance, creates a unique realtime channel, subscribes, and verifies broadcast capabilities to ensure integration stability.

## Tasks

<task>
<id>11-01-01</id>
<title>Implement Vitest Realtime Smoke Test</title>
<description>Create a new Vitest test file to perform a true integration test against Supabase realtime.</description>
<read_first>
- vitest.config.js
- .planning/phases/11-realtime-smoke-validation/11-RESEARCH.md
- package.json
</read_first>
<action>
Create `src/__tests__/realtime-smoke.test.js` with the following implementation:
1. Import `vitest` (describe, it, expect, beforeAll, afterAll) and `@supabase/supabase-js` (createClient).
2. Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `process.env`, defaulting to `http://127.0.0.1:54321` and the standard local anon key if not present.
3. In `beforeAll`, initialize the Supabase client.
4. In `afterAll`, ensure `supabase.removeChannel(testChannel)` is called (after checking `testChannel` exists) to prevent hanging.
5. In `it('successfully subscribes and receives broadcast events')`:
   - Generate a unique channel name `smoke-test-${Date.now()}`.
   - Initialize connection: `testChannel = supabase.channel(channelName)`.
   - Setup a promise `messagePromise` to resolve when `testChannel.on('broadcast', { event: 'ping' }, payload => resolve(payload))` fires.
   - Await `testChannel.subscribe()` to reach `SUBSCRIBED` status. Example:
     ```javascript
     await new Promise((resolve, reject) => {
       testChannel.subscribe((status, err) => {
         if (status === 'SUBSCRIBED') resolve();
         if (err) reject(err);
       });
     });
     ```
   - Trigger the broadcast: `await testChannel.send({ type: 'broadcast', event: 'ping', payload: { data: 'pong' } })`.
   - Await the `messagePromise` and assert `received.payload.data === 'pong'`.
</action>
<acceptance_criteria>
- `src/__tests__/realtime-smoke.test.js` is created and contains `supabase.channel(`
- `src/__tests__/realtime-smoke.test.js` properly awaits `testChannel.subscribe` confirmation
- `src/__tests__/realtime-smoke.test.js` contains cleanup logic `supabase.removeChannel(`
- `npm run test` executes the suite successfully without hanging
</acceptance_criteria>
</task>

## Verification
- Run `npm run test`.
- Ensure the realtime smoke test executes successfully and the Node event loop terminates.

## Must Haves
- The test suite must establish a real WebSocket subscription.
- The test must clean up its channel to avoid Event Loop hangs.
- Requirement TEST-02 is satisfied.
