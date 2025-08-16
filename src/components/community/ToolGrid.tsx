'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolCard } from './ToolCard';
import { createClient } from '@/lib/supabase-client';

interface Tool {
  id: string;
  name: string;
  title?: string;
  url: string;
  category: string;
  description: string;
  submitted_by: string;
  star_count: number;
  thumbnail_url?: string | null;
  created_at: string;
}

interface ToolGridProps {
  selectedCategory: string;
  sortBy: string;
  searchQuery?: string;
  onToolStar?: () => void;
}

export function ToolGrid({ selectedCategory, sortBy, searchQuery = '', onToolStar }: ToolGridProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [starredTools, setStarredTools] = useState<Set<string>>(new Set());
  
  const supabase = createClient();

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
        cache: forceRefresh ? 'no-cache' : 'default',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } : {}
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

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }, [supabase.auth]);

  const fetchStarredTools = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('document_data')
        .eq('user_id', user.id)
        .eq('document_type', 'interaction')
        .eq('document_data->>interaction_type', 'star');

      if (!error && data) {
        const toolIds = data.map(item => item.document_data?.target_id).filter(Boolean);
        setStarredTools(new Set(toolIds));
      }
    } catch (error) {
      console.error('Error fetching starred tools:', error);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchTools();
    checkUser();
  }, [fetchTools, checkUser]);

  useEffect(() => {
    if (user) {
      fetchStarredTools();
    }
  }, [user, fetchStarredTools]);

  const handleStar = async (toolId: string) => {
    // Update local state
    setStarredTools(prev => new Set([...prev, toolId]));
    
    // Small delay then refresh tools to show updated star count
    setTimeout(async () => {
      await fetchTools(true);
    }, 100);
    
    if (onToolStar) {
      onToolStar();
    }
  };

  const handleUnstar = async (toolId: string) => {
    // Update local state
    setStarredTools(prev => {
      const newSet = new Set(prev);
      newSet.delete(toolId);
      return newSet;
    });
    
    // Small delay then refresh tools to show updated star count
    setTimeout(async () => {
      await fetchTools(true);
    }, 100);
    
    if (onToolStar) {
      onToolStar();
    }
  };

  // Filter tools by search query
  const filteredTools = tools.filter(tool =>
    searchQuery === '' ||
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.submitted_by.toLowerCase().includes(searchQuery.toLowerCase())
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
          onStar={handleStar}
          onUnstar={handleUnstar}
          isStarred={starredTools.has(tool.id)}
          isAuthenticated={!!user}
        />
      ))}
    </div>
  );
}