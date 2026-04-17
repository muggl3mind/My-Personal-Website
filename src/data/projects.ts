/**
 * Project content. Edit prose here, not in the page templates.
 *
 * Design note: featured lineup is Career Manager + AccounTech Buddy +
 * Financial Reporting Skills (newest first). Others appear on /portfolio
 * but not on the homepage "Selected work" strip. Order of this array
 * drives display order everywhere.
 *
 * Each project follows the same shape:
 *   whatItDoes:   short bullets, user-facing capabilities
 *   whyBuilt:     one paragraph, the actual motivation
 *   hardPoints:   bullets, genuine technical difficulty / edge cases
 *   outcomePoints: bullets, what the pipeline actually produces
 */

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  oneLine: string;
  stack: string;
  repoUrl: string;
  videoSrc?: string; // short autoplay loop for homepage card
  posterSrc?: string;
  fullDemoSrc?: string; // full-length demo with audio for deep page
  demoUrl?: string; // External demo (e.g. YouTube) linked from deep page
  featured: boolean;
  whatItDoes: string[];
  whyBuilt: string;
  hardPoints: string[];
  outcomePoints: string[];
}

export const projects: Project[] = [
  {
    slug: 'career-manager',
    title: 'Career Manager',
    subtitle: 'Five Claude Code skills for running a whole job search',
    oneLine:
      'An AI-assisted career management pipeline built as five Claude Code skills. Discovers target companies, scores them against a 10-dimension rubric, runs deep company research, tailors resumes per role, and tracks every application end-to-end.',
    stack: 'Claude Code skills · Python · JobSpy · Tavily · Gmail API · parallel sub-agents',
    repoUrl: 'https://github.com/muggl3mind/career-manager',
    videoSrc: '/videos/job-search-automator.webm',
    posterSrc: '/videos/job-search-automator-poster.jpg',
    fullDemoSrc: '/videos/job-search-automator-full.webm',
    demoUrl: 'https://www.youtube.com/watch?v=L-8e5EkNv1w',
    featured: true,
    whatItDoes: [
      'onboarding: reads your resume, derives your career paths, and writes every config file the pipeline needs.',
      'job-search: runs the full discovery pipeline. Phase 1 scrapes job boards (JobSpy), monitors known target companies, and exports prospecting context. Then parallel sub-agents do two waves: wave 1 scores known companies and new job-board hits against a 10-dimension rubric, wave 2 expands into competitors, investor portfolios, and curated lists for any career path that hit a threshold. Phase 2 merges into one ranked target list.',
      'company-research: produces a single deep dossier on one company (overview, signals, fit, risks) when the surface scoring is not enough.',
      'cv-tailor: picks the closest base .docx resume, proposes grounded text-only edits matched to exact paragraphs, and writes a tailored resume and cover letter per role with a change summary.',
      'job-tracker: keeps every application, follow-up, and status update in a local pipeline the rest of the skills read as the source of truth.',
    ],
    whyBuilt:
      "Job searching shouldn't feel like a full-time job. This project started as a way to keep building while putting myself back on the job market. I wanted everything in one place, on demand, and personalized. The goal was never to cast a wide net. It was to cast a precise one.",
    hardPoints: [
      'Claude\'s native web search is rate-limited and shallow for careers pages. The workaround is to route discovery through third-party integrations (JobSpy for the boards, Tavily for company-page mapping) and use Claude for judgment on top, not for scraping.',
      'Claude tries to rebuild .docx resumes wholesale and blows up the formatting. The workaround lives in cv-tailor: docx_safe_patch.py does phrase-level in-place edits that preserve run-level formatting, Claude proposes only text changes matched to exact strings from the base resume, and the pipeline enforces a 2-page cap before writing anything.',
      'Deciding what to make deterministic Python and what to leave to Claude. Scraping, merging, selecting base CVs, writing files: deterministic. Deciding which companies fit, writing the cover letter, classifying whether a role is the right shape: judgment. Mixing the two kills reproducibility and grading.',
    ],
    outcomePoints: [
      'A live status dashboard the orchestrator surfaces in plain English at the start of every run: total companies tracked, how many are stale, active applications in flight, follow-ups due.',
      'A per-role tailored resume and cover letter, grounded in your real experience, with a change summary you can sanity-check before sending.',
    ],
  },
  {
    slug: 'accountech-buddy',
    title: 'AccounTech Buddy',
    subtitle: 'Multi-agent month-end close system',
    oneLine:
      'A Google ADK prototype where one root coordinator agent dispatches a transaction-categorization workflow and a journal-entry generation workflow to run the bookkeeping side of a month-end close.',
    stack: 'Google Agent Development Kit · Python · LLMs · ThreadPoolExecutor',
    repoUrl: 'https://github.com/muggl3mind/acc_agent',
    videoSrc: '/videos/accountech-buddy.webm',
    posterSrc: '/videos/accountech-buddy-poster.jpg',
    fullDemoSrc: '/videos/accountech-buddy-full.webm',
    demoUrl: 'https://youtu.be/NxP0fvuN6Xk',
    featured: true,
    whatItDoes: [
      'A root Accounting Coordinator agent reads each user request, decides which workflow to run, and tracks session state across the run.',
      'Transaction Categorization workflow: loads the bank CSV and Chart of Accounts, splits the transactions into small batches so multiple agents can classify in parallel, and returns each line with a confidence score (0.0–1.0) and a short reasoning note.',
      'A filtering pass flags low-confidence categorizations, generates account-usage stats, and writes a review summary so a human knows exactly where to look.',
      'Journal Entry Generation workflow: picks up the categorized data and writes balanced double-entry journal entries. Each transaction debits the expense or revenue account it was categorized into and credits the cash control account, so total debits always equal total credits.',
      'Session Management tools let the agent reload prior categorization results so a run can be resumed or revised without redoing the AI work.',
    ],
    whyBuilt:
      'I had spent a few weeks using AI for the basics: explaining standards, polishing communications, cleaning Excel formulas. I wanted to push further. I needed a real project to find out where the models actually held up and where the architecture broke down. Classifying bank transactions and generating journal entries was familiar enough that I would catch every wrong answer, and complex enough to push a multi-agent system past the demo path. AccounTech Buddy was the bet.',
    hardPoints: [
      'The vibe-coding trap. Every Cursor suggestion felt reasonable in isolation, and I rode the "look at me, I am basically a software architect now" energy until a month later I had built a monster that could not reliably do what I designed it for.',
      'Agent overload. The first version crammed dozens of tools and a half-dozen sub-agents into one root agent with a massive prompt. It worked once in a while, then failed in a new way the next run.',
      'AI vs. code confusion. I could not figure out when to let an agent "think through" a problem versus when to write a deterministic function. The wrong call in either direction blew up reliability.',
      'Death by large files. I was feeding entire documents to agents, which caused memory issues and scaling problems. Fine on small samples, broken on real input.',
      'Google ADK runs sub-agents in parallel, but what I actually needed was map-reduce: the same agent running on different chunks of one job, not different agents running on the same job. I had to manually implement file chunking and custom parallel processing.',
      'The 2 AM rebuild. After debugging for the 50th time, I realized I was fighting the wrong battle. I stripped out 90% of the clever architecture and rebuilt using audit thinking: map the process flow, sample-test instead of processing everything at once, give each agent a small specific task, exception reporting (auto-approve high confidence, flag unusual), simple file-based session state. The current diagram is the rebuild, not the monster.',
    ],
    outcomePoints: [
      'A categorized list of every bank transaction, with a confidence score and a short reasoning line so a human knows where to double-check.',
      'A balanced double-entry journal ready to drop into accounting software.',
      'A period-end summary report with account-level totals and the low-confidence items flagged for review.',
    ],
  },
  {
    slug: 'financial-reporting-skills',
    title: 'Financial Reporting Skills',
    subtitle: 'Claude skills for deterministic financial reporting',
    oneLine:
      'A library of single-purpose Claude skills that handle financial reporting workflows without hallucinating.',
    stack: 'Claude SDK · Model Context Protocol · Python',
    repoUrl: 'https://github.com/muggl3mind/Financial-Reporting-Skills',
    posterSrc: '/images/frs-cover.png',
    featured: true,
    whatItDoes: [
      'You type /fixed-assets in Claude Code and the skill walks you through capitalizing a new asset, generating a depreciation schedule for the period (straight-line, partial-period proration handled), or recording a disposal with the gain/loss math and the matching journal entries.',
      'You type /investments and the skill walks the securities lifecycle: record a purchase, run a period-end mark-to-market with AFS-vs-Trading classification routing the unrealized gain to OCI or P&L correctly, or record a sale with a clean realized G/L rollforward.',
      'You can also skip the slash command and just describe what you want in plain English ("capitalize a Dell laptop purchased Jan 15 for $1,850"), and the orchestrator picks the right skill and runs it.',
      'Every operation outputs a CSV (drops straight into accounting software) AND an XLSX with working Excel formulas so an auditor can foot the workpaper without re-running anything.',
    ],
    whyBuilt:
      "Anthropic released a Finance Skills plugin a few weeks after I built mine, and the comparison made the point for me. The plugin is a generic template with placeholder account codes, a perfectly fine starter. But the one-size-fits-all era is over. A generic template is a foundation, and your knowledge of the real workflow is what turns it into something you would actually use. I took a blank Skills template and built one that handles fixed assets end-to-end (capitalization to disposal, gain/loss math, pulling directly from source documents) because that is the workflow I lived. These are just files and instructions. You can open them, change them, make them yours. No feature request, no waiting, no code required.",
    hardPoints: [
      "AFS vs. Trading routing is where general-purpose agents hallucinate most. Unrealized gains on AFS go to OCI, on Trading to P&L, but the same mark-to-market adjustment can be either depending on classification. The skill encodes the routing in the SKILL.md instructions and the Python recalc script so Claude does not have to re-derive it each run.",
      'Partial-period depreciation has real accounting conventions (half-month, mid-quarter, mid-year) that LLMs confidently get wrong. The skill runs the math in Python and uses Claude only to pick the convention from the source documents and explain the result.',
      "Realized vs. unrealized G/L rollforwards drift across periods if you let the model recompute history. The skill keeps a deterministic rollforward against the prior period's closing balances and refuses to reclassify prior-period results.",
      'The whole approach was the lesson from AccounTech Buddy: stop asking one big agent to be smart about everything. Give one narrow skill one workflow, write the rules down in plain English in SKILL.md, and let deterministic Python carry the math. The agent reads the contract instead of guessing it.',
    ],
    outcomePoints: [
      'For each operation: a CSV ready for accounting software import (per-line journal entries) AND an XLSX with live Excel formulas so a reviewer can re-foot the workpaper without re-running the skill.',
      'fixed-assets: a depreciation schedule with method, convention, monthly expense, accumulated depreciation, and net carrying value per period.',
      'investments: a realized-vs-unrealized G/L rollforward and an AFS-vs-Trading classification report tied to source documents.',
      'Source: muggl3mind/Financial-Reporting-Skills. Open it, change the Chart of Accounts in lib/accounts.py to match your GL, and the skills work against your data.',
    ],
  },
  {
    slug: 'funds-flow-audit-tool',
    title: 'Funds Flow Audit Tool',
    subtitle: 'PE deal closing audit automation',
    oneLine:
      'Run /index-funds-flow on a folder of closing documents and you get a renamed, FF-indexed document pack plus an annotated workpaper where every funds-flow line has been matched to its supporting PDF, flagged for mismatches, and carries a GL code.',
    stack: 'Claude Code · Python · Excel · PDF parsing · MCP',
    repoUrl: 'https://github.com/muggl3mind/Funds-Flow-Audit-Tool',
    featured: false,
    whatItDoes: [
      'Parses the client\'s funds flow Excel and extracts every line item from the in-scope tabs (skips seller / wire / summary tabs automatically).',
      'Extracts the full text from every supporting PDF in the documents folder (invoices, confirmations, wire instructions, whatever the client sent).',
      'Matches each funds-flow line to its supporting document using Claude\'s in-context reasoning, and assigns a GL account from chart_of_accounts.json at the same time.',
      'Classifies every match as MATCHED (amount agrees), CUMULATIVE (multiple invoices sum to the line), PARTIAL (amount short), or MISSING, and moves orphan documents to an UNMATCHED/ folder.',
      'Writes an annotated workpaper with audit columns, a Journal Entry tab, and PDF snapshot tabs, then renames the source PDFs with FF-numbered prefixes (FF01 - Vendor - INV-001.pdf) for clean filing.',
    ],
    whyBuilt:
      "Having spent years in private equity accounting and external audit, I had reviewed legal documents for countless hours: funds flow, closing binders, fee schedules, side letters. The boring 80% of that work (parsing, extracting terms, tying amounts) was data work. The interesting 20% (does this fee belong here, is this the right GL, does this party tie to the agreement) was judgment. Most AI-for-audit tools push everything through an LLM and produce workpapers a senior cannot review. I wanted to prove you can do this the way audit actually works: deterministic scripts do the mechanical work, Claude does the judgment, and the output is a workpaper a reviewer can foot in Excel.",
    hardPoints: [
      "Drawing the line between Python and Claude. Anything with a deterministic right answer (parsing amounts, tying totals, writing formulas) belongs in Python, because putting it in the LLM makes the workpaper non-reproducible. Anything that needs judgment (does this fee classify here, is this a related-party cost) needs Claude. Mixing the two in one step was the fastest way to lose the audit trail.",
      "Producing output a reviewing senior can actually audit. The workpaper had to be reviewable with Excel and a PDF viewer, no special tooling, otherwise nobody would use it. That meant formula-linked cells, a cross-referenced Journal Entry tab, and FF-numbered document renames so every line has a citation.",
      'Handling cumulative matches and partials cleanly. One line in the funds flow often maps to an interim invoice plus a final bill, or to a net wire of a larger invoice. The matcher had to surface CUMULATIVE and PARTIAL statuses distinctly, not force everything to MATCHED or MISSING.',
      'Keeping the evidence trail tight. Every Claude classification needs a citation back to the source document. If the LLM says "this is a legal fee," the workpaper has to show which PDF and which page led to that call.',
    ],
    outcomePoints: [
      'An annotated workpaper where every funds-flow line shows its match status, the supporting document it ties to, and the GL code.',
      'A Journal Entry tab built into the workpaper so a reviewer can post straight from the file.',
      'A clean, auditor-ready document pack with every supporting PDF renumbered and cross-referenced to the workpaper.',
      'Review time on a real closing dropped from hours to minutes.',
    ],
  },
  {
    slug: 'lovely-interiors',
    title: 'Lovely Interiors',
    subtitle: 'AI paint consultation with computer vision',
    oneLine:
      'A multi-agent system built on Google ADK and Gemini 2.5 Pro that takes a room photo, reads the lighting and undertones, recommends colors from a curated premium paint catalog, and can order the sample swatches for you.',
    stack: 'Google ADK · Gemini 2.5 Pro · Browser-Use · Computer vision · Python',
    repoUrl: 'https://github.com/muggl3mind/lovely_interiors',
    featured: false,
    whatItDoes: [
      'Takes a photo of your room and reads the lighting nuances, existing finishes, and undertones using Gemini 2.5 Pro vision.',
      'Runs a structured consultation that tracks your requirements room by room so recommendations compound across a whole house, not just a single wall.',
      'Searches a specialized 300-color paint catalog with technical specs, matching undertones and design-harmony rules rather than keyword similarity.',
      'Validates each recommendation against LRV (light reflectance value) targets and basic design principles before it shows up in the shortlist.',
      'Optionally hands off to a browser-automation agent that orders the physical sample swatches from the retailer\'s site, with retry and cart-state recovery.',
    ],
    whyBuilt:
      "Consider this my LinkedIn comeback entry. I have always been fascinated by interior design, even if accounting became my career, but decision fatigue around paint palettes kept me from bringing that passion into my own home. Instead of using a generic ChatGPT or Gemini prompt, I built something purpose-built: a specialized color database, a structured consultation that tracks my requirements, a room-by-room paint plan, and automated sample ordering. Sometimes the best way to learn new tech is to solve your own problem.",
    hardPoints: [
      "Lighting reads differently in every photo and no single prompt handles it all. The photo-analysis agent had to be narrowed to \"read lighting and undertones\" instead of \"describe the room,\" otherwise it hallucinates materials it cannot actually see.",
      'Premium paint catalogs name colors evocatively, not descriptively (think dusty lavender or coastal fog, not a hex code). Semantic search on the name alone mismatches more than it matches. The color agent falls back to LRV and hue when name similarity is misleading.',
      "Browser automation against a real retail site is fragile. Error recovery (retries, re-login, cart state, out-of-stock handling) turned out to be more work than the recommendation logic itself.",
      'The general pattern that came out of this: agents are the right shape when each agent has a different success criterion. Photo analysis succeeds when it reads lighting correctly. Color matching succeeds when it returns harmonious options. Ordering succeeds when the sample arrives. Forcing all three into one agent just produces a confused generalist.',
    ],
    outcomePoints: [
      'A shortlist of paint colors matched to your photo, with per-color rationale that references the lighting and undertones the vision agent saw.',
      'LRV + design-rule validation per recommendation so you can see why a color made the list.',
      'A room-by-room paint plan when you consult on multiple spaces.',
      'Physical samples ordered to your door, optional.',
      'Professional handoff export for a contractor. Not a consumer toy, structured enough to hand to a pro.',
    ],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const moreProjects = projects.filter((p) => !p.featured);
