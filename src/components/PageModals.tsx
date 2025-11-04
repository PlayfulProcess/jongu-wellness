'use client';

import { useState, useEffect, useCallback } from 'react';
import { DualAuth } from '@/components/DualAuth';
import { CollaborationModal } from '@/components/modals/CollaborationModal';
import { SubmitToolModal } from '@/components/modals/SubmitToolModal';
import { createClient } from '@/lib/supabase-client';

interface PageModalsProps {
  channelSlug?: string;
}

export function PageModals({ channelSlug = 'wellness' }: PageModalsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSubmitToolModal, setShowSubmitToolModal] = useState(false);
  const [, setUser] = useState<{ email?: string } | null>(null);

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
