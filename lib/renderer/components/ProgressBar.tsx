import React from 'react';

import type { Tier } from '../../ranking/types';
import { TIER_COLORS } from '../../ranking/constants';

export interface ProgressBarProps {
  tier: Tier;
  lp: number;
  maxLp?: number;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 8;
const DEFAULT_MAX_LP = 100;

/**
 * Renders a LP progress bar with tier-specific styling.
 *
 * @param tier - Rank tier for color styling.
 * @param lp - Current LP (0-99).
 * @param maxLp - Display max LP (default 100).
 * @param width - Bar width in pixels.
 * @param height - Bar height in pixels.
 * @param showText - Whether to render LP text.
 */
export function ProgressBar({
  tier,
  lp,
  maxLp = DEFAULT_MAX_LP,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  showText = true,
  className,
  style,
}: ProgressBarProps) {
  const colors = TIER_COLORS[tier];
  const clampedLp = Math.max(0, Math.min(lp, maxLp));
  const progressPercent = Math.max(0, Math.min(100, (clampedLp / maxLp) * 100));

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        ...style,
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: height / 2,
          background: 'rgba(255, 255, 255, 0.12)',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)',
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${colors.primary[0]}, ${colors.primary[1]})`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {showText ? (
        <span
          style={{
            fontSize: 12,
            color: colors.accent,
            letterSpacing: '0.04em',
          }}
        >
          {Math.round(clampedLp)}/{maxLp} LP
        </span>
      ) : null}
    </div>
  );
}
