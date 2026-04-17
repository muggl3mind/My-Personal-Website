/**
 * Pre-build PII audit. Scans every file under /tmp/lovely-corpus for
 * patterns that should never appear in the public-facing chat corpus.
 *
 * Fails the build loudly (exit 1) if anything matches. Run before
 * build-corpus.ts so a private file accidentally dropped into the corpus
 * never makes it into the deployed Worker bundle.
 *
 * Usage: node --experimental-strip-types scripts/audit-corpus.ts
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const CORPUS_ROOT =
  process.env.CORPUS_ROOT ??
  `${process.env.HOME}/Documents/AI Projects/lovely-chat-corpus`;

interface Pattern {
  name: string;
  re: RegExp;
  // Allow-list: patterns that match the regex but are explicitly allowed
  // because they're already public (e.g. linkedin handle).
  allow?: RegExp[];
}

const PATTERNS: Pattern[] = [
  {
    name: 'email-address',
    re: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    allow: [
      // None. ALL email addresses should be redacted from the corpus.
      // Lovely's email lives in /contact only, never in the chat context.
    ],
  },
  {
    name: 'us-phone-number',
    re: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    allow: [
      // No-op: US-format phone numbers should never appear.
    ],
  },
  {
    name: 'international-phone',
    re: /\+\d{10,15}\b/g,
  },
  {
    name: 'ssn-like',
    re: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    name: 'credit-card-like',
    re: /\b(?:\d[ -]*?){13,16}\b/g,
  },
];

interface Hit {
  file: string;
  line: number;
  pattern: string;
  match: string;
  context: string;
}

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir);
  for (const e of entries) {
    const p = join(dir, e);
    const s = await stat(p);
    if (s.isDirectory()) {
      await walk(p, out);
    } else if (s.isFile()) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  let allFiles: string[];
  try {
    allFiles = await walk(CORPUS_ROOT);
  } catch (err) {
    console.error(`ERROR: cannot read ${CORPUS_ROOT}: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(`Auditing ${allFiles.length} files in ${CORPUS_ROOT}...`);

  const hits: Hit[] = [];

  for (const file of allFiles) {
    let text: string;
    try {
      text = await readFile(file, 'utf8');
    } catch {
      continue; // skip binary files
    }

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of PATTERNS) {
        // Reset regex state per line
        pat.re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pat.re.exec(line)) !== null) {
          const match = m[0];
          // Check allow-list
          const allowed = pat.allow?.some((a) => a.test(match));
          if (allowed) continue;
          hits.push({
            file: file.replace(CORPUS_ROOT + '/', ''),
            line: i + 1,
            pattern: pat.name,
            match,
            context: line.slice(0, 120),
          });
        }
      }
    }
  }

  if (hits.length === 0) {
    console.log('PASS: no PII patterns found in corpus.');
    return;
  }

  console.error(`\nFAIL: found ${hits.length} PII pattern(s) in corpus:\n`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  [${h.pattern}]  match: ${h.match}`);
    console.error(`    line: ${h.context}`);
    console.error();
  }
  console.error(
    'Remove or redact these from the corpus source files before building.',
  );
  console.error(
    'If you need to keep a value (e.g. an example email in a code comment),',
  );
  console.error('add it to the allow-list in scripts/audit-corpus.ts.');
  process.exit(1);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
