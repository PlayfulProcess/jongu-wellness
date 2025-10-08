import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { ChannelHero } from '@/components/ChannelHero';
import { CommunitySection } from '@/components/CommunitySection';
import { PageModals } from '@/components/PageModals';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section - Loaded from MDX */}
      <ChannelHero channelSlug="wellness" />

      {/* Community Wellness Tool Garden */}
      <CommunitySection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-amber-800 text-amber-200 p-4 rounded-lg mb-6 max-w-2xl mx-auto">
              <div className="text-lg font-semibold mb-2">Beta Version | 🧪 Active experiment in recursive virtuous meaning-making</div>
            </div>

            <div className="flex flex-wrap justify-center items-center space-x-6">
              <a href="https://lifeisprocess.substack.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                Substack
              </a>
              <a href="https://github.com/PlayfulProcess" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact Us
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              <p className="mb-2 text-center">Platform under <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300 underline">CC BY-SA 4.0</a> | User content remains with creators | © 2025 Recursive.eco by PlayfulProcess LLC</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PageModals />
    </div>
  );
}
