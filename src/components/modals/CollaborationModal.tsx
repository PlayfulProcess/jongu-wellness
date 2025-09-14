'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationModal({ isOpen, onClose }: CollaborationModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    expertise: '',
    collaboration_type: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const checkUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen) {
      checkUser();
    }
  }, [isOpen, checkUser]);

  const collaborationTypes = [
    { value: 'create-tools', label: '🛠️ Create Tools Together' },
    { value: 'research', label: '📊 Research Partnership' },
    { value: 'funding', label: '💰 Funding Opportunity' },
    { value: 'content', label: '✍️ Content Collaboration' },
    { value: 'promotion', label: '📢 Cross-Promotion' },
    { value: 'other', label: '💡 Other Ideas' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/community/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.status === 401) {
        // User is not authenticated - show auth modal
        onClose();
        window.dispatchEvent(new CustomEvent('openAuthModal'));
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to submit collaboration request');
      }

      alert(
        `🎉 Thank you for your interest in collaborating!\n\n` +
        `We'll be in touch soon. You can also reach us directly at:\n` +
        `pp@playfulprocess.com\n\n` +
        `Your inquiry details have been saved.`
      );

      // Reset form
      setFormData({
        name: '',
        email: '',
        organization: '',
        expertise: '',
        collaboration_type: '',
        message: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      alert(`❌ Failed to submit request: ${error instanceof Error ? error.message : 'Unknown error'}. Please email us directly at pp@playfulprocess.com`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Collaborate with Us</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h3>
                <p className="text-gray-600 mb-6">
                  You need to be signed in to submit collaboration requests.
                  This helps us maintain quality and prevents spam.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('openAuthModal'));
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Sign In to Submit Collaboration
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  💚 Building Gateways, Not Gatekeepers
                </h3>
                <p className="text-green-700 text-sm">
                  We believe in open collaboration and community-driven wellness. Whether you&apos;re a therapist, 
                  coach, researcher, or just someone passionate about mental health tools, we&apos;d love to work together!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization/Company (optional)
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your organization, practice, or company"
              />
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Expertise/Background *
              </label>
              <textarea
                required
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tell us about your background, expertise, or what you bring to the table..."
              />
            </div>

            {/* Collaboration Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Collaboration *
              </label>
              <select
                required
                value={formData.collaboration_type}
                onChange={(e) => setFormData({ ...formData, collaboration_type: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select collaboration type</option>
                {collaborationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message *
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tell us about your collaboration idea, what you'd like to work on together, or any questions you have..."
              />
            </div>

            {/* Ideas Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Collaboration Ideas</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Co-create tools and exercises</li>
                <li>• Research partnerships on tool effectiveness</li>
                <li>• Guest content and cross-promotion</li>
                <li>• Workshop and training collaborations</li>
                <li>• Integration with existing platforms</li>
                <li>• Community building initiatives</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? '⏳ Sending...' : '🤝 Start Collaboration'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            {/* Contact Info */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
              <p>You can also reach us directly at:</p>
              <a href="mailto:pp@playfulprocess.com" className="text-green-600 hover:text-green-700 font-medium">
                pp@playfulprocess.com
              </a>
            </div>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  );
}