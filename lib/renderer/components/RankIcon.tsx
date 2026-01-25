import React from 'react';

import type { Tier } from '../../ranking/types';

const ICON_FILE_BY_TIER: Record<Tier, string> = {
  Iron: 'iron',
  Bronze: 'bronze',
  Silver: 'silver',
  Gold: 'gold',
  Platinum: 'platinum',
  Emerald: 'emerald',
  Diamond: 'diamond',
  Master: 'master',
  Grandmaster: 'grandmaster',
  Challenger: 'challenger',
};

const DEFAULT_ICON_SIZE = 64;

export interface RankIconProps {
  tier: Tier;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  fallbackTier?: Tier;
}

/**
 * Renders the tier icon for a given rank tier.
 *
 * @param tier - Rank tier to render.
 * @param size - Icon size (square). Defaults to 64.
 * @param className - Optional CSS class.
 * @param style - Optional inline styles.
 * @param title - Optional tooltip/title.
 * @param fallbackTier - Fallback tier icon when the image fails to load.
 */
export function RankIcon({
  tier,
  size = DEFAULT_ICON_SIZE,
  className,
  style,
  title,
  fallbackTier = 'Iron',
}: RankIconProps) {
  const iconFile = ICON_FILE_BY_TIER[tier] ?? ICON_FILE_BY_TIER[fallbackTier];
  const fallbackFile = ICON_FILE_BY_TIER[fallbackTier];
  const src = `/icons/${iconFile}.svg`;
  const fallbackSrc = `/icons/${fallbackFile}.svg`;
  const ariaLabel = `${tier} tier icon`;

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={ariaLabel}
      title={title ?? ariaLabel}
      className={className}
      style={style}
      data-tier={tier}
      onError={(event) => {
        if (event.currentTarget.src !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
          event.currentTarget.alt = `${fallbackTier} tier icon`;
        }
      }}
    />
  );
}
