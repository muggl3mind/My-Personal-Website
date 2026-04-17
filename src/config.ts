/**
 * Site-wide configuration. Single source of truth for URLs, social handles,
 * author info, and build-time constants.
 */
export const site = {
  url: 'https://lovelywisdom.com',
  title: 'Lovely Wisdom McInerney',
  description:
    'Accountant turned AI builder. A logbook of experiments, prototypes, and posts from someone teaching herself how AI actually gets built, out loud, in public.',
  author: {
    name: 'Lovely Wisdom McInerney',
    // Contact is intentionally not exposed in code. The /contact page POSTs
    // to the worker /submit endpoint, which stores messages in KV for Lovely
    // to read via the /admin dashboard. No email address ever appears in
    // page source or chat output.
    contactPath: '/contact',
  },
  social: {
    github: 'https://github.com/muggl3mind',
    linkedin: 'https://www.linkedin.com/in/lovely-mcinerney',
    medium: 'https://medium.com/@lovely.mcinerney',
    youtube: 'https://www.youtube.com/@muggl3mind',
  },
  mediumFeed: 'https://medium.com/feed/@lovely.mcinerney',
  // Worker URL, set after first wrangler deploy (step 5). Also referenced
  // in the client-side chat widget fetch call.
  workerUrl: 'https://lovely-chat.muggl3mind.workers.dev',
  // Cloudflare Web Analytics beacon token. Free, no cookies, no banner.
  // Get it from: Cloudflare dashboard → Analytics & Logs → Web Analytics →
  // "Add a site" → paste lovelywisdom.com → copy the token from the embed
  // snippet. Leave empty to disable. Not sensitive — the token lives in
  // page source either way.
  cloudflareBeaconToken: '7bfd7db7b30340af908592717fd0b4d7' as string,
};

export type Site = typeof site;
