import { getChannelContent } from '@/lib/loadChannel';

interface ChannelHeroProps {
  channelSlug: string;
}

export async function ChannelHero({ channelSlug }: ChannelHeroProps) {
  const channel = await getChannelContent(channelSlug);

  if (!channel) {
    return (
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900">Channel not found</h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`bg-gradient-to-br ${channel.config.gradient} py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* MDX content renders here with Title, Subtitle, Text, Box components */}
          {channel.content}
        </div>
      </div>
    </section>
  );
}
