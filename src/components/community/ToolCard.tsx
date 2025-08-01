'use client';

import { useState } from 'react';

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

interface ToolCardProps {
  tool: Tool;
  onRate?: (toolId: string, rating: number, review?: string) => void;
}

const getCategoryDesign = (category: string) => {
  const designs = {
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

export function ToolCard({ tool, onRate }: ToolCardProps) {
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');

  const handleToolClick = async () => {
    try {
      await fetch('/api/community/tools/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    
    window.open(tool.claude_url, '_blank');
  };

  const handleSubmitRating = () => {
    if (selectedRating > 0 && onRate) {
      onRate(tool.id, selectedRating, review);
      setShowRating(false);
      setSelectedRating(0);
      setReview('');
    }
  };

  const renderStars = (rating: number, interactive = false, onClick?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onClick?.(star)}
            disabled={!interactive}
            className={`w-4 h-4 ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <svg
              fill={star <= rating ? '#facc15' : 'none'}
              stroke={star <= rating ? '#facc15' : '#d1d5db'}
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const design = getCategoryDesign(tool.category);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      {/* Enhanced Image/Placeholder Area */}
      <div className="relative h-48">
        {tool.thumbnail_url ? (
          <>
            <img
              src={tool.thumbnail_url}
              alt={tool.title}
              className="w-full h-full object-cover"
            />
            {/* Category badge for images */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${design.gradient} ${design.textColor} shadow-lg`}>
                <span className="text-sm">{design.icon}</span>
                {design.name}
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
      <div className="p-4">
        {/* Title and Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
            {tool.title}
          </h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            {renderStars(Math.round(tool.avg_rating))}
            <span className="ml-1">({tool.total_ratings})</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {tool.description}
        </p>

        {/* Creator Info */}
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Created by</p>
            {tool.creator_link ? (
              <a
                href={tool.creator_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {tool.creator_name}
              </a>
            ) : (
              <p className="text-sm font-medium text-gray-900">{tool.creator_name}</p>
            )}
            {tool.creator_background && (
              <p className="text-xs text-gray-500 mt-1">{tool.creator_background}</p>
            )}
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>{tool.view_count} views</div>
            <div>{tool.click_count} tries</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleToolClick}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Try This Tool
          </button>
          <button
            onClick={() => setShowRating(!showRating)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Rate & Review
          </button>
        </div>

        {/* Rating Form */}
        {showRating && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              {renderStars(selectedRating, true, setSelectedRating)}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Share your experience with this tool..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSubmitRating}
                disabled={selectedRating === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Rating
              </button>
              <button
                onClick={() => {
                  setShowRating(false);
                  setSelectedRating(0);
                  setReview('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}