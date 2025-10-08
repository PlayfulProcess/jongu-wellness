'use client';

import { useState, useEffect } from 'react';
import { HashtagFilter } from '@/components/community/HashtagFilter';
import { SortingControls } from '@/components/community/SortingControls';
import { StatsDisplay } from '@/components/community/StatsDisplay';
import { ToolGrid } from '@/components/community/ToolGrid';

interface Tool {
  id: string;
  name: string;
  title?: string;
  url: string;
  category: string[];
  description: string;
  submitted_by: string;
  creator_link?: string | null;
  star_count: number;
  thumbnail_url?: string | null;
  created_at: string;
  approved?: boolean;
  active?: boolean;
}

export function CommunitySection() {
  const handleSubmitToolClick = () => {
    if ((window as any).__openSubmitToolModal) {
      (window as any).__openSubmitToolModal();
    }
  };
  const [selectedHashtag, setSelectedHashtag] = useState('all');
  const [sortBy, setSortBy] = useState('stars');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [totalTools, setTotalTools] = useState(0);
  const [totalStars, setTotalStars] = useState(0);

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

      // Set all tools for client-side filtering
      setAllTools(tools);
      setTotalTools(tools.length);

      // Calculate total stars
      const allStars = tools.reduce((sum: number, tool: { star_count: number }) => sum + (tool.star_count || 0), 0);
      setTotalStars(allStars);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error
      setAllTools([]);
      setTotalTools(0);
      setTotalStars(0);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
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
            totalStars={totalStars}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSubmitToolClick={handleSubmitToolClick}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <HashtagFilter
            selectedHashtag={selectedHashtag}
            onHashtagChange={setSelectedHashtag}
            allTools={allTools}
          />
          <SortingControls
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Tools Grid */}
        <div className="tools-section">
          <ToolGrid
            selectedHashtag={selectedHashtag}
            sortBy={sortBy}
            searchQuery={searchQuery}
            onToolStar={fetchStats}
            onHashtagClick={setSelectedHashtag}
          />
        </div>
      </div>
    </section>
  );
}
