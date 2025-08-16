'use client';

import { useState } from 'react';
import Image from 'next/image';
import { StarErrorModal } from './StarErrorModal';

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

interface ToolCardProps {
  tool: Tool;
  onStar?: (toolId: string) => void;
  onUnstar?: (toolId: string) => void;
  isStarred?: boolean;
  isAuthenticated?: boolean;
}

const getCategoryDesign = (category: string) => {
  const designs: Record<string, {
    gradient: string;
    textColor: string;
    icon: string;
    name: string;
  }> = {
    'mindfulness': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '🧘‍♀️',
      name: 'Mindfulness'
    },
    'distress-tolerance': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '🌊',
      name: 'Distress Tolerance'
    },
    'emotion-regulation': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '💝',
      name: 'Emotion Regulation'
    },
    'interpersonal-effectiveness': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '🤝',
      name: 'Interpersonal Skills'
    },
    'creativity': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '🎨',
      name: 'Creativity'
    },
    'productivity': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '⚡',
      name: 'Productivity'
    },
    'health': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '🌱',
      name: 'Health & Wellness'
    },
    'relationships': {
      gradient: 'bg-blue-50',
      textColor: 'text-gray-800',
      icon: '💕',
      name: 'Relationships'
    }
  };
  
  return designs[category] || {
    gradient: 'bg-blue-50',
    textColor: 'text-gray-800',
    icon: '🛠️',
    name: category || 'Tool'
  };
};

export function ToolCard({ tool, onStar, onUnstar, isStarred = false, isAuthenticated = false }: ToolCardProps) {
  const [isStarring, setIsStarring] = useState(false);
  const [showStarError, setShowStarError] = useState(false);

  const handleToolClick = () => {
    window.open(tool.url, '_blank');
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
        onClick={handleStarToggle}
        disabled={isStarring}
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
        <span>{isStarred ? 'Starred' : 'Star'}</span>
      </button>
    );
  };

  const design = getCategoryDesign(tool.category);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
      {/* Enhanced Image/Placeholder Area */}
      <div className="relative h-48">
        {tool.thumbnail_url ? (
          <>
            <Image
              src={tool.thumbnail_url}
              alt={tool.title || tool.name || 'Tool thumbnail'}
              width={400}
              height={300}
              className="w-full h-full object-contain bg-gray-50"
            />
            {/* Category badge for images */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm shadow-lg`}>
                <span className="text-lg">{design.icon}</span>
              </span>
            </div>
          </>
        ) : (
          <div className={`w-full h-full ${design.gradient} flex items-center justify-center relative overflow-hidden`}>
            {/* Subtle geometric pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236b7280' fill-opacity='0.3'%3E%3Cpath d='M0 0h80v80H0V0zm20 20v40h40V20H20zm20 35a15 15 0 1 1 0-30 15 15 0 0 1 0 30z' fill-opacity='0.1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <div className={`text-center ${design.textColor} relative z-10 p-6`}>
              <div className="text-6xl mb-4 drop-shadow-lg filter">
                {design.icon}
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider drop-shadow-md">
                {design.name}
              </h3>
              <div className="mt-3 w-16 h-0.5 bg-gray-400/40 mx-auto rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title and Stars */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
            {tool.name}
          </h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <svg className="w-4 h-4 fill-yellow-500" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>{tool.star_count}</span>
          </div>
        </div>

        {/* Description - pad to ensure consistent height */}
        <div className="flex-grow">
          <p className="text-gray-600 text-sm mb-4 min-h-[4.5rem] line-clamp-3">
            {tool.description.padEnd(150, ' ')}
          </p>
        </div>

        {/* Creator Info */}
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Submitted by</p>
            <p className="text-sm font-medium text-gray-900">{tool.submitted_by}</p>
          </div>
        </div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex space-x-2 mt-auto">
          <button
            onClick={handleToolClick}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try This Tool
          </button>
          {renderStarButton()}
        </div>
      </div>
      
      {/* Star Error Modal */}
      <StarErrorModal 
        isOpen={showStarError}
        onClose={() => setShowStarError(false)}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}