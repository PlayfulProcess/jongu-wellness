import { compileMDX } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import { ChannelComponents } from '@/components/mdx/ChannelComponents';
import { createAdminClient } from '@/lib/supabase-admin';

export interface ChannelMetadata {
  name: string;
  gradient: string;
}

export interface ChannelConfig {
  slug: string;
  name: string;
  gradient: string;
  totalStars?: number;
}

// Default gradients for channels (can be overridden in MDX frontmatter)
const DEFAULT_GRADIENTS: { [key: string]: string } = {
  wellness: 'from-blue-50 to-indigo-100',
  creativity: 'from-purple-50 to-pink-100',
  productivity: 'from-green-50 to-teal-100',
  relationships: 'from-pink-50 to-rose-100',
  mindfulness: 'from-indigo-50 to-blue-100',
  tarot: 'from-indigo-50 to-violet-100',
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
// and order them by total star count (descending)
export async function getAllChannels(): Promise<ChannelConfig[]> {
  const channelsDir = path.join(process.cwd(), 'src/channels');

  if (!fs.existsSync(channelsDir)) {
    console.warn('Channels directory not found:', channelsDir);
    return [];
  }

  const files = fs.readdirSync(channelsDir);
  const mdxFiles = files.filter(file => file.endsWith('.mdx'));

  // Get basic channel info from MDX frontmatter
  const channels = mdxFiles.map(file => {
    const slug = file.replace('.mdx', '');
    const filePath = path.join(channelsDir, file);
    const source = fs.readFileSync(filePath, 'utf-8');

    // Extract frontmatter name if it exists
    let name = slugToName(slug);
    let gradient = DEFAULT_GRADIENTS[slug] || FALLBACK_GRADIENT;

    const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const nameMatch = frontmatter.match(/name:\s*(.+)/);
      const gradientMatch = frontmatter.match(/gradient:\s*(.+)/);

      if (nameMatch) name = nameMatch[1].trim();
      if (gradientMatch) gradient = gradientMatch[1].trim();
    }

    return {
      slug,
      name,
      gradient,
    };
  });

  // Fetch star counts from database
  try {
    const supabase = createAdminClient();

    const channelStars = await Promise.all(
      channels.map(async (channel) => {
        const { data, error } = await supabase
          .from('tools')
          .select('tool_data')
          .eq('channel_slug', channel.slug);

        if (error) {
          console.error(`Error fetching stars for ${channel.slug}:`, error);
          return { ...channel, totalStars: 0 };
        }

        const totalStars = (data || []).reduce((sum, tool) => {
          const toolData = tool.tool_data as any;
          const stars = parseInt(toolData?.stats?.stars || '0');
          return sum + stars;
        }, 0);

        return { ...channel, totalStars };
      })
    );

    // Sort by total stars (descending)
    return channelStars.sort((a, b) => (b.totalStars || 0) - (a.totalStars || 0));
  } catch (error) {
    console.error('Error fetching channel star counts:', error);
    // Return unsorted channels if there's an error
    return channels;
  }
}
