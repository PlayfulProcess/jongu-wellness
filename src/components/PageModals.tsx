'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DualAuth } from '@/components/DualAuth';
import { CollaborationModal } from '@/components/modals/CollaborationModal';
import { SubmitToolModal } from '@/components/modals/SubmitToolModal';
import { createClient } from '@/lib/supabase-client';

interface PageModalsProps {
  channelSlug?: string;
}

export function PageModals({ channelSlug = 'wellness' }: PageModalsProps) {
  const searchParams = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showSubmitToolModal, setShowSubmitToolModal] = useState(false);
  const [, setUser] = useState<{ email?: string } | null>(null);
  const [prefillData, setPrefillData] = useState<any>(null);

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

  // Auto-open submit modal if doc_id is present in URL
  useEffect(() => {
    const docId = searchParams?.get('doc_id');
    const channel = searchParams?.get('channel');

    if (docId) {
      const fetchDocumentAndOpenModal = async () => {
        const supabase = createClient();
        try {
          const { data, error } = await supabase
            .from('user_documents')
            .select('*')
            .eq('id', docId)
            .single();

          if (error) {
            console.error('Error loading document:', error);
            return;
          }

          if (data) {
            // Pre-fill form data from document
            setPrefillData({
              name: data.document_data?.title || '',
              url: `https://recursive.eco/view/${docId}`,
              description: data.document_data?.description || '',
            });

            // Auto-open the modal
            setShowSubmitToolModal(true);
          }
        } catch (err) {
          console.error('Error fetching document:', err);
        }
      };

      fetchDocumentAndOpenModal();
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
        prefillData={prefillData}
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
