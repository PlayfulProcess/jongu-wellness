'use client';

import { useState } from 'react';
import { getProxiedImageUrl } from '@/lib/image-utils';
import { getSubmissionStatus } from '@/lib/admin-utils';
import { ExternalLinkWarningModal } from '@/components/modals/ExternalLinkWarningModal';

interface Submission {
  id: string;
  name?: string;
  title?: string;
  url?: string;
  claude_url?: string;
  category: string[] | string;
  description: string;
  submitted_by?: string;
  creator_name?: string;
  creator_link?: string | null;
  star_count?: number;
  thumbnail_url?: string | null;
  submitter_email?: string | null;
  channel_slug?: string;
  created_at: string;
  approved: boolean;
  reviewed: boolean;
}

interface SubmissionCardProps {
  submission: Submission;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (submission: Submission) => void;
  showAdminActions?: boolean;
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

export function SubmissionCard({
  submission,
  onDelete,
  onApprove,
  onReject,
  onEdit,
  showAdminActions = false,
  onHashtagClick
}: SubmissionCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showExternalWarning, setShowExternalWarning] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>('');

  const status = getSubmissionStatus(submission.approved, submission.reviewed);
  const toolUrl = submission.url || submission.claude_url || '#';
  const toolName = submission.name || submission.title || 'Untitled';
  const creatorName = submission.submitted_by || submission.creator_name || 'Anonymous';
  const categories = Array.isArray(submission.category) ? submission.category : [submission.category];

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();

    if (isExternalUrl(url)) {
      setPendingUrl(url);
      setShowExternalWarning(true);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleContinueToExternal = () => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank');
      setPendingUrl('');
    }
  };

  const handleCardClick = () => {
    if (isExternalUrl(toolUrl)) {
      setPendingUrl(toolUrl);
      setShowExternalWarning(true);
    } else {
      window.open(toolUrl, '_blank');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full cursor-pointer relative"
    >
      {/* Badges - Top Right */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${status.colorClass} shadow-sm`}>
          {status.label}
        </span>
        {submission.channel_slug && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800 shadow-sm">
            #{submission.channel_slug}
          </span>
        )}
      </div>

      {/* Enhanced Image/Placeholder Area */}
      <div className="relative h-48">
        {submission.thumbnail_url && !imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getProxiedImageUrl(submission.thumbnail_url)}
            alt={toolName}
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
        {/* Title and Star Count */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
            {toolName}
          </h3>
          {submission.star_count !== undefined && (
            <div className="flex items-center space-x-1 text-sm text-gray-600" title={`${submission.star_count} saves`}>
              <svg className="w-4 h-4 fill-yellow-500" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>{submission.star_count}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex-grow">
          <p className="text-gray-600 text-sm mb-4 min-h-[6rem] line-clamp-4">
            {submission.description.slice(0, 300)}
          </p>
        </div>

        {/* Hashtags */}
        {categories.length > 0 && categories[0] !== 'uncategorized' && (
          <div className="flex flex-wrap gap-1 mb-4">
            {categories.map((tag) => (
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
        <div className="flex items-center mt-auto mb-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Submitted by</p>
            {submission.creator_link ? (
              <a
                href={submission.creator_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleLinkClick(e, submission.creator_link!)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors underline"
              >
                {creatorName}
              </a>
            ) : (
              <p className="text-sm font-medium text-gray-900">{creatorName}</p>
            )}
            {/* Show email in admin view */}
            {showAdminActions && submission.submitter_email && (
              <p className="text-xs text-gray-500 mt-1">
                {submission.submitter_email}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showAdminActions && onApprove && onReject && (
          <>
            <div className="flex space-x-2 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(submission.id);
                }}
                disabled={submission.approved && submission.reviewed}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(submission.id);
                }}
                disabled={submission.reviewed && !submission.approved}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Reject
              </button>
            </div>
            {onEdit && (
              <div className="flex pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(submission);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </>
        )}

        {/* User Actions (Delete) */}
        {!showAdminActions && onDelete && (
          <>
            <div className="flex space-x-2 pt-4 border-t border-gray-200">
              <a
                href={toolUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleLinkClick(e, toolUrl)}
                className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Tool
              </a>
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(submission);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(submission.id);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

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
