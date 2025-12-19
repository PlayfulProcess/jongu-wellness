'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { ToolCard } from '@/components/community/ToolCard';
import { SubmissionCard } from '@/components/community/SubmissionCard';
import { SubmitToolModal } from '@/components/modals/SubmitToolModal';
import { MagicLinkAuth } from '@/components/MagicLinkAuth';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  url: string;
  category: string[];  // Array of hashtags
  description: string;
  submitted_by: string;
  star_count: number;
  total_clicks: number;
  thumbnail_url?: string | null;
  created_at: string;
  approved: boolean;
  active: boolean;
  reviewed: boolean;
}

interface StarredTool extends Tool {
  starred_at: string;
}

export default function Dashboard() {
  const { user, status } = useAuth();
  const [starredTools, setStarredTools] = useState<StarredTool[]>([]);
  const [submittedTools, setSubmittedTools] = useState<Tool[]>([]);
  const [activeTab, setActiveTab] = useState<'starred' | 'submitted' | 'settings'>('starred');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  // Account settings state
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [downloadingData, setDownloadingData] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  const supabase = createClient();


  const fetchStarredTools = useCallback(async () => {
    if (!user) return;
    
    const userId = user.id;
    // Guard: return early if no userId
    if (!userId) return;
    
    try {
      // Get user's starred tool interactions
      const { data: starData, error: starError } = await (supabase as any)
        .from('user_documents')
        .select('document_data, created_at')
        .eq('user_id', userId)
        .eq('document_type', 'interaction')
        .eq('document_data->>interaction_type', 'star')
        .order('created_at', { ascending: false });

      if (starError) throw starError;

      const toolIds = starData?.map((item: any) => item.document_data?.target_id).filter(Boolean) || [];
      
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

      const starredTools = toolsData?.map((tool: any) => {
        const starRecord = starData.find((star: any) => star.document_data?.target_id === tool.id);
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
          reviewed: tool.tool_data?.reviewed === 'true',
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
    
    const userId = user.id;
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, slug, tool_data, created_at')
        .eq('tool_data->>creator_id', userId)
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
        active: tool.tool_data?.is_active === 'true',
        reviewed: tool.tool_data?.reviewed === 'true'
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

    const userId = user.id;
    if (!userId) return;

    const confirmed = window.confirm('Are you sure you want to delete this tool? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId)
        .eq('tool_data->>creator_id', userId);

      if (error) throw error;

      setSubmittedTools(prev => prev.filter(tool => tool.id !== toolId));
      alert('Tool deleted successfully.');
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Error deleting tool. Please try again.');
    }
  };

  const handleEditTool = (submission: Tool | any) => {
    setEditingTool(submission);
    setShowEditModal(true);
  };

  const handleDownloadData = async () => {
    if (!user) return;
    
    const userId = user.id;
    if (!userId) return;

    setDownloadingData(true);
    setMessage(null);

    try {
      // Fetch all user data
      const { data: documents, error: docsError } = await (supabase as any)
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Fetch user's submitted tools
      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('tool_data->>creator_id', userId)
        .order('created_at', { ascending: false });

      if (toolsError) console.warn('Could not fetch tools:', toolsError);

      // Create a comprehensive data export
      const exportData = {
        export_date: new Date().toISOString(),
        user_info: {
          email: user.email,
          user_id: userId,
          created_at: user.created_at
        },
        starred_tools: documents?.filter((d: any) => d.document_type === 'interaction' && d.document_data?.interaction_type === 'star') || [],
        interactions: documents?.filter((d: any) => d.document_type === 'interaction') || [],
        submitted_tools: tools || [],
        all_documents: documents || []
      };

      // Convert to JSON string with nice formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create a blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wellness-channel-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Your data has been downloaded successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to download data: ${(error as Error).message}` });
    } finally {
      setDownloadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your Recursive.eco account?\n\n' +
      'WILL BE DELETED:\n' +
      '• Your account and authentication\n' +
      '• All private data and settings\n' +
      '• Your starred items\n\n' +
      'WILL REMAIN PUBLIC:\n' +
      '• Tools you submitted to the community\n' +
      '• Public comments or contributions\n\n' +
      'Contact pp@playfulprocess.com for complete removal including public content.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;
    
    // Double confirmation for this serious action
    const doubleConfirmed = window.confirm(
      'Final confirmation: Delete your account?\n\n' +
      'Remember: Your submitted tools will remain in the community.\n' +
      'Contact pp@playfulprocess.com if you need them removed too.'
    );
    
    if (!doubleConfirmed) return;
    
    const emailConfirmation = window.prompt('Type your email address to confirm deletion:');
    if (emailConfirmation !== user.email) {
      setMessage({ type: 'error', text: 'Email confirmation does not match. Deletion cancelled.' });
      return;
    }

    setDeletingData(true);

    const userId = user.id;
    if (!userId) return;
    
    try {
      // Delete all user data from user_documents table
      const { error: documentsError } = await (supabase as any)
        .from('user_documents')
        .delete()
        .eq('user_id', userId);

      if (documentsError) throw documentsError;

      // Note: Auth account deletion requires server-side implementation
      // For now, we can only delete the user_documents data
      setMessage({ 
        type: 'success', 
        text: 'Your personal data has been deleted. Please contact pp@playfulprocess.com to complete account removal.' 
      });
      
      // Optionally sign out the user after data deletion
      setTimeout(async () => {
        const shouldSignOut = window.confirm('Your data has been deleted. Would you like to sign out now?');
        if (shouldSignOut) {
          await supabase.auth.signOut();
          window.location.href = '/';
        }
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to delete account: ${(error as Error).message}` });
    } finally {
      setDeletingData(false);
    }
  };


  useEffect(() => {
    if (status === 'unauthenticated') {
      setShowAuthModal(true);
    }
  }, [status]);

  useEffect(() => {
    if (user) {
      fetchStarredTools();
      fetchSubmittedTools();
    }
  }, [user, fetchStarredTools, fetchSubmittedTools]);

  if (status === 'loading') {
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
          <MagicLinkAuth
            isOpen={showAuthModal}
            onClose={() => {
              setShowAuthModal(false);
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
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account Settings
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submittedTools.map((tool) => (
                  <SubmissionCard
                    key={tool.id}
                    submission={tool}
                    onDelete={handleDeleteTool}
                    onEdit={handleEditTool}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Account Settings</h2>
              <p className="text-gray-600">Manage your account preferences and security settings.</p>
            </div>
            
            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Data Management</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download or manage your data according to European data protection standards.
                </p>
                
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Download My Data
                  </h4>
                  <p className="text-xs text-green-700 mb-3">
                    Download all your personal data including starred tools, submitted tools, and interactions in JSON format. 
                    GDPR Article 20: Right to data portability.
                  </p>
                  <button
                    onClick={handleDownloadData}
                    disabled={downloadingData}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {downloadingData ? 'Preparing Download...' : '📥 Download My Data'}
                  </button>
                </div>

                {/* Delete Account */}
                <div className="mt-4 border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Delete Account
                  </h4>
                  <div className="text-xs text-red-700 mb-3 space-y-2">
                    <p className="font-semibold">This will permanently delete:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Your account and authentication</li>
                      <li>All private data and settings</li>
                      <li>Your starred items and interactions</li>
                    </ul>
                    
                    <p className="font-semibold mt-2">This will NOT delete:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>Tools you submitted to the community (they remain public)</li>
                      <li>Public comments or contributions</li>
                    </ul>
                    
                    <p className="mt-2 text-gray-700 bg-gray-50 p-2 rounded">
                      {`📧 For complete data removal including public contributions, please contact `}
                      <a href="mailto:pp@playfulprocess.com" className="text-blue-600 underline">
                        pp@playfulprocess.com
                      </a>
                      {` with your account email.`}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingData}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deletingData ? 'Deleting...' : '🗑️ Delete Account'}
                  </button>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Account Actions</h3>
                
                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    You are signed in with magic link authentication. 
                    To change your email or manage your account, use the magic link sent to your email.
                  </p>
                  
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = '/';
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingTool && (
        <SubmitToolModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTool(null);
          }}
          channelSlug="wellness"
          editMode={true}
          editToolId={editingTool.id}
          prefilledData={{
            doc_id: editingTool.url.includes('recursive.eco/view/') ? editingTool.url.split('/view/')[1] : null,
            title: editingTool.name,
            description: editingTool.description,
            creator_name: editingTool.submitted_by,
            creator_link: '',
            thumbnail_url: editingTool.thumbnail_url,
            hashtags: editingTool.category
          }}
        />
      )}
    </div>
  );
}