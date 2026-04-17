// Mock replacement for __WRANGLER_EXTERNAL_AI_WORKER.
// The real worker uses cloudflare-internal:ai-api which isn't available in
// Miniflare local testing.  This stub satisfies the wrappedBinding contract
// so the Workers runtime can start.
export default function (_env) {
  return {
    run: async () => ({ response: '__mock_ai_response__' }),
  };
}
