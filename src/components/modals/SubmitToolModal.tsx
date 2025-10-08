'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';

interface SubmitToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelSlug?: string;
}

export function SubmitToolModal({ isOpen, onClose, channelSlug = 'wellness' }: SubmitToolModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    submitted_by: '',
    creator_link: ''
  });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#+/, ''); // Remove leading # if present
    if (tag && !hashtags.includes(tag) && hashtags.length < 5) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    } else if (e.key === 'Backspace' && !hashtagInput && hashtags.length > 0) {
      removeHashtag(hashtags[hashtags.length - 1]);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) newErrors.name = 'Title is required';
    if (!formData.url.trim()) newErrors.url = 'URL is required';
    if (hashtags.length === 0) newErrors.hashtags = 'At least one hashtag is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.submitted_by.trim()) newErrors.submitted_by = 'Your name is required';
    
    // URL validation
    if (formData.url) {
      let urlToTest = formData.url.trim();
      
      // Auto-add https:// if no protocol is provided
      if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
        urlToTest = 'https://' + urlToTest;
      }
      
      try {
        new URL(urlToTest);
        // URL is valid, but make sure original has protocol
        if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
          newErrors.url = 'Please include http:// or https:// in your URL';
        }
      } catch {
        newErrors.url = 'Please provide a valid URL (e.g., https://example.com)';
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

    // Optional image validation
    if (selectedImage) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(selectedImage.type)) {
        newErrors.image = 'Please select a valid image file (JPG, PNG, GIF, or WebP)';
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedImage.size > maxSize) {
        newErrors.image = 'Image file size must be less than 5MB';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      let thumbnail_url = null;
      
      // Upload image to Supabase Storage if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(fileName, selectedImage);
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
        }
        
        // Get public URL - using the correct syntax from the reference
        const { data } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(fileName);
        
        thumbnail_url = data.publicUrl;
      }
      
      // Submit tool with thumbnail_url, hashtags as array, and channel_slug
      const response = await fetch('/api/community/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.name,
          claude_url: formData.url,
          category: hashtags, // Send as array
          description: formData.description,
          creator_name: formData.submitted_by,
          creator_link: formData.creator_link,
          thumbnail_url,
          channel_slug: channelSlug
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to submit tool');
      }
      
      const result = await response.json();
      console.log('Tool submitted successfully:', result);
      
      // Reset form and close modal
      setFormData({
        name: '',
        url: '',
        description: '',
        submitted_by: '',
        creator_link: ''
      });
      setHashtags([]);
      setHashtagInput('');
      setSelectedImage(null);
      setErrors({});
      
      alert('🎉 Submitted successfully! We\'ll review it and add it to the channel soon.');
      onClose();
      
    } catch (error: unknown) {
      console.error('Error submitting tool:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to submit: ${errorMessage}`);
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
            <h2 className="text-2xl font-bold text-gray-900">Submit Content</h2>
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
                  You need to be signed in to submit content.
                  This helps us maintain quality and prevents spam.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    // Trigger sign in modal
                    window.dispatchEvent(new CustomEvent('openAuthModal'));
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign In to Submit
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
                Title *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mindful Breathing Exercise"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-tool-url.com"
              />
              {errors.url && <p className="text-red-600 text-sm mt-1">{errors.url}</p>}
            </div>

            {/* Tool Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload an image file (JPG, PNG, GIF, or WebP, max 5MB). This will appear as a thumbnail for your tool.
              </p>
              {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags * <span className="text-gray-500 text-xs">(1-5 tags)</span>
              </label>
              <div className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                {/* Display hashtag chips */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {/* Input for new hashtags */}
                {hashtags.length < 5 && (
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyDown}
                    onBlur={addHashtag}
                    className="w-full outline-none text-gray-900"
                    placeholder={hashtags.length === 0 ? "Type hashtags and press Enter, Space, or Comma" : "Add another..."}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Examples: mindfulness, anxiety, gratitude, self-care, journaling
              </p>
              {errors.hashtags && <p className="text-red-600 text-sm mt-1">{errors.hashtags}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description * <span className="text-gray-500 text-xs">(max 300 characters)</span>
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 300) {
                      setFormData({ ...formData, description: value });
                    }
                  }}
                  maxLength={300}
                  rows={4}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what your tool does and how it helps people..."
                />
                <div className={`absolute bottom-2 right-3 text-xs ${
                  formData.description.length > 270 ? 'text-red-600' : 
                  formData.description.length > 240 ? 'text-yellow-600' : 'text-gray-400'
                }`}>
                  {formData.description.length}/300
                </div>
              </div>
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
                  value={formData.submitted_by}
                  onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name or professional title"
                />
                {errors.submitted_by && <p className="text-red-600 text-sm mt-1">{errors.submitted_by}</p>}
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
                <p className="text-xs text-gray-500 mt-1">
                  Your name will become a clickable link to this website
                </p>
                {errors.creator_link && <p className="text-red-600 text-sm mt-1">{errors.creator_link}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? '⏳ Submitting...' : '🌱 Submit'}
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