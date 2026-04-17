#!/usr/bin/env bash
# Smoke test the deployed chat Worker.
#
# Usage: scripts/test-worker.sh [worker-url]
set -e
URL="${1:-https://lovely-chat.muggl3mind.workers.dev}"

echo "Testing GET /health on $URL"
curl -fsS "$URL/health"
echo

echo "Testing POST /chat (streaming)"
out=$(curl -sS -X POST "$URL/chat" \
  -H "content-type: application/json" \
  -H "origin: https://lovelywisdom.com" \
  -d '{"question":"What did Lovely build?","history":[]}' \
  --max-time 30)

if [ -z "$out" ]; then
  echo "FAIL: empty response"
  exit 1
fi

if ! echo "$out" | grep -q 'content_block_delta\|text_delta\|data:'; then
  echo "FAIL: no SSE markers in response"
  echo "--- response ---"
  echo "$out" | head -20
  exit 1
fi

echo "PASS: worker responded with SSE stream"
echo "--- first 300 chars ---"
echo "$out" | head -c 300
echo
