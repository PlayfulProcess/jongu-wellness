import { compileMDX } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import { ChannelComponents } from '@/components/mdx/ChannelComponents';

export interface ChannelMetadata {
  name: string;
  gradient: string;
}

export interface ChannelConfig {
  slug: string;
  name: string;
  gradient: string;
}

// Default gradients for channels (can be overridden in MDX frontmatter)
const DEFAULT_GRADIENTS: { [key: string]: string } = {
  wellness: 'from-blue-50 to-indigo-100',
  creativity: 'from-purple-50 to-pink-100',
  productivity: 'from-green-50 to-teal-100',
  relationships: 'from-pink-50 to-rose-100',
  mindfulness: 'from-indigo-50 to-blue-100',
  // Add more defaults as needed, or leave blank to use a generic gradient
};

const FALLBACK_GRADIENT = 'from-gray-50 to-slate-100';

// Helper to convert slug to display name
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getChannelContent(slug: string) {
  const filePath = path.join(process.cwd(), 'src/channels', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    console.error(`Channel file not found: ${filePath}`);
    return null;
  }

  const source = fs.readFileSync(filePath, 'utf-8');

  const { content, frontmatter } = await compileMDX<ChannelMetadata>({
    source,
    components: ChannelComponents,
    options: { parseFrontmatter: true },
  });

  // Build config from frontmatter or defaults
  const config: ChannelConfig = {
    slug,
    name: frontmatter?.name || slugToName(slug),
    gradient: frontmatter?.gradient || DEFAULT_GRADIENTS[slug] || FALLBACK_GRADIENT,
  };

  return { content, config };
}

// Automatically discover all channels from the src/channels directory
export function getAllChannels(): ChannelConfig[] {
  const channelsDir = path.join(process.cwd(), 'src/channels');

  if (!fs.existsSync(channelsDir)) {
    console.warn('Channels directory not found:', channelsDir);
    return [];
  }

  const files = fs.readdirSync(channelsDir);
  const mdxFiles = files.filter(file => file.endsWith('.mdx'));

  return mdxFiles.map(file => {
    const slug = file.replace('.mdx', '');
    return {
      slug,
      name: slugToName(slug),
      gradient: DEFAULT_GRADIENTS[slug] || FALLBACK_GRADIENT,
    };
  });
}
