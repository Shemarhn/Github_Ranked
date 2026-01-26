import React from 'react';

import type { Tier } from '../../ranking/types';
import { TIER_COLORS } from '../../ranking/constants';

const DEFAULT_ICON_SIZE = 72;

export interface RankIconProps {
  tier: Tier;
  size?: number;
  style?: React.CSSProperties;
}

function getTierSymbol(tier: Tier): string {
  switch (tier) {
    case 'Iron':
      return '⚒';
    case 'Bronze':
      return '🛡';
    case 'Silver':
      return '⚔';
    case 'Gold':
      return '👑';
    case 'Platinum':
      return '💎';
    case 'Emerald':
      return '🔮';
    case 'Diamond':
      return '💠';
    case 'Master':
      return '🏆';
    case 'Grandmaster':
      return '⭐';
    case 'Challenger':
      return '🔥';
    default:
      return '?';
  }
}

/**
 * Renders a stylish tier badge icon for Satori SVG rendering.
 * Features a circular badge with glow effect.
 */
export function RankIcon({
  tier,
  size = DEFAULT_ICON_SIZE,
  style,
}: RankIconProps) {
  const colors = TIER_COLORS[tier];
  const primaryColor = colors.primary[0];
  const secondaryColor = colors.primary[1];
  const accentColor = colors.accent;

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
      {/* Outer glow ring */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(145deg, ${primaryColor}, ${secondaryColor})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner dark circle */}
        <div
          style={{
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #1a1a2e, #0f0f1a)',
            border: `2px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Symbol */}
          <span
            style={{
              fontSize: size * 0.38,
              display: 'flex',
            }}
          >
            {getTierSymbol(tier)}
          </span>
        </div>
      </div>
    </div>
  );
}
