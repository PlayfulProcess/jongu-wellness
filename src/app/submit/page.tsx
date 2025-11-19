'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

function SubmitPageContent() {
  const { user, status } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get doc_id from query params (new approach)
  const docId = searchParams.get('doc_id');
  const prefillChannel = searchParams.get('channel') || 'wellness';

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    submitted_by: '',
    creator_link: ''
  });
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch document from Supabase if doc_id provided
  useEffect(() => {
    const fetchDocument = async () => {
      if (!docId) return;

      setLoadingDoc(true);
      try {
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('id', docId)
          .single();

        if (error) {
          console.error('Error loading project:', error);
          setErrors({ submit: 'Failed to load document details' });
          return;
        }

        if (data) {
          // Pre-fill form with document data
          setFormData({
            name: data.document_data?.title || '',
            url: `https://recursive.eco/view/${docId}`,
            description: data.document_data?.description || '',
            submitted_by: '',
            creator_link: ''
          });
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setErrors({ submit: 'Failed to load document details' });
      } finally {
        setLoadingDoc(false);
      }
    };

    fetchDocument();
  }, [docId, supabase]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/dashboard'; // Will show auth modal
    }
  }, [status]);

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#+/, '');
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setIsSubmitting(true);

    try {
      // Insert into tools table
      const { error } = await supabase
        .from('tools')
        .insert({
          name: formData.name,
          url: formData.url,
          category: hashtags,
          description: formData.description,
          submitted_by: formData.submitted_by,
          creator_link: formData.creator_link || null,
          thumbnail_url: null, // TODO: Handle image upload if needed
          approved: false,
          reviewed: false,
          active: true,
          user_id: user.id
        });

      if (error) throw error;

      setSubmitSuccess(true);

      // Reset form
      setFormData({
        name: '',
        url: '',
        description: '',
        submitted_by: '',
        creator_link: ''
      });
      setHashtags([]);
    } catch (error: any) {
      console.error('Error submitting tool:', error);
      setErrors({ submit: error.message || 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    );
  }

  if (loadingDoc) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading document details...</p>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Submission Received!
            </h1>
            <p className="text-gray-300 mb-6">
              Thank you for submitting to the community! Your submission will be reviewed and, if approved,
              will appear in the {prefillChannel} channel.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
              >
                Back to Home
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600"
              >
                View My Submissions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Submit to Community
          </h1>
          <p className="text-gray-400 mb-8">
            Share a resource with the {prefillChannel} channel
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com"
              />
              {errors.url && <p className="mt-1 text-sm text-red-400">{errors.url}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="My Amazing Resource"
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us about this resource..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hashtags (max 5) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-purple-900/50 text-purple-300 border border-purple-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="ml-2 text-purple-400 hover:text-purple-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                disabled={hashtags.length >= 5}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-800 disabled:opacity-50"
                placeholder="Type hashtag and press Enter, comma, or space"
              />
              {errors.hashtags && <p className="mt-1 text-sm text-red-400">{errors.hashtags}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Add tags to help people find this resource (e.g., meditation, journaling, kids)
              </p>
            </div>

            {/* Submitted By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.submitted_by}
                onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your name or username"
              />
              {errors.submitted_by && <p className="mt-1 text-sm text-red-400">{errors.submitted_by}</p>}
            </div>

            {/* Creator Link (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Creator/Source Link (optional)
              </label>
              <input
                type="url"
                value={formData.creator_link}
                onChange={(e) => setFormData({ ...formData, creator_link: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://creator-website.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Link to the creator&apos;s website or social media
              </p>
            </div>

            {errors.submit && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-300">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>}>
      <SubmitPageContent />
    </Suspense>
  );
}
