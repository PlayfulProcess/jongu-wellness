export const LINKS = {
  // Main domain
  MAIN_DOMAIN: 'https://www.jongu.org',
  
  // App URLs
  WELLNESS_APP: 'https://wellness.jongu.org',
  BEST_POSSIBLE_SELF_APP: 'https://wellness-tool.jongu.org',
  
  // Future apps
  PARENTS_APP: 'https://parents.jongu.org',
  DEVELOPERS_APP: 'https://developers.jongu.org',
  
  // External links
  GITHUB_ORG: 'https://github.com/PlayfulProcess',
  GITHUB_WELLNESS: 'https://github.com/PlayfulProcess/jongu-wellness',
  GITHUB_BPS_TOOL: 'https://github.com/PlayfulProcess/jongu-tool-best-possible-self',
  GITHUB_REPO: 'https://github.com/PlayfulProcess/jongu-wellness', // Added missing GITHUB_REPO
  
  // Social links
  DISCORD: 'https://discord.gg/jongu',
  TWITTER: 'https://twitter.com/jongu',
  
  // API endpoints (if shared across apps)
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'https://api.jongu.org',
} as const;

export type LinkKey = keyof typeof LINKS;