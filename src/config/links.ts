export const LINKS = {
  // Main domain
  MAIN_DOMAIN: 'https://www.recursive.eco',
  
  // App URLs
  JOURNAL_APP: 'https://journal.recursive.eco',
  
  // External links
  GITHUB_ORG: 'https://github.com/PlayfulProcess',
  GITHUB_REPO: 'https://github.com/PlayfulProcess/recursive-channels-fresh',
  GITHUB_WELLNESS: 'https://github.com/PlayfulProcess/jongu-wellness',
  
  // Social links
  DISCORD: 'https://discord.com/invite/qn69cSbDez',
  TWITTER: 'https://twitter.com/jongu',
} as const;

export type LinkKey = keyof typeof LINKS;