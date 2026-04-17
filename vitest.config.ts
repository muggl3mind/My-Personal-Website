import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['worker/tests/**/*.test.ts'],
    setupFiles: ['./worker/tests/setup.ts'],
    poolOptions: {
      workers: {
        wrangler: { configPath: './worker/wrangler.test.toml' },
        miniflare: {
          // The [ai] binding becomes a wrappedBinding pointing to an external
          // worker that needs cloudflare-internal:ai-api — unavailable in
          // Miniflare.  We supply a lightweight mock worker instead so the
          // runtime can start.
          workers: [
            {
              name: '__WRANGLER_EXTERNAL_AI_WORKER',
              modules: true,
              scriptPath: './worker/tests/__mocks__/ai-worker.mjs',
            },
          ],
          // The wrangler.toml Text rule for corpus.json would cause it to be
          // loaded as a raw string, breaking the worker's JSON validation.
          // Override with an empty rules array so workerd uses its native
          // JSON module support (import ... with { type: 'json' }).
          modulesRules: [],
        },
      },
    },
  },
});
