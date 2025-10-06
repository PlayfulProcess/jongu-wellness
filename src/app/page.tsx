'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LINKS } from '@/config/links';
import { Header } from '@/components/shared/Header';
import { MagicLinkAuth } from '@/components/MagicLinkAuth';
import { CollaborationModal } from '@/components/modals/CollaborationModal';
import { SubmitToolModal } from '@/components/modals/SubmitToolModal';
import { ToolGrid } from '@/components/community/ToolGrid';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { SortingControls } from '@/components/community/SortingControls';
import { StatsDisplay } from '@/components/community/StatsDisplay';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase-client';

export default function HomePage() {
  const { status } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSubmitToolModal, setShowSubmitToolModal] = useState(false);
  const [, setUser] = useState<{ email?: string } | null>(null);
  
  // Community tools state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('stars');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryStats, setCategoryStats] = useState({});
  const [totalTools, setTotalTools] = useState(0);
  const [averageStars, setAverageStars] = useState(0);

  const checkUser = async () => {
    const supabase = createClient();
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/community/tools');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const tools = await response.json();
      
      // Ensure tools is an array
      if (!Array.isArray(tools)) {
        console.error('Expected array but got:', typeof tools, tools);
        return;
      }
      
      // Calculate stats
      const stats: {[key: string]: number} = {};
      let totalStars = 0;
      let starredToolsCount = 0;

      tools.forEach((tool: { category: string; star_count: number }) => {
        stats[tool.category] = (stats[tool.category] || 0) + 1;
        if (tool.star_count > 0) {
          totalStars += tool.star_count;
          starredToolsCount++;
        }
      });

      setCategoryStats(stats);
      setTotalTools(tools.length);
      setAverageStars(starredToolsCount > 0 ? totalStars / starredToolsCount : 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error
      setCategoryStats({});
      setTotalTools(0);
      setAverageStars(0);
    }
  };

  useEffect(() => {
    fetchStats();
    checkUser();
    
    // Listen for auth modal events from SubmitToolModal
    const handleAuthModalEvent = () => {
      setShowAuthModal(true);
    };
    
    window.addEventListener('openAuthModal', handleAuthModalEvent);
    
    return () => {
      window.removeEventListener('openAuthModal', handleAuthModalEvent);
    };
  }, []);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        showAuthModal={() => setShowAuthModal(true)}
        showCreateChannelModal={() => setShowCollabModal(true)}
      />

      {/* Section 1: BPS Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Recursive.eco wellness channel:
              <span className="block text-blue-600">Interactive Tools for a better life</span>
            </h1>
            <div className="text-lg text-gray-700 mb-6 max-w-4xl mx-auto text-left">
              <p className="mb-6">
                This channel brings together evidence-based wellness practices with interactive technology to make growth tools accessible to everyone. Starting with research-backed exercises from positive psychology, we&apos;re expanding to include contributions from therapists, coaches, and community members.
              </p>
              <div className="bg-white bg-opacity-70 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">What makes this different?</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-800">
                  <li><strong>Open Access:</strong> All tools are completely free, supported by community donations</li>
                  <li><strong>Inclusive:</strong> Recursive.eco tools will still be valuable without engaging with AI</li>
                  <li><strong>Evidence-Based:</strong> Grounded in science or personal experience (which is also evidence)</li>
                  <li><strong>Community-Driven:</strong> Share tools here or talk about your experience in our Discord channel</li>
                  <li><strong>Self-Hosted:</strong> Many tools can be used without creating accounts or saving personal data</li>
                </ul>
              </div>
              <p className="mt-6 text-gray-600">
                This channel is part of the broader Recursive.eco experiment in recursive virtuous meaning-making. We believe wellness tools should be gateways to growth, not gatekeepers behind paywalls.
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Created by <a href="https://www.playfulprocess.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">PlayfulProcess</a> | Supported by the Recursive.eco Community | 🔓 <a href={LINKS.GITHUB_WELLNESS} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Open source</a>
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Section 2: Community Wellness Tool Garden */}
      <section 
        id="community-tools" 
        className="py-20 bg-white"
        onClick={(e) => {
          // Clear search if clicking outside search-related elements
          const target = e.target as Element;
          if (!target.closest('.search-container') && 
              !target.closest('.recursiveeco-search-button') && 
              searchQuery.trim()) {
            setSearchQuery('');
          }
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Recursive.eco Wellness Tool Garden
            </h2>
            

          </div>

          {/* Stats Display with Search */}
          <div id="tools-search">
            <StatsDisplay
              totalTools={totalTools}
              averageRating={averageStars}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSubmitToolClick={() => setShowSubmitToolModal(true)}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryStats={categoryStats}
            />
            <SortingControls
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Tools Grid */}
          <div className="tools-section">
            <ToolGrid
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              searchQuery={searchQuery}
              onToolStar={fetchStats}
            />
          </div>

        </div>
      </section>

      {/* Section 4: Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-amber-800 text-amber-200 p-4 rounded-lg mb-6 max-w-2xl mx-auto">
              <div className="text-lg font-semibold mb-2">🧪 Active experiment in recursive virtuous meaning-making</div>
            </div>
            
            
            <div className="flex flex-wrap justify-center items-center space-x-6">
              <a href="https://www.playfulprocess.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                Subscribe to PlayfulProcess Blog
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
      <MagicLinkAuth 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <CollaborationModal
        isOpen={showCollabModal}
        onClose={() => setShowCollabModal(false)}
      />

      <SubmitToolModal
        isOpen={showSubmitToolModal}
        onClose={() => setShowSubmitToolModal(false)}
      />


    </div>
  );
}