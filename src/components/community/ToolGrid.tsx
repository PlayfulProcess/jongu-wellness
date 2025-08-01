'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolCard } from './ToolCard';

interface Tool {
  id: string;
  title: string;
  claude_url: string;
  category: string;
  description: string;
  creator_name: string;
  creator_link?: string;
  creator_background?: string;
  thumbnail_url?: string;
  avg_rating: number;
  total_ratings: number;
  view_count: number;
  click_count: number;
}

interface ToolGridProps {
  selectedCategory: string;
  sortBy: string;
  searchQuery?: string;
  onToolRate?: (toolId: string, rating: number, review?: string) => void;
}

export function ToolGrid({ selectedCategory, sortBy, searchQuery = '', onToolRate }: ToolGridProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('sort', sortBy);
      
      if (forceRefresh) {
        params.append('_t', Date.now().toString());
      }
      
      const response = await fetch(`/api/community/tools?${params}`, {
        cache: forceRefresh ? 'no-cache' : 'default'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      
      const data = await response.json();
      setTools(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('Failed to load tools. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleToolRate = async (toolId: string, rating: number, review?: string) => {
    try {
      const response = await fetch(`/api/community/tools/${toolId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review })
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      // Refresh tools to show updated rating
      await fetchTools(true);
      
      if (onToolRate) {
        onToolRate(toolId, rating, review);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  // Filter tools by search query
  const filteredTools = tools.filter(tool =>
    searchQuery === '' ||
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.creator_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">{error}</p>
        </div>
        <button
          onClick={() => fetchTools(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredTools.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">No tools found</p>
          <p className="text-sm">
            {searchQuery 
              ? `No tools match "${searchQuery}"`
              : selectedCategory === 'all' 
                ? 'No tools available yet'
                : `No tools in this category yet`
            }
          </p>
        </div>
        {searchQuery && (
          <p className="text-gray-400 text-sm">
            Try adjusting your search terms or browse all categories
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onRate={handleToolRate}
        />
      ))}
    </div>
  );
}