'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  showAuthModal?: () => void;
}

export function Header({ showAuthModal }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-28">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/Jongulogo.png" 
                  alt="Jongu"
                  width={96}
                  height={96}
                  className="h-24 w-auto"
                />
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">BETA</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6 items-center">
              {/* Channels Dropdown */}
              <ChannelsDropdown />
              
              {/* Tools Dropdown */}
              <ToolsDropdown />
              
              <button 
                onClick={() => {
                  // First navigate to home page if not already there
                  if (window.location.pathname !== '/') {
                    window.location.href = '/#community-tools';
                    return;
                  }
                  // Scroll to the community tools section
                  const toolsSection = document.getElementById('community-tools');
                  if (toolsSection) {
                    toolsSection.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start'
                    });
                  }
                }}
                className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
              >
                Browse Tools
              </button>
              
              <Link
                href="/#community-tools"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Share Tool
              </Link>
              
              <Link 
                href="/#about" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                About
              </Link>
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
      url: "https://wellness.jongu.org",
      description: "Mental health & wellness tools",
      active: true
    },
    {
      name: "Parents",
      url: "https://parents.jongu.org", 
      description: "Parenting support & resources",
      comingSoon: true
    },
    {
      name: "Developers",
      url: "https://developers.jongu.org",
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

// Tools Dropdown Component  
function ToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const tools = [
    {
      name: "Best Possible Self",
      url: "https://jongu-best-possible-self.vercel.app",
      description: "Research-backed future visioning",
      icon: "🌟",
      featured: true
    },
    {
      name: "More Tools",
      url: "/#community-tools",
      description: "Browse community wellness tools",
      icon: "🔍",
      internal: true
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        Tools
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
            {tools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target={tool.internal ? undefined : "_blank"}
                rel={tool.internal ? undefined : "noopener noreferrer"}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  tool.featured ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tool.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {tool.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tool.description}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}