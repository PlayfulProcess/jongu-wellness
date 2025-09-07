export const LINKS = {
  // Main domain
  MAIN_DOMAIN: 'https://www.recursive.eco',
  
  // App URLs
  WELLNESS_APP: 'https://channels.recursive.eco',
  BEST_POSSIBLE_SELF_APP: 'https://journal.recursive.eco',
  JOURNAL_APP: 'https://journal.recursive.eco',
  
  // Future apps
  PARENTS_APP: 'https://parents.recursive.eco',
  DEVELOPERS_APP: 'https://developers.recursive.eco',
  
  // External links
  GITHUB_ORG: 'https://github.com/PlayfulProcess',
  GITHUB_WELLNESS: 'https://github.com/PlayfulProcess/recursive-channels',
  GITHUB_BPS_TOOL: 'https://github.com/PlayfulProcess/recursive-journal',
  GITHUB_REPO: 'https://github.com/PlayfulProcess/recursive-channels', // Added missing GITHUB_REPO
  
  // Social links
  DISCORD: 'https://discord.com/invite/qn69cSbDez',
  TWITTER: 'https://twitter.com/playfulprocess',
  
  // API endpoints (if shared across apps)
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'https://api.recursive.eco',
} as const;

export type LinkKey = keyof typeof LINKS;