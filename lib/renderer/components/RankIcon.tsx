import React from 'react';

import type { Tier } from '../../ranking/types';
import { TIER_COLORS } from '../../ranking/constants';

const DEFAULT_ICON_SIZE = 64;

export interface RankIconProps {
  tier: Tier;
  size?: number;
  style?: React.CSSProperties;
}

/**
 * Renders an inline tier icon for Satori SVG rendering.
 * Uses colored shapes instead of external images for Edge Runtime compatibility.
 */
export function RankIcon({ tier, size = DEFAULT_ICON_SIZE, style }: RankIconProps) {
  const colors = TIER_COLORS[tier];
  const primaryColor = colors.primary[0];
  const accentColor = colors.accent;

  // Create a stylized badge shape
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${primaryColor}, ${colors.primary[1]})`,
          boxShadow: `0 0 ${size / 8}px ${accentColor}40`,
        }}
      />
      {/* Inner circle */}
      <div
        style={{
          position: 'absolute',
          width: size * 0.75,
          height: size * 0.75,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors.primary[1]}, ${primaryColor})`,
          border: `2px solid ${accentColor}`,
        }}
      />
      {/* Tier initial */}
      <span
        style={{
          position: 'relative',
          fontSize: size * 0.35,
          fontWeight: 700,
          color: accentColor,
          textShadow: `0 1px 2px rgba(0,0,0,0.5)`,
          zIndex: 1,
        }}
      >
        {getTierInitial(tier)}
      </span>
    </div>
  );
}

function getTierInitial(tier: Tier): string {
  switch (tier) {
    case 'Iron':
      return 'I';
    case 'Bronze':
      return 'B';
    case 'Silver':
      return 'S';
    case 'Gold':
      return 'G';
    case 'Platinum':
      return 'P';
    case 'Emerald':
      return 'E';
    case 'Diamond':
      return 'D';
    case 'Master':
      return 'M';
    case 'Grandmaster':
      return 'GM';
    case 'Challenger':
      return '👑';
    default:
      return '?';
  }
}
