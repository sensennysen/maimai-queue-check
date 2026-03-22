import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Force load environment variables from the root .env
const envPath = 'e:/git/smf-queue-check/.env';
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-local-anon-key';

describe('Realtime Smoke Validation', () => {
  let supabase;
  let testChannel;

  beforeAll(() => {
    const obfuscatedKey = SUPABASE_ANON_KEY.substring(0, 10) + '...';
    console.log(`Connecting to URL: ${SUPABASE_URL}`);
    console.log(`Using Key (obfuscated): ${obfuscatedKey}`);
    
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });

  afterAll(async () => {
    if (testChannel) {
      console.log('Cleaning up realtime channel...');
      await supabase.removeChannel(testChannel);
    }
  });

  it('successfully subscribes and receives broadcast events', async () => {
    const channelName = `smoke-test-${Date.now()}`;
    console.log(`Setting up channel: ${channelName}`);
    
    // Enable self broadcasts so we can receive our own ping
    testChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });
    
    // Create a promise that resolves when the broadcast is received
    const messagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for broadcast on channel: ${channelName}. Current Status: ${testChannel.state}`));
      }, 10000);

      testChannel.on('broadcast', { event: 'ping' }, (payload) => {
        console.log(`Received broadcast payload: ${JSON.stringify(payload)}`);
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    // Subscribing must be awaited before sending
    await new Promise((resolve, reject) => {
      const subTimeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      testChannel.subscribe((status, err) => {
        console.log(`Channel subscription status update: ${status}`);
        if (err) console.error(`Subscription error: ${err.message}`);
        
        if (status === 'SUBSCRIBED') {
          clearTimeout(subTimeout);
          resolve();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          clearTimeout(subTimeout);
          reject(new Error(`Subscription failed with status: ${status}${err ? ` - ${err.message}` : ''}`));
        }
      });
    });

    // Wait a bit after subscription to ensure everything is ready
    await new Promise(r => setTimeout(r, 1000));

    // Send the broadcast
    console.log('Sending broadcast ping...');
    const sendStatus = await testChannel.send({
      type: 'broadcast',
      event: 'ping',
      payload: { data: 'pong' },
    });

    console.log(`Send event status: ${sendStatus}`);
    if (sendStatus !== 'ok') {
      throw new Error(`Broadcast failed to send: ${sendStatus}`);
    }

    // Wait for the message to be received
    const result = await messagePromise;
    expect(result.payload.data).toBe('pong');
  }, 20000);
});
