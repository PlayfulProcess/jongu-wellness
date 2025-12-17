'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DualAuth } from '@/components/DualAuth';
import { CollaborationModal } from '@/components/modals/CollaborationModal';
import { SubmitToolModal } from '@/components/modals/SubmitToolModal';
import { createClient } from '@/lib/supabase-client';

interface PrefilledData {
  doc_id?: string | null;
  title?: string | null;
  description?: string | null;
  creator_name?: string | null;
  creator_link?: string | null;
  thumbnail_url?: string | null;
  hashtags?: string[];
}

interface PageModalsProps {
  channelSlug?: string;
}

export function PageModals({ channelSlug = 'wellness' }: PageModalsProps) {
  const searchParams = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSubmitToolModal, setShowSubmitToolModal] = useState(false);
  const [, setUser] = useState<{ email?: string } | null>(null);
  const [prefilledData, setPrefilledData] = useState<PrefilledData | null>(null);

  const checkUser = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }, []);

  useEffect(() => {
    checkUser();

    // Listen for auth modal events from SubmitToolModal
    const handleAuthModalEvent = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('openAuthModal', handleAuthModalEvent);

    return () => {
      window.removeEventListener('openAuthModal', handleAuthModalEvent);
    };
  }, [checkUser]);

  // Auto-open submit modal if doc_id is present in URL (from recursive-creator)
  useEffect(() => {
    const docId = searchParams?.get('doc_id');

    if (docId) {
      // Read all query params directly from URL
      const prefilled: PrefilledData = {
        doc_id: docId,
        title: searchParams?.get('title'),
        description: searchParams?.get('description'),
        creator_name: searchParams?.get('creator_name'),
        creator_link: searchParams?.get('creator_link'),
        thumbnail_url: searchParams?.get('thumbnail_url'),
        hashtags: searchParams?.get('hashtags')?.split(',').filter(Boolean) || [],
      };

      setPrefilledData(prefilled);
      setShowSubmitToolModal(true);
    }
  }, [searchParams]);

  return (
    <>
      <DualAuth
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <CollaborationModal
        isOpen={showCollabModal}
        onClose={() => setShowCollabModal(false)}
      />

      <SubmitToolModal
        isOpen={showSubmitToolModal}
        onClose={() => setShowSubmitToolModal(false)}
        channelSlug={channelSlug}
        prefilledData={prefilledData || undefined}
      />

      {/* Hidden trigger component to allow other components to open modals */}
      <ModalTriggers
        onAuthModal={() => setShowAuthModal(true)}
        onSubmitToolModal={() => setShowSubmitToolModal(true)}
      />
    </>
  );
}

// Component that provides functions to trigger modals
function ModalTriggers({
  onAuthModal,
  onSubmitToolModal
}: {
  onAuthModal: () => void;
  onSubmitToolModal: () => void;
}) {
  useEffect(() => {
    // Expose functions globally so CommunitySection can trigger them
    (window as any).__openSubmitToolModal = onSubmitToolModal;
    (window as any).__openAuthModal = onAuthModal;

    return () => {
      delete (window as any).__openSubmitToolModal;
      delete (window as any).__openAuthModal;
    };
  }, [onAuthModal, onSubmitToolModal]);

  return null;
}
