import { compileMDX } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import { ChannelComponents } from '@/components/mdx/ChannelComponents';

export interface ChannelConfig {
  slug: string;
  name: string;
  gradient: string;
}

// Simple config for channel metadata
const CHANNELS: ChannelConfig[] = [
  {
    slug: 'wellness',
    name: 'Wellness',
    gradient: 'from-blue-50 to-indigo-100'
  },
  // Add more channels here as needed
  // { slug: 'creativity', name: 'Creativity', gradient: 'from-purple-50 to-pink-100' },
];

export async function getChannelContent(slug: string) {
  const filePath = path.join(process.cwd(), 'src/channels', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    console.error(`Channel file not found: ${filePath}`);
    return null;
  }

  const source = fs.readFileSync(filePath, 'utf-8');

  const { content } = await compileMDX({
    source,
    components: ChannelComponents,
  });

  const config = CHANNELS.find(c => c.slug === slug);

  if (!config) {
    console.error(`Channel config not found for slug: ${slug}`);
    return null;
  }

  return { content, config };
}

export function getAllChannels() {
  return CHANNELS;
}
