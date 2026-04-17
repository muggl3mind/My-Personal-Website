#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${WORKER_URL:-}" ]]; then
  echo "ERROR: WORKER_URL env var required" >&2
  exit 1
fi

QUESTIONS_FILE="${1:-worker/eval/answerable.txt}"

if [[ ! -f "$QUESTIONS_FILE" ]]; then
  echo "ERROR: questions file not found: $QUESTIONS_FILE" >&2
  exit 1
fi

TIMINGS=()

while IFS= read -r question; do
  [[ -z "$question" ]] && continue
  printf 'Q: %-60s ... ' "${question:0:60}"
  payload=$(jq -cn --arg q "$question" '{question: $q, history: []}')
  start=$(perl -MTime::HiRes=time -e 'printf "%.3f\n", time')
  curl -sS -X POST "$WORKER_URL/chat" \
    -H 'content-type: application/json' \
    -H 'origin: https://lovelywisdom.com' \
    -d "$payload" > /dev/null
  end=$(perl -MTime::HiRes=time -e 'printf "%.3f\n", time')
  elapsed=$(echo "$end - $start" | bc)
  TIMINGS+=("$elapsed")
  printf '%6.3fs\n' "$elapsed"
done < "$QUESTIONS_FILE"

SORTED=$(printf '%s\n' "${TIMINGS[@]}" | sort -n)
COUNT=${#TIMINGS[@]}
P50_IDX=$(( COUNT / 2 ))
P95_IDX=$(( COUNT * 95 / 100 ))
MIN=$(echo "$SORTED" | head -1)
MAX=$(echo "$SORTED" | tail -1)
P50=$(echo "$SORTED" | sed -n "$((P50_IDX + 1))p")
P95=$(echo "$SORTED" | sed -n "$((P95_IDX + 1))p")

echo
echo "=== LATENCY ==="
echo "n=$COUNT  min=${MIN}s  p50=${P50}s  p95=${P95}s  max=${MAX}s"
