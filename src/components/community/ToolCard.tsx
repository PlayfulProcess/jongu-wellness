'use client';

import { useState } from 'react';
import { StarErrorModal } from './StarErrorModal';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { ExternalLinkWarningModal } from '@/components/modals/ExternalLinkWarningModal';

interface Tool {
  id: string;
  name: string;
  title?: string;
  url: string;
  category: string[];  // Now an array of hashtags
  description: string;
  submitted_by: string;
  creator_link?: string | null;
  star_count: number;
  thumbnail_url?: string | null;
  created_at: string;
}

interface ToolCardProps {
  tool: Tool;
  onStar?: (toolId: string) => void;
  onUnstar?: (toolId: string) => void;
  isStarred?: boolean;
  onHashtagClick?: (hashtag: string) => void;
}

function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return !urlObj.hostname.includes('recursive.eco');
  } catch {
    return false;
  }
}

export function ToolCard({ tool, onStar, onUnstar, isStarred = false, onHashtagClick }: ToolCardProps) {
  const [isStarring, setIsStarring] = useState(false);
  const [showStarError, setShowStarError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showExternalWarning, setShowExternalWarning] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>('');

  const handleToolClick = () => {
    if (isExternalUrl(tool.url)) {
      setPendingUrl(tool.url);
      setShowExternalWarning(true);
    } else {
      window.open(tool.url, '_blank');
    }
  };

  const handleContinueToExternal = () => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank');
      setPendingUrl('');
    }
  };

  const handleCreatorLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (isExternalUrl(url)) {
      setPendingUrl(url);
      setShowExternalWarning(true);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleStarToggle = async () => {
    // Try making the API call even if client thinks user is not authenticated
    // Let the server decide the authentication status
    setIsStarring(true);
    try {
      const response = await fetch(`/api/community/tools/${tool.id}/star`, {
        method: isStarred ? 'DELETE' : 'POST',
        credentials: 'include', // Ensure cookies are sent
      });
      
      if (response.status === 401) {
        alert('Please sign in to star tools');
        return;
      }

      if (response.status === 409) {
        // 409 means already starred - this is actually a success case when trying to star
        if (!isStarred) {
          onStar?.(tool.id);
        }
        return;
      }

      if (response.status === 404 && isStarred) {
        // 404 when unstarring means it wasn't starred - update local state
        onUnstar?.(tool.id);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Debug - Star API error:', errorData);
        
        // Handle specific error cases with better UX
        if (response.status === 409 || errorData.error?.includes('already starred')) {
          // Tool already starred - likely a sync issue
          setShowStarError(true);
          return;
        }
        
        // Generic error
        alert('Failed to update star. Please try refreshing the page and trying again.');
        return;
      }

      // Success - call the appropriate handler
      if (isStarred) {
        onUnstar?.(tool.id);
      } else {
        onStar?.(tool.id);
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      alert('Failed to update star. Please try again.');
    } finally {
      setIsStarring(false);
    }
  };

  const renderStarButton = () => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleStarToggle();
        }}
        disabled={isStarring}
        title={isStarred ? 'Saved - View in Dashboard' : 'Save to Dashboard'}
        className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isStarred
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
        } ${isStarring ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg
          className={`w-4 h-4 ${isStarred ? 'fill-yellow-500' : 'fill-none'}`}
          stroke={isStarred ? '#eab308' : '#6b7280'}
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        <span>{isStarred ? 'Saved' : 'Save'}</span>
      </button>
    );
  };

  return (
    <div
      onClick={handleToolClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full cursor-pointer relative"
    >
      {/* Save Button - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        {renderStarButton()}
      </div>

      {/* Enhanced Image/Placeholder Area */}
      <div className="relative h-48">
        {tool.thumbnail_url && !imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getProxiedImageUrl(tool.thumbnail_url)}
            alt={tool.title || tool.name || 'Tool thumbnail'}
            className="w-full h-full object-contain bg-gray-50"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center text-gray-500 p-6">
              <div className="text-4xl mb-2">🛠️</div>
              <p className="text-sm font-medium">No Preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title and Save Count */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
            {tool.name}
          </h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600" title={`${tool.star_count} saves`}>
            <svg className="w-4 h-4 fill-yellow-500" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>{tool.star_count}</span>
          </div>
        </div>

        {/* Description - show full 300 characters */}
        <div className="flex-grow">
          <p className="text-gray-600 text-sm mb-4">
            {tool.description.slice(0, 300)}
          </p>
        </div>

        {/* Hashtags */}
        {tool.category && tool.category.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tool.category.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onHashtagClick?.(tag);
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Creator Info */}
        <div className="flex items-center mt-auto">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Submitted by</p>
            {tool.creator_link ? (
              <a
                href={tool.creator_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleCreatorLinkClick(e, tool.creator_link!)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors underline"
              >
                {tool.submitted_by}
              </a>
            ) : (
              <p className="text-sm font-medium text-gray-900">{tool.submitted_by}</p>
            )}
          </div>
        </div>
      </div>

      {/* Star Error Modal */}
      <StarErrorModal
        isOpen={showStarError}
        onClose={() => setShowStarError(false)}
        onRefresh={() => window.location.reload()}
      />

      {/* External Link Warning Modal */}
      <ExternalLinkWarningModal
        isOpen={showExternalWarning}
        onClose={() => {
          setShowExternalWarning(false);
          setPendingUrl('');
        }}
        onContinue={handleContinueToExternal}
        url={pendingUrl}
      />
    </div>
  );
}