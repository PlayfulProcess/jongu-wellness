import recursiveEcoConfig from '../../recursiveeco.config.json';

export interface RecursiveEcoConfig {
  channel: {
    name: string;
    tagline: string;
    description: string;
    author: string;
    authorLink: string;
  };
  features: {
    discord: {
      enabled: boolean;
      serverId: string;
      showWidget: boolean;
    };
    donations: {
      enabled: boolean;
      stripeLink: string;
      buttonText: string;
    };
    newsletter: {
      enabled: boolean;
      provider: string;
    };
    communityTools: {
      enabled: boolean;
      requireApproval: boolean;
    };
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    style: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  links: {
    github: string;
    discord: string;
    twitter: string;
  };
}

// Merge environment variables with config
export const config: RecursiveEcoConfig = {
  ...recursiveEcoConfig,
  features: {
    ...recursiveEcoConfig.features,
    discord: {
      ...recursiveEcoConfig.features.discord,
      serverId: process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || recursiveEcoConfig.features.discord.serverId,
    },
    donations: {
      ...recursiveEcoConfig.features.donations,
      stripeLink: process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK || recursiveEcoConfig.features.donations.stripeLink,
    },
  },
};