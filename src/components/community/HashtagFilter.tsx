'use client';

import { useMemo } from 'react';

interface Tool {
  id: string;
  category: string[];
  name?: string;
  description?: string;
  star_count?: number;
  created_at?: string;
}

interface HashtagFilterProps {
  selectedHashtag: string;
  onHashtagChange: (hashtag: string) => void;
  allTools: Tool[];
}

export function HashtagFilter({ selectedHashtag, onHashtagChange, allTools }: HashtagFilterProps) {
  // Calculate popular hashtags client-side
  const hashtagCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};

    allTools.forEach(tool => {
      tool.category?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 15); // Top 15
  }, [allTools]);

  const totalTools = allTools.length;

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {/* All button */}
      <button
        onClick={() => onHashtagChange('all')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
          selectedHashtag === 'all'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:text-blue-600'
        }`}
      >
        <span className="font-medium">All</span>
        <span className={`text-sm px-2 py-1 rounded-full ml-1 ${
          selectedHashtag === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {totalTools}
        </span>
      </button>

      {/* Hashtag buttons */}
      {hashtagCounts.map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => onHashtagChange(tag)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
            selectedHashtag === tag
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:text-blue-600'
          }`}
        >
          <span className="font-medium">#{tag}</span>
          <span className={`text-sm px-2 py-1 rounded-full ml-1 ${
            selectedHashtag === tag
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
