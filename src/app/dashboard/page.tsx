'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-client';
import { ToolCard } from '@/components/community/ToolCard';
import { ImprovedAuthModal as AuthModal } from '@/components/modals/ImprovedAuthModal';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  submitted_by: string;
  star_count: number;
  total_clicks: number;
  thumbnail_url?: string | null;
  created_at: string;
  approved: boolean;
  active: boolean;
}

interface StarredTool extends Tool {
  starred_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [starredTools, setStarredTools] = useState<StarredTool[]>([]);
  const [submittedTools, setSubmittedTools] = useState<Tool[]>([]);
  const [activeTab, setActiveTab] = useState<'starred' | 'submitted'>('starred');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const supabase = createClient();

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        setShowAuthModal(true);
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setShowAuthModal(true);
    } finally {
      setLoading(false);
    }
  }, [supabase.auth]);

  const fetchStarredTools = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get user's starred tool interactions
      const { data: starData, error: starError } = await supabase
        .from('user_documents')
        .select('document_data, created_at')
        .eq('user_id', user.id as string)
        .eq('document_type', 'interaction')
        .eq('document_data->>interaction_type', 'star')
        .order('created_at', { ascending: false });

      if (starError) throw starError;

      const toolIds = starData?.map(item => item.document_data?.target_id).filter(Boolean) || [];
      
      if (toolIds.length === 0) {
        setStarredTools([]);
        return;
      }

      // Get tool details for starred tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('id, slug, tool_data, created_at')
        .in('id', toolIds);

      if (toolsError) throw toolsError;

      const starredTools = toolsData?.map(tool => {
        const starRecord = starData.find(star => star.document_data?.target_id === tool.id);
        return {
          id: tool.id,
          name: tool.tool_data?.name || '',
          url: tool.tool_data?.url || '#',
          category: tool.tool_data?.category || 'uncategorized',
          description: tool.tool_data?.description || '',
          submitted_by: tool.tool_data?.submitted_by || 'Anonymous',
          star_count: parseInt(tool.tool_data?.stats?.stars || '0'),
          total_clicks: parseInt(tool.tool_data?.stats?.clicks || '0'),
          thumbnail_url: tool.tool_data?.thumbnail_url || null,
          created_at: tool.created_at,
          approved: tool.tool_data?.is_active === 'true',
          active: tool.tool_data?.is_active === 'true',
          starred_at: starRecord?.created_at || tool.created_at
        };
      }) as StarredTool[];

      setStarredTools(starredTools || []);
    } catch (error) {
      console.error('Error fetching starred tools:', error);
    }
  }, [user, supabase]);

  const fetchSubmittedTools = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, slug, tool_data, created_at')
        .eq('tool_data->>creator_id', user.id as string)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedTools = (data || []).map(tool => ({
        id: tool.id,
        name: tool.tool_data?.name || '',
        url: tool.tool_data?.url || '#',
        category: tool.tool_data?.category || 'uncategorized',
        description: tool.tool_data?.description || '',
        submitted_by: tool.tool_data?.submitted_by || 'Anonymous',
        star_count: parseInt(tool.tool_data?.stats?.stars || '0'),
        total_clicks: parseInt(tool.tool_data?.stats?.clicks || '0'),
        thumbnail_url: tool.tool_data?.thumbnail_url || null,
        created_at: tool.created_at,
        approved: tool.tool_data?.is_active === 'true',
        active: tool.tool_data?.is_active === 'true'
      }));
      
      setSubmittedTools(transformedTools);
    } catch (error) {
      console.error('Error fetching submitted tools:', error);
    }
  }, [user, supabase]);

  const handleUnstar = async (toolId: string) => {
    try {
      const response = await fetch(`/api/community/tools/${toolId}/star`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setStarredTools(prev => prev.filter(tool => tool.id !== toolId));
      }
    } catch (error) {
      console.error('Error unstarring tool:', error);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!user) return;

    const confirmed = window.confirm('Are you sure you want to delete this tool? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId)
        .eq('tool_data->>creator_id', user.id as string);

      if (error) throw error;
      
      setSubmittedTools(prev => prev.filter(tool => tool.id !== toolId));
      alert('Tool deleted successfully.');
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Error deleting tool. Please try again.');
    }
  };

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchStarredTools();
      fetchSubmittedTools();
    }
  }, [user, fetchStarredTools, fetchSubmittedTools]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
              checkUser();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Channel
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">My Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('starred')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'starred'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Starred Tools ({starredTools.length})
              </button>
              <button
                onClick={() => setActiveTab('submitted')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submitted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Submissions ({submittedTools.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'starred' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Your Starred Tools</h2>
              <p className="text-gray-600">Tools you&apos;ve starred will appear here for easy access.</p>
            </div>
            
            {starredTools.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No starred tools</h3>
                <p className="mt-1 text-sm text-gray-500">Start by starring some tools you find useful!</p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Tools
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {starredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onUnstar={handleUnstar}
                    isStarred={true}
                    isAuthenticated={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submitted' && (
          <div>
            <div className="mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">Your Submitted Tools</h2>
                <p className="text-gray-600">Tools you&apos;ve submitted to the community.</p>
              </div>
            </div>
            
            {submittedTools.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submitted tools</h3>
                <p className="mt-1 text-sm text-gray-500">You haven&apos;t submitted any tools yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submittedTools.map((tool) => (
                  <div key={tool.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{tool.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{tool.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{tool.category}</span>
                          <span>•</span>
                          <span>{tool.star_count} stars</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tool.approved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tool.approved ? 'Approved' : 'Pending Review'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Tool
                        </a>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}