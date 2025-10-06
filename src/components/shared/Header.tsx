'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/lib/admin-utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  showAuthModal?: () => void;
}

export function Header({ showAuthModal }: HeaderProps) {
  const { user, signOut } = useAuth();

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
              <ChannelsDropdown />

              {/* Studies Dropdown */}
              <StudiesDropdown />

              {/* About Dropdown */}
              <AboutDropdown />
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
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
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Channels Dropdown Component
function ChannelsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const channels = [
    {
      name: "Wellness",
      url: "https://channels.recursive.eco/",
      description: "Mental health & wellness tools",
      active: true
    },
    {
      name: "Parents",
      url: "https://parents.recursive.eco", 
      description: "Parenting support & resources",
      comingSoon: true
    },
    {
      name: "Developers",
      url: "https://developers.recursive.eco",
      description: "Code with purpose",
      comingSoon: true
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        Channels
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {channels.map((channel) => (
              <a
                key={channel.name}
                href={channel.url}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  channel.active ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                } ${channel.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={channel.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {channel.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {channel.description}
                    </div>
                  </div>
                  {channel.comingSoon && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      Soon
                    </span>
                  )}
                </div>
              </a>
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

// About Dropdown Component
function AboutDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const aboutLinks = [
    {
      name: "About",
      url: "https://www.recursive.eco/pages/about.html",
      description: "Our story and mission"
    },
    {
      name: "Governance",
      url: "https://www.recursive.eco/pages/governance.html",
      description: "How we organize together"
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        About
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {aboutLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium text-gray-900">
                  {link.name}
                </div>
                <div className="text-xs text-gray-500">
                  {link.description}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}