/**
 * CV content. Edit prose here, not in the page template.
 *
 * PII rule: never put email, phone, or home address in this file. The repo is
 * public. Contact routes through /contact → worker /submit endpoint, same
 * pattern as src/config.ts.
 *
 * This file is intentionally a scaffold. Fill in the real content before
 * linking /cv from the main nav.
 */

export interface Role {
  company: string;
  title: string;
  location?: string; // city, country — no street address
  start: string; // 'YYYY-MM' or 'YYYY'
  end: string | 'present';
  summary: string; // one-paragraph overview
  highlights: string[]; // bulleted achievements, quantified where possible
}

export interface Education {
  institution: string;
  credential: string; // e.g., 'BS Accounting', 'CPA (in progress)'
  start?: string;
  end?: string;
  notes?: string;
}

export interface Credential {
  name: string;
  issuer: string;
  year?: string;
  url?: string;
}

export interface SkillGroup {
  category: string; // e.g., 'AI & Automation', 'Accounting', 'Languages'
  items: string[];
}

export interface CV {
  // Short tagline shown at the top of /cv. No contact info here.
  headline: string;
  summary: string; // 2-3 sentence professional summary
  roles: Role[];
  education: Education[];
  credentials: Credential[];
  skills: SkillGroup[];
  // Optional: path to a downloadable PDF in /public. Leave undefined if not
  // publishing a PDF. If set, the page renders a "Download PDF" button.
  pdfPath?: string;
}

export const cv: CV = {
  headline: '',
  summary: '',
  roles: [
    // Example shape — delete and replace:
    // {
    //   company: '',
    //   title: '',
    //   location: '',
    //   start: '',
    //   end: 'present',
    //   summary: '',
    //   highlights: [''],
    // },
  ],
  education: [
    // {
    //   institution: '',
    //   credential: '',
    //   start: '',
    //   end: '',
    //   notes: '',
    // },
  ],
  credentials: [
    // {
    //   name: '',
    //   issuer: '',
    //   year: '',
    //   url: '',
    // },
  ],
  skills: [
    // {
    //   category: '',
    //   items: [''],
    // },
  ],
  // pdfPath: '/cv.pdf',
};
