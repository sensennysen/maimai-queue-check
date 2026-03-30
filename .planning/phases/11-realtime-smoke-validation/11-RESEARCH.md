# Phase 11 Research: Realtime Smoke Validation

## Standard Stack
- `vitest`: The existing test runner configured in the project.
- `@supabase/supabase-js`: The client being tested to ensure no regressions occur across dependency updates.
- Local Supabase instance (`npx supabase start`): Required as the target environment for true integration testing.

## Architecture Patterns
- **True Integration Testing**: To successfully guard against `supabase-js` regressions, the smoke test must run against a real Supabase instance (local or CI). Mocking the `supabase` API via Vitest `vi.mock()` is an anti-pattern here because it only tests the mock constraints, not the actual WebSocket protocol implementation.
- **Isolated Channels**: Use unique, test-specific channel names (like `room-test-${Date.now()}`) to avoid cross-talk if multiple tests or developers run the suite simultaneously against a shared local dev database.
- **Promise-Wrapped Callbacks**: Use Promise wrappers around realtime event listeners (`channel.on()`) to allow idiomatic `async/await` patterns in Vitest tests for asynchronous WebSocket payloads.

## Don't Hand-Roll
- **Mocked Realtime Channels for Smoke Tests**: Do not mock `.channel()`, `.on()`, and `.subscribe()`. While useful for unit testing React components, mocking defeats the goal of a library smoke test.
- **Manual Timeouts for Connection**: Do not use arbitrary `setTimeout` delays to wait for the connection. Always listen to the exact `status === 'SUBSCRIBED'` event from the `subscribe()` callback before proceeding.

## Common Pitfalls
- **Hanging Test Runners**: WebSocket connections keep the Node event loop active. Failing to call `supabase.removeChannel(channel)` in `afterAll` or `afterEach` will cause Vitest to hang indefinitely after test execution.
- **Race Conditions**: Triggering a database mutation or broadcast before the channel is fully `SUBSCRIBED` will result in missed events and flaky tests. The subscription confirmation must be awaited.
- **RLS/Permissions on Realtime**: If testing Postgres Changes (e.g., listening to `INSERT` on a table), ensure the table has `REPLICA IDENTITY FULL` or `DEFAULT` configured for realtime, and that Row Level Security (RLS) policies permit the test client's role to read the data.

## Code Examples

### Idiomatic Vitest Realtime Smoke Test

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

describe('Realtime Smoke Validation', () => {
  let supabase;
  let testChannel;

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  afterAll(async () => {
    // CRITICAL: Clean up channels to prevent hanging tests
    if (testChannel) {
      await supabase.removeChannel(testChannel);
    }
  });

  it('successfully subscribes and receives broadcast events', async () => {
    const channelName = `smoke-test-${Date.now()}`;
    testChannel = supabase.channel(channelName);
    
    // 1. Setup the listener promise BEFORE subscribing or sending
    const messagePromise = new Promise((resolve) => {
      testChannel.on('broadcast', { event: 'ping' }, (payload) => {
        resolve(payload);
      });
    });

    // 2. Await subscription confirmation to avoid race conditions
    await new Promise((resolve, reject) => {
      testChannel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') resolve();
        if (err) reject(err);
      });
    });

    // 3. Trigger the event
    await testChannel.send({
      type: 'broadcast',
      event: 'ping',
      payload: { data: 'pong' },
    });

    // 4. Await and assert the result
    const received = await messagePromise;
    expect(received.payload.data).toBe('pong');
  });
});
```

## Validation Architecture

To ensure the realtime smoke testing phase meets its objective, the following validation strategy should be employed across the verification dimension (Dimension 8):

1. **Test Execution:** The `vitest run` command must successfully execute the new realtime smoke tests.
2. **Channel Lifecycle:** The tests must cleanly create, subscribe to, and properly unsubscribe (`removeChannel`) from Supabase realtime channels to prevent hanging test suites.
3. **Event Propagation:** Broadcasts/Postgres changes must be dispatched and successfully received over the WebSocket connection, demonstrating the true integration flow.
4. **Environment Constraints:** Tests should exclusively mutate or listen to channels with randomized or test-specific identifiers (e.g., `smoke-test-{timestamp}`) to avoid collision with concurrent runs or development use.
