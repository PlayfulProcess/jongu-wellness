'use client';

import { createClient } from '@/lib/supabase-client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({ isOpen, onClose, title = "Welcome to Jongu Wellness", subtitle = "Sign in with your email and password" }: AuthModalProps) {
  const supabase = createClient();

  // Close modal on successful auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onClose();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        {/* Content */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>

        {/* Auth Form */}
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: {
                background: '#2563eb',
                borderColor: '#2563eb',
                color: '#ffffff',
              },
              anchor: {
                color: '#2563eb',
              },
              label: {
                color: '#374151',
              },
              message: {
                color: '#374151',
              },
            }
          }}
          providers={[]}
          redirectTo={typeof window !== 'undefined' ? 
            `${window.location.protocol}//${window.location.host}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`
            : undefined}
          onlyThirdPartyProviders={false}
          showLinks={false}
          view="sign_in"
        />
      </div>
    </div>
  );
}