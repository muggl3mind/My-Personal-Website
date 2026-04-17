/**
 * Fetch and parse Lovely's Medium RSS feed at build time.
 *
 * Called from src/pages/writing.astro inside the frontmatter. Astro runs
 * the fetch once during `astro build`, so the resulting list is baked into
 * the static HTML and there is zero runtime fetching.
 *
 * If the Medium feed is unreachable at build time (network down, DNS, rate
 * limit) we fall back to src/data/medium-cache.json so the build never
 * breaks. The cache file is regenerated on every successful build.
 */
import { XMLParser } from 'fast-xml-parser';
import { site } from '../config';
import fallback from '../data/medium-cache.json' with { type: 'json' };

export interface Post {
  title: string;
  url: string;
  pubDate: string; // ISO string, JSON-serializable
  readingTimeMin: number;
  excerpt: string;
  imageUrl?: string; // first image from content:encoded, if any
}

function firstImageFromHtml(html: string): string | undefined {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function readingTimeFromHtml(html: string): number {
  const words = stripHtml(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function excerpt(html: string, max = 180): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd() + '…';
}

export async function fetchMediumPosts(): Promise<Post[]> {
  try {
    const res = await fetch(site.mediumFeed, {
      headers: { 'user-agent': 'lovelywisdom.com build' },
    });
    if (!res.ok) throw new Error(`Medium feed responded ${res.status}`);
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      cdataPropName: '__cdata',
    });
    const parsed = parser.parse(xml);
    const itemsRaw = parsed?.rss?.channel?.item;
    if (!itemsRaw) throw new Error('Medium feed: no <item> elements found');

    const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

    const posts: Post[] = items.map((item: any) => {
      const html =
        item['content:encoded']?.__cdata ??
        item['content:encoded'] ??
        item.description ??
        '';
      const titleRaw = item.title?.__cdata ?? item.title ?? '';
      const url = String(item.link ?? '').trim();
      return {
        title: String(titleRaw).trim(),
        url,
        pubDate: new Date(item.pubDate ?? Date.now()).toISOString(),
        readingTimeMin: readingTimeFromHtml(String(html)),
        excerpt: excerpt(String(html)),
        imageUrl: firstImageFromHtml(String(html)),
      };
    });

    posts.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
    );
    return posts;
  } catch (err) {
    console.warn(
      '[medium] Falling back to cached post list:',
      (err as Error).message,
    );
    return fallback as Post[];
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
