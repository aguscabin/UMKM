import React from 'react';

// TikTok SVG Icon component
export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.4a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.84 1.55V6.85a4.83 4.83 0 0 1-1.07-.16z" />
  </svg>
);

// Helper to format social media handles or direct URLs
export function formatSocialUrl(value: string | undefined, platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook'): string {
  if (!value) return '#';
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanHandle = trimmed.replace(/^@/, '');

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'tiktok':
      return `https://tiktok.com/@${cleanHandle}`;
    case 'youtube':
      return `https://youtube.com/@${cleanHandle}`;
    case 'facebook':
      return `https://facebook.com/${cleanHandle}`;
    default:
      return '#';
  }
}
