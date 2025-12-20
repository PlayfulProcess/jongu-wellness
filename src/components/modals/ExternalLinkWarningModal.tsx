'use client';

interface ExternalLinkWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  url: string;
}

export function ExternalLinkWarningModal({
  isOpen,
  onClose,
  onContinue,
  url
}: ExternalLinkWarningModalProps) {
  if (!isOpen) return null;

  const handleContinue = () => {
    onContinue();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
          Leaving Recursive.eco
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 text-center">
          You are about to visit an external website. Please review the URL before continuing:
        </p>

        {/* URL Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 break-all">
          <p className="text-sm text-gray-700 font-mono">
            {url}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
