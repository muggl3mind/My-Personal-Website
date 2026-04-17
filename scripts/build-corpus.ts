/**
 * Corpus build script — chunks Lovely's content and POSTs it to the
 * deployed Worker's /build-corpus endpoint, which embeds the chunks via
 * Workers AI (same binding + model the runtime uses) and returns the
 * embedded corpus as JSON. Script writes worker/corpus.json.
 *
 * Usage:
 *   WORKER_URL=https://lovely-chat.<sub>.workers.dev \
 *   ADMIN_KEY=... \
 *   node --experimental-strip-types scripts/build-corpus.ts
 *
 * This keeps build-time and request-time embeddings on the same infrastructure
 * so there is no drift between the two.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const CORPUS_ROOT =
  process.env.CORPUS_ROOT ??
  `${process.env.HOME}/Documents/AI Projects/lovely-chat-corpus`;
const OUTPUT = fileURLToPath(new URL('../worker/corpus.json', import.meta.url));
const MAX_CHARS_PER_CHUNK = 1800;
const MIN_BLOG_CHUNK_CHARS = 200; // don't emit one-sentence blog fragments

const WORKER_URL = process.env.WORKER_URL;
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!WORKER_URL) {
  console.error('ERROR: WORKER_URL env var not set');
  process.exit(1);
}
if (!ADMIN_KEY) {
  console.error('ERROR: ADMIN_KEY env var not set');
  process.exit(1);
}

interface RawChunk {
  id: string;
  source: string;
  text: string;
}

// ————————————————————————————————————————————————————————————————
// Chunking
// ————————————————————————————————————————————————————————————————

function splitLongSection(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const paras = text.split(/\n\s*\n/);
  const out: string[] = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > maxChars && buf) {
      out.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function chunkMarkdownByHeadings(text: string, sourceTag: string): RawChunk[] {
  const lines = text.split('\n');
  const chunks: RawChunk[] = [];
  let current: string[] = [];
  let currentHeading = '';
  let idx = 0;

  const flush = () => {
    const content = current.join('\n').trim();
    if (!content) return;
    const pieces = splitLongSection(content, MAX_CHARS_PER_CHUNK);
    for (const piece of pieces) {
      chunks.push({
        id: `${sourceTag}-${idx++}`,
        source: sourceTag,
        text: currentHeading ? `${currentHeading}\n\n${piece}` : piece,
      });
    }
    current = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      flush();
      currentHeading = line.trim();
    } else {
      current.push(line);
    }
  }
  flush();
  return chunks;
}

/**
 * Blog posts converted from docx often have NO H2/H3 structure (all content
 * is one big blob). Chunk by paragraph groups of ~1500 chars with a one-
 * paragraph overlap for context continuity.
 */
function chunkBlogPost(text: string, sourceTag: string): RawChunk[] {
  const title = (text.split('\n').find((l) => l.trim().length > 0) ?? '').trim();
  const body = text.replace(/^[#\s]*/, '').trim();

  const paras = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);

  const chunks: RawChunk[] = [];
  let buf: string[] = [];
  let bufLen = 0;
  let idx = 0;

  const emit = (force = false) => {
    const joined = buf.join('\n\n').trim();
    if (joined.length < MIN_BLOG_CHUNK_CHARS && !force) return;
    if (joined.length === 0) return;
    chunks.push({
      id: `${sourceTag}-${idx++}`,
      source: sourceTag,
      text: `Title: ${title}\n\n${joined}`,
    });
  };

  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (bufLen + p.length > MAX_CHARS_PER_CHUNK && buf.length > 0) {
      emit();
      // one-paragraph overlap for continuity
      const lastPara = buf[buf.length - 1];
      buf = [lastPara, p];
      bufLen = lastPara.length + p.length;
    } else {
      buf.push(p);
      bufLen += p.length;
    }
  }
  emit(true);
  return chunks;
}

/**
 * Source code: emit the whole file as a few chunks (~80 lines each),
 * preserving the file path as the source tag so retrieval can attribute
 * "that code comes from frs/generate_journal.py".
 */
function chunkCodeFile(text: string, sourceTag: string): RawChunk[] {
  const lines = text.split('\n');
  const LINES_PER_CHUNK = 100;
  const chunks: RawChunk[] = [];
  let idx = 0;

  for (let i = 0; i < lines.length; i += LINES_PER_CHUNK) {
    const slice = lines.slice(i, i + LINES_PER_CHUNK).join('\n');
    if (slice.trim().length < 40) continue;
    const endLine = Math.min(i + LINES_PER_CHUNK, lines.length);
    chunks.push({
      id: `${sourceTag}-${idx++}`,
      source: sourceTag,
      text: `Source file: ${sourceTag} (lines ${i + 1}-${endLine})\n\n\`\`\`\n${slice}\n\`\`\``,
    });
  }
  return chunks;
}

/**
 * CV chunking: group by ROLE / SECTION, not by individual bullet.
 *
 * The pandoc-converted CV uses **bold text** for section headers and
 * company/role names, NOT markdown # headings. Multi-line bullets
 * (continuation lines indented with spaces) must be joined to the
 * preceding bullet. Each section between bold headers becomes one chunk
 * so retrieval returns a complete role description, not a sentence
 * fragment.
 */
function chunkCvBullets(text: string, sourceTag: string): RawChunk[] {
  const lines = text.split('\n');
  const chunks: RawChunk[] = [];
  let idx = 0;
  let sectionBuf: string[] = [];
  let sectionHeader = '';
  let carryForward = '';

  // A bold line that starts a new section: **ALL CAPS**, **Company Name**,
  // or # Markdown headings.
  const isSectionBreak = (line: string): boolean =>
    /^#{1,3}\s+/.test(line) ||
    /^\*\*[A-Z][A-Z &/,.'\\|\-]+\*\*/.test(line.trim()) ||
    /^\*\*[A-Z][a-z].*\*\*\s*\\?\|/.test(line.trim());

  const flush = () => {
    const content = sectionBuf.join('\n').trim();
    sectionBuf = [];
    if (content.length < 60) {
      // Don't drop short sections — carry them forward as context
      // so company names stay attached to their role content.
      if (content) {
        carryForward = sectionHeader
          ? `${sectionHeader}\n\n${content}`
          : content;
      } else if (sectionHeader) {
        carryForward = sectionHeader;
      }
      return;
    }
    let fullText = sectionHeader
      ? `${sectionHeader}\n\n${content}`
      : content;
    if (carryForward) {
      fullText = `${carryForward}\n\n${fullText}`;
      carryForward = '';
    }
    for (const piece of splitLongSection(fullText, MAX_CHARS_PER_CHUNK)) {
      chunks.push({
        id: `${sourceTag}-${idx++}`,
        source: sourceTag,
        text: piece,
      });
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (isSectionBreak(line)) {
      flush();
      sectionHeader = line.trim();
      continue;
    }
    sectionBuf.push(line);
  }
  flush();
  return chunks;
}

// ————————————————————————————————————————————————————————————————
// Sources
// ————————————————————————————————————————————————————————————————

async function loadAllSources(): Promise<RawChunk[]> {
  const all: RawChunk[] = [];

  async function tryDir(
    sub: string,
    chunker: (text: string, tag: string) => RawChunk[],
    tagPrefix: string,
  ) {
    try {
      const files = await readdir(join(CORPUS_ROOT, sub));
      for (const f of files) {
        if (!f.endsWith('.md')) continue;
        const text = await readFile(join(CORPUS_ROOT, sub, f), 'utf8');
        const cleanBase = basename(f, '.md').replace(/^\d+\s*-\s*/, '');
        const tag = `${tagPrefix}:${cleanBase}`;
        const chunks = chunker(text, tag);
        console.log(`  ${sub}/${f}: ${chunks.length} chunks`);
        all.push(...chunks);
      }
    } catch {
      console.warn(`  no ${sub}/ dir`);
    }
  }

  await tryDir('cv', chunkCvBullets, 'cv');
  await tryDir('blog-posts', chunkBlogPost, 'blog');
  await tryDir('project-readmes', chunkMarkdownByHeadings, 'project');
  await tryDir('about', chunkMarkdownByHeadings, 'about');

  // Source code — read any .py / .ts / .js / .md file in source-code/
  try {
    const codeFiles = await readdir(join(CORPUS_ROOT, 'source-code'));
    for (const f of codeFiles) {
      if (!/\.(py|ts|js|md)$/.test(f)) continue;
      const text = await readFile(join(CORPUS_ROOT, 'source-code', f), 'utf8');
      const tag = `code:${basename(f).replace(/\.(py|ts|js|md)$/, '')}`;
      const chunks = chunkCodeFile(text, tag);
      console.log(`  source-code/${f}: ${chunks.length} chunks`);
      all.push(...chunks);
    }
  } catch {
    console.warn('  no source-code/ dir');
  }

  return all;
}

// ————————————————————————————————————————————————————————————————
// Main
// ————————————————————————————————————————————————————————————————

async function main() {
  console.log('Loading sources from', CORPUS_ROOT);
  const chunks = await loadAllSources();
  if (chunks.length === 0) {
    throw new Error('no chunks generated — corpus sources missing?');
  }
  console.log(`Total chunks: ${chunks.length}`);

  console.log(`Embedding via ${WORKER_URL}/build-corpus...`);
  const res = await fetch(`${WORKER_URL}/build-corpus?key=${encodeURIComponent(ADMIN_KEY!)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chunks }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`worker ${res.status}: ${body.slice(0, 500)}`);
  }

  const embedded = (await res.json()) as Array<{
    id: string;
    source: string;
    text: string;
    embedding: number[];
  }>;

  // Smoke check (first MUST from Step 11.5).
  if (!Array.isArray(embedded)) throw new Error('embedded: not an array');
  if (embedded.length === 0) throw new Error('embedded: empty');
  for (const c of embedded) {
    if (!c.id || !c.text || !Array.isArray(c.embedding) || c.embedding.length === 0) {
      throw new Error(`malformed chunk: ${c.id}`);
    }
  }

  await writeFile(OUTPUT, JSON.stringify(embedded), 'utf8');
  const sizeKb = (JSON.stringify(embedded).length / 1024).toFixed(1);
  console.log(`Wrote ${embedded.length} embedded chunks to ${OUTPUT} (${sizeKb} KB raw)`);
}

main().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
