import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

describe('test framework smoke', () => {
  it('boots and sees the AI binding', () => {
    expect(env.AI).toBeDefined();
  });

  it('boots and sees the RATE_LIMIT KV namespace', () => {
    expect(env.RATE_LIMIT).toBeDefined();
  });
});
