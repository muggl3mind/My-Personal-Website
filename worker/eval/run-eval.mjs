#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WORKER_URL = process.env.WORKER_URL;
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!WORKER_URL || !ADMIN_KEY) {
  console.error('ERROR: WORKER_URL and ADMIN_KEY env vars required');
  process.exit(1);
}

function loadQuestions(file) {
  return readFileSync(join(__dirname, file), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

async function score(question) {
  const res = await fetch(
    `${WORKER_URL}/eval-score?key=${encodeURIComponent(ADMIN_KEY)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
    },
  );
  if (!res.ok) throw new Error(`worker ${res.status}: ${await res.text()}`);
  return (await res.json()).top;
}

async function main() {
  const answerable = loadQuestions('answerable.txt');
  const unanswerable = loadQuestions('unanswerable.txt');
  console.log(`Loaded ${answerable.length} answerable, ${unanswerable.length} unanswerable\n`);

  const results = { answerable: [], unanswerable: [] };

  for (const q of answerable) {
    process.stdout.write(`A: ${q.slice(0, 60).padEnd(60)} ... `);
    const top = await score(q);
    const top1 = top[0]?.score ?? 0;
    const top2 = top[1]?.score ?? 0;
    console.log(`top1=${top1.toFixed(3)} top2=${top2.toFixed(3)}`);
    results.answerable.push({ q, top1, top2 });
  }

  for (const q of unanswerable) {
    process.stdout.write(`U: ${q.slice(0, 60).padEnd(60)} ... `);
    const top = await score(q);
    const top1 = top[0]?.score ?? 0;
    const top2 = top[1]?.score ?? 0;
    console.log(`top1=${top1.toFixed(3)} top2=${top2.toFixed(3)}`);
    results.unanswerable.push({ q, top1, top2 });
  }

  const ansTop1 = results.answerable.map((r) => r.top1).sort((a, b) => a - b);
  const ansTop2 = results.answerable.map((r) => r.top2).sort((a, b) => a - b);
  const unaTop1 = results.unanswerable.map((r) => r.top1).sort((a, b) => a - b);
  const unaTop2 = results.unanswerable.map((r) => r.top2).sort((a, b) => a - b);

  const min = (arr) => arr[0];
  const max = (arr) => arr[arr.length - 1];
  const median = (arr) => arr[Math.floor(arr.length / 2)];

  console.log('\n=== DISTRIBUTION ===');
  console.log('Answerable top1:   min=%s median=%s max=%s', min(ansTop1).toFixed(3), median(ansTop1).toFixed(3), max(ansTop1).toFixed(3));
  console.log('Answerable top2:   min=%s median=%s max=%s', min(ansTop2).toFixed(3), median(ansTop2).toFixed(3), max(ansTop2).toFixed(3));
  console.log('Unanswerable top1: min=%s median=%s max=%s', min(unaTop1).toFixed(3), median(unaTop1).toFixed(3), max(unaTop1).toFixed(3));
  console.log('Unanswerable top2: min=%s median=%s max=%s', min(unaTop2).toFixed(3), median(unaTop2).toFixed(3), max(unaTop2).toFixed(3));

  const recommendedTop1 = ((min(ansTop1) + max(unaTop1)) / 2).toFixed(2);
  const recommendedMin = ((min(ansTop2) + max(unaTop2)) / 2).toFixed(2);

  console.log('\n=== RECOMMENDED THRESHOLDS ===');
  console.log(`TOP_1_FLOOR    = ${recommendedTop1}`);
  console.log(`MIN_SIMILARITY = ${recommendedMin}`);
  console.log('\nUpdate worker/index.ts and re-run.');
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
