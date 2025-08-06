'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';

interface SubmitToolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitToolModal({ isOpen, onClose }: SubmitToolModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    claude_url: '',
    category: '',
    description: '',
    creator_name: '',
    creator_link: '',
    creator_background: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const supabase = createClient();

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen) {
      checkUser();
    }
  }, [isOpen, checkUser]);

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

  const categories = [
    { value: 'mindfulness', label: '🧘 Mindfulness & Creativity' },
    { value: 'distress-tolerance', label: '🛡️ Distress Tolerance' },
    { value: 'emotion-regulation', label: '❤️ Emotion Regulation' },
    { value: 'interpersonal-effectiveness', label: '🤝 Interpersonal Effectiveness' }
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.claude_url.trim()) newErrors.claude_url = 'Tool URL is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.creator_name.trim()) newErrors.creator_name = 'Creator name is required';
    
    // Check for reserved "Jongu" name
    const checkJonguName = (text: string) => text.toLowerCase().includes('jongu');
    if (checkJonguName(formData.title)) {
      newErrors.title = '🛡️ "Jongu" is reserved for official platform tools. Please choose a different name.';
    }
    if (checkJonguName(formData.creator_name)) {
      newErrors.creator_name = '🛡️ "Jongu" is reserved for official platform tools. Please choose a different creator name.';
    }
    if (checkJonguName(formData.description)) {
      newErrors.description = '🛡️ "Jongu" is reserved for official platform tools. Please use different wording.';
    }
    
    // URL validation (allow any valid URL format)
    if (formData.claude_url) {
      let urlToTest = formData.claude_url.trim();
      
      // Auto-add https:// if no protocol is provided
      if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
        urlToTest = 'https://' + urlToTest;
      }
      
      try {
        new URL(urlToTest);
        // URL is valid, but make sure original has protocol
        if (!formData.claude_url.startsWith('http://') && !formData.claude_url.startsWith('https://')) {
          newErrors.claude_url = 'Please include http:// or https:// in your URL';
        }
      } catch {
        newErrors.claude_url = 'Please provide a valid URL (e.g., https://example.com)';
      }
    }
    
    // Optional creator link validation
    if (formData.creator_link && formData.creator_link.trim()) {
      let linkToTest = formData.creator_link.trim();
      
      // Auto-add https:// if no protocol is provided
      if (!linkToTest.startsWith('http://') && !linkToTest.startsWith('https://')) {
        linkToTest = 'https://' + linkToTest;
      }
      
      try {
        new URL(linkToTest);
        // URL is valid, but make sure original has protocol
        if (!formData.creator_link.startsWith('http://') && !formData.creator_link.startsWith('https://')) {
          newErrors.creator_link = 'Please include http:// or https:// in your website link';
        }
      } catch {
        newErrors.creator_link = 'Please provide a valid website URL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      let thumbnailUrl = '';
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const uploadedUrl = await handleImageUpload(thumbnailFile);
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }
      
      // Submit tool
      const response = await fetch('/api/community/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          thumbnail_url: thumbnailUrl
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit tool');
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        claude_url: '',
        category: '',
        description: '',
        creator_name: '',
        creator_link: '',
        creator_background: ''
      });
      setThumbnailFile(null);
      setErrors({});
      
      alert('🎉 Tool submitted successfully! We\'ll review it and add it to the community garden soon.');
      onClose();
      
    } catch (error: unknown) {
      console.error('Error submitting tool:', error);
      
      // Show specific error message if it's about Jongu name protection
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Jongu') || errorMessage.includes('reserved')) {
        alert('🛡️ The name &quot;Jongu&quot; is reserved for official platform tools.\n\nOnly Jongu administrators can create tools with &quot;Jongu&quot; branding.\n\nPlease choose a different name for your community tool.');
      } else {
        alert(`❌ Failed to submit tool: ${errorMessage}`);
      }
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
            <h2 className="text-2xl font-bold text-gray-900">Share a Tool</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h3>
                <p className="text-gray-600 mb-6">
                  You need to be signed in to submit tools to our community garden.
                  This helps us maintain quality and prevents spam.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    // Trigger sign in modal - you'll need to implement this
                    window.dispatchEvent(new CustomEvent('openAuthModal'));
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign In to Submit Tool
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mindful Breathing Exercise"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Tool URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool URL *
              </label>
              <input
                type="text"
                value={formData.claude_url}
                onChange={(e) => setFormData({ ...formData, claude_url: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-tool-url.com"
              />
              {errors.claude_url && <p className="text-red-600 text-sm mt-1">{errors.claude_url}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what your tool does and how it helps people..."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Creator Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Creator Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.creator_name}
                  onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name or professional title"
                />
                {errors.creator_name && <p className="text-red-600 text-sm mt-1">{errors.creator_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Website/Link (optional)
                </label>
                <input
                  type="text"
                  value={formData.creator_link}
                  onChange={(e) => setFormData({ ...formData, creator_link: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
                {errors.creator_link && <p className="text-red-600 text-sm mt-1">{errors.creator_link}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Background (optional)
                </label>
                <textarea
                  value={formData.creator_background}
                  onChange={(e) => setFormData({ ...formData, creator_background: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your expertise or background..."
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload an image to represent your tool (PNG, JPG, or GIF). Recommended size: 400x300px or 4:3 aspect ratio for best display.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? '⏳ Submitting...' : '🌱 Submit Tool'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}