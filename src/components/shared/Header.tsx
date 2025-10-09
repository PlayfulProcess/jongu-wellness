'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/lib/admin-utils';
import { ChannelConfig } from '@/lib/loadChannel';

interface HeaderProps {
  channels?: ChannelConfig[];
  currentChannelSlug?: string;
}

export function Header({ channels = [], currentChannelSlug = 'wellness' }: HeaderProps) {
  const showAuthModal = () => {
    if ((window as any).__openAuthModal) {
      (window as any).__openAuthModal();
    }
  };
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="https://www.recursive.eco/" className="flex items-center space-x-2">
              <Image 
                src="/recursive-logo-1756153260128.png" 
                alt="Recursive.eco"
                width={60}
                height={60}
                className="h-12 w-auto"
                style={{ transform: 'rotate(200deg)' }}
              />
            </Link>
            
            <nav className="hidden md:flex space-x-6 items-center">
              {/* Channels Dropdown */}
              <ChannelsDropdown channels={channels} currentChannelSlug={currentChannelSlug} />

              {/* Courses Link */}
              <CoursesLink />

              {/* Studies Link */}
              <StudiesDropdown />

              {/* About Link */}
              <AboutDropdown />
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Dashboard
                </Link>
                {isAdmin(user.email || '') && (
                  <Link
                    href="/admin"
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={showAuthModal}
                className="hidden sm:inline-block text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-1">
              {/* Channels Section */}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Channels
              </div>
              {channels.map((channel) => (
                <Link
                  key={channel.slug}
                  href={channel.slug === 'wellness' ? '/' : `/channels/${channel.slug}`}
                  className={`block pl-6 pr-3 py-2 rounded-md text-base font-medium hover:bg-gray-50 ${
                    channel.slug === currentChannelSlug
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {channel.name}
                </Link>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>
              <a
                href="https://www.recursive.eco/pages/courses/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Courses
              </a>
              <a
                href="https://www.recursive.eco/pages/studies.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Studies
              </a>
              <a
                href="https://www.recursive.eco/pages/about.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                About
              </a>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  {isAdmin(user.email || '') && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-orange-600 hover:text-orange-800 hover:bg-gray-50"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    showAuthModal?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Channels Dropdown Component
function ChannelsDropdown({ channels, currentChannelSlug }: { channels: ChannelConfig[], currentChannelSlug: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (channels.length === 0) {
    return null; // Don't show if no channels
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        Channels
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {channels.map((channel) => (
              <Link
                key={channel.slug}
                href={channel.slug === 'wellness' ? '/' : `/channels/${channel.slug}`}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  channel.slug === currentChannelSlug ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${
                      channel.slug === currentChannelSlug ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {channel.name}
                    </div>
                  </div>
                  {channel.slug === currentChannelSlug && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Studies Dropdown Component
function StudiesDropdown() {
  return (
    <a
      href="https://www.recursive.eco/pages/studies.html"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
    >
      Studies
    </a>
  );
}

// Courses Link Component
function CoursesLink() {
  return (
    <a
      href="https://www.recursive.eco/pages/courses/index.html"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
    >
      Courses
    </a>
  );
}

// About Link Component
function AboutDropdown() {
  return (
    <a
      href="https://www.recursive.eco/pages/about.html"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
    >
      About
    </a>
  );
}