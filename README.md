# Building My Personal Website with Claude Code

This is the repo behind [lovelywisdom.com](https://lovelywisdom.com), my
personal portfolio. I built it entirely with Claude Code as a forcing
function to see how much real software I could ship with AI as my pair.

The coolest thing about the site is the chat widget on the homepage. It
runs on Cloudflare Workers AI with a retrieval pipeline I built from
scratch. Ask it a question about my work and it answers based on my actual
writing, not a generic model. No OpenAI key, no Anthropic key, fixed flat
cost.

Full story with the dead ends and the moment the chat started feeling
real: [Medium post coming soon].

## What's inside this repo

Two things.

**A static portfolio site.** Astro + Tailwind. Home, portfolio, a page per
project with a deep dive and demo, a writing page that pulls from Medium,
a CV page, a contact form. Deployed to GitHub Pages from this repo.

**A Cloudflare Worker backend.** Lives in `worker/`. Handles three things:
the chat widget (retrieval over my writing), the contact form (messages
stored in KV), and a tiny no-cookie pixel that counts page views. The chat
has four layers of isolation so it can't be prompt-injected off-topic.
Every question is logged with whether it was answered or refused, and why.

## The chat in plain English

Most AI chat widgets on portfolio sites send every question to OpenAI or
Anthropic and charge the owner per message. Mine doesn't. Here's how it
works:

1. I take my own writing (blog posts, CV, project readmes, selected source
   files) and chunk it into ~400 passages.
2. Each passage gets turned into a list of 768 numbers that represent its
   meaning. This is called an embedding.
3. When a visitor asks a question, I embed the question the same way and
   find the 12 passages closest in meaning.
4. Those 12 passages get stitched into a prompt for Llama 3.3, which also
   runs on Cloudflare. Llama writes the answer based on my passages, not
   its general training.
5. If nothing matches closely enough, the chat refuses politely instead of
   making something up.

Flat $5/month, no matter how many people ask.

## Building this with Claude Code

The whole thing was built with me and Claude Code sitting together. A few
patterns that worked:

- **Plan first, build second.** Every non-trivial feature started as a plan
  doc I argued through with Claude before a line of code was written.
- **Evals, not vibes.** The chat's retrieval thresholds are tuned against a
  real question set with known-answerable and known-unanswerable questions.
  When a threshold change helps one score and hurts the other, it gets
  rejected. No guessing.
- **Four seals.** The chat has four defenses against prompt injection and
  off-topic drift. Each one has a counter in the admin dashboard so I can
  see which fired most often last week.

The full narrative, including the parts that didn't work, is the Medium
post.

## Privacy

No cookies. No Google Analytics. No cookie banner. The only third-party
script is Cloudflare Web Analytics, which is cookieless and doesn't
fingerprint visitors. On top of that, my own Worker counts page views
server-side with the visitor IP hashed before it's ever stored. I can see
that someone visited. I can't see who.

## Using the design as a template

The code is MIT licensed. The prose, project writeups, videos, and chat
corpus are not. If you want to fork this as a scaffold for your own site,
see [TEMPLATE.md](./TEMPLATE.md) for exactly which files to edit.

## Dev

```bash
npm install
npm run dev       # localhost:4321
npm run build     # build to dist/
```

Worker deploy:

```bash
cd worker && wrangler deploy
```

Rebuild the chat corpus after editing sources:

```bash
WORKER_URL=... ADMIN_KEY=... npm run build:corpus
```
