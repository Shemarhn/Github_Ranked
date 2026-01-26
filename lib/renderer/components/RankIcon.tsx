import React from 'react';

import type { Tier } from '../../ranking/types';

const DEFAULT_ICON_SIZE = 80;

export interface RankIconProps {
  tier: Tier;
  size?: number;
  style?: React.CSSProperties;
}

/**
 * Inline SVG icons for each tier.
 * These are embedded directly for Satori compatibility.
 */
function IronIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="iron-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#iron-grad)" opacity="0.2" />
      <polygon
        points="32 8 52 20 52 44 32 56 12 44 12 20"
        fill="url(#iron-grad)"
      />
      <circle cx="32" cy="32" r="8" fill="#5c5c5c" opacity="0.8" />
    </svg>
  );
}

function BronzeIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="bronze-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cd7f32" />
          <stop offset="100%" stopColor="#8b4513" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#bronze-grad)" opacity="0.2" />
      <polygon
        points="32 6 54 16 50 50 32 58 14 50 10 16"
        fill="url(#bronze-grad)"
      />
      <rect x="28" y="20" width="8" height="24" rx="2" fill="#d4a373" />
      <rect x="20" y="26" width="24" height="6" rx="2" fill="#d4a373" />
    </svg>
  );
}

function SilverIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="silver-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#808080" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#silver-grad)" opacity="0.2" />
      <polygon
        points="32 8 50 18 50 44 32 56 14 44 14 18"
        fill="url(#silver-grad)"
      />
      <polygon
        points="32 14 38 26 34 26 34 48 30 48 30 26 26 26"
        fill="#e8e8e8"
      />
    </svg>
  );
}

function GoldIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FDB931" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#gold-grad)" opacity="0.2" />
      <polygon
        points="14 34 20 18 32 26 44 18 50 34 44 50 20 50"
        fill="url(#gold-grad)"
      />
      <circle cx="32" cy="30" r="6" fill="#fff4b0" />
    </svg>
  );
}

function PlatinumIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="plat-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#0099cc" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#plat-grad)" opacity="0.2" />
      <polygon points="32 6 52 24 40 56 24 56 12 24" fill="url(#plat-grad)" />
      <polygon points="32 14 42 28 32 48 22 28" fill="#7fffff" opacity="0.9" />
    </svg>
  );
}

function EmeraldIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="emerald-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#50c878" />
          <stop offset="100%" stopColor="#228b22" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#emerald-grad)" opacity="0.2" />
      <polygon
        points="32 8 48 20 52 36 40 52 24 52 12 36 16 20"
        fill="url(#emerald-grad)"
      />
      <polygon
        points="32 16 40 26 36 42 28 42 24 26"
        fill="#90ee90"
        opacity="0.9"
      />
    </svg>
  );
}

function DiamondIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="diamond-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b9f2ff" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#diamond-grad)" opacity="0.2" />
      <polygon
        points="12 24 24 10 40 10 52 24 40 54 24 54"
        fill="url(#diamond-grad)"
      />
      <polygon points="24 10 32 24 40 10" fill="#e0ffff" />
      <polygon points="12 24 32 24 24 54" fill="#e0ffff" opacity="0.8" />
      <polygon points="52 24 32 24 40 54" fill="#e0ffff" opacity="0.8" />
    </svg>
  );
}

function MasterIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="master-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9b59b6" />
          <stop offset="100%" stopColor="#6a1b9a" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#master-grad)" opacity="0.2" />
      <circle cx="32" cy="32" r="20" fill="url(#master-grad)" />
      <polygon
        points="32 12 36 26 50 26 38 34 42 48 32 40 22 48 26 34 14 26 28 26"
        fill="#d4a5ff"
        opacity="0.9"
      />
    </svg>
  );
}

function GrandmasterIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="gm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e74c3c" />
          <stop offset="100%" stopColor="#c0392b" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#gm-grad)" opacity="0.2" />
      <path
        d="M32 8 C38 16 46 18 48 28 C50 40 42 52 32 56 C22 52 14 40 16 28 C18 18 26 16 32 8 Z"
        fill="url(#gm-grad)"
      />
      <path
        d="M32 18 C36 24 40 26 40 32 C40 38 36 44 32 46 C28 44 24 38 24 32 C24 26 28 24 32 18 Z"
        fill="#ff8a80"
        opacity="0.9"
      />
    </svg>
  );
}

function ChallengerIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'flex' }}
    >
      <defs>
        <linearGradient id="chall-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f39c12" />
          <stop offset="100%" stopColor="#e67e22" />
        </linearGradient>
        <linearGradient id="chall-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="50%" stopColor="#4ecdc4" />
          <stop offset="100%" stopColor="#f39c12" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#chall-grad)" opacity="0.2" />
      <polygon
        points="32 6 54 22 46 54 32 58 18 54 10 22"
        fill="url(#chall-grad)"
      />
      <polygon
        points="32 14 38 28 52 28 40 36 44 50 32 42 20 50 24 36 12 28 26 28"
        fill="url(#chall-accent)"
      />
    </svg>
  );
}

/**
 * Renders the appropriate tier icon as inline SVG for Satori compatibility.
 */
export function RankIcon({
  tier,
  size = DEFAULT_ICON_SIZE,
  style,
}: RankIconProps) {
  const renderIcon = () => {
    switch (tier) {
      case 'Iron':
        return <IronIcon size={size} />;
      case 'Bronze':
        return <BronzeIcon size={size} />;
      case 'Silver':
        return <SilverIcon size={size} />;
      case 'Gold':
        return <GoldIcon size={size} />;
      case 'Platinum':
        return <PlatinumIcon size={size} />;
      case 'Emerald':
        return <EmeraldIcon size={size} />;
      case 'Diamond':
        return <DiamondIcon size={size} />;
      case 'Master':
        return <MasterIcon size={size} />;
      case 'Grandmaster':
        return <GrandmasterIcon size={size} />;
      case 'Challenger':
        return <ChallengerIcon size={size} />;
      default:
        return <GoldIcon size={size} />;
    }
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {renderIcon()}
    </div>
  );
}
