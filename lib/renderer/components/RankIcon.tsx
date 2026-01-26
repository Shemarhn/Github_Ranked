import React from 'react';

import type { Tier } from '../../ranking/types';
import { TIER_COLORS } from '../../ranking/constants';

const DEFAULT_ICON_SIZE = 64;

export interface RankIconProps {
  tier: Tier;
  size?: number;
  style?: React.CSSProperties;
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
      return 'C';
    default:
      return '?';
  }
}

/**
 * Renders an inline tier icon for Satori SVG rendering.
 * Uses a simple colored circle with tier initial for Edge Runtime compatibility.
 */
export function RankIcon({
  tier,
  size = DEFAULT_ICON_SIZE,
  style,
}: RankIconProps) {
  const colors = TIER_COLORS[tier];
  const primaryColor = colors.primary[0];
  const accentColor = colors.accent;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: primaryColor,
        border: `3px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: size * 0.4,
          fontWeight: 700,
          color: accentColor,
        }}
      >
        {getTierInitial(tier)}
      </span>
    </div>
  );
}
