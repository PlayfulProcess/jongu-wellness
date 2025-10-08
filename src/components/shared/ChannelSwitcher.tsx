'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChannelConfig } from '@/lib/loadChannel';

interface ChannelSwitcherProps {
  channels: ChannelConfig[];
  currentSlug?: string;
}

export function ChannelSwitcher({ channels, currentSlug = 'wellness' }: ChannelSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (channels.length <= 1) {
    // Don't show switcher if there's only one channel
    return null;
  }

  const currentChannel = channels.find(c => c.slug === currentSlug) || channels[0];

  return (
    <div className="relative">
      {/* Desktop Dropdown */}
      <div className="hidden md:block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-700">{currentChannel.name}</span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] z-20">
              {channels.map(channel => (
                <Link
                  key={channel.slug}
                  href={channel.slug === 'wellness' ? '/' : `/channels/${channel.slug}`}
                  className={`block px-4 py-2 hover:bg-gray-50 transition-colors ${
                    channel.slug === currentSlug ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span>{channel.name}</span>
                    {channel.slug === currentSlug && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

      {/* Mobile - shown in mobile menu instead */}
    </div>
  );
}
