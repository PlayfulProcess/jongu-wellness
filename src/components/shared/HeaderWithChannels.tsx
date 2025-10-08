import { getAllChannels } from '@/lib/loadChannel';
import { Header } from './Header';
import { ChannelSwitcher } from './ChannelSwitcher';

interface HeaderWithChannelsProps {
  currentChannelSlug?: string;
}

export async function HeaderWithChannels({ currentChannelSlug = 'wellness' }: HeaderWithChannelsProps) {
  const channels = await getAllChannels();

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + Channel Switcher */}
          <div className="flex items-center space-x-4">
            <Header />
            <ChannelSwitcher channels={channels} currentSlug={currentChannelSlug} />
          </div>
        </div>
      </div>
    </div>
  );
}
