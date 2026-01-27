import React from 'react';

import type { Tier } from '../../ranking/types';
import { TIER_COLORS } from '../../ranking/constants';

export interface ProgressBarProps {
  tier: Tier;
  gp: number;
  maxGp?: number;
  width?: number;
  height?: number;
  showText?: boolean;
  style?: React.CSSProperties;
}

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 8;
const DEFAULT_MAX_GP = 100;

/**
 * Renders a GP progress bar with tier-specific styling.
 *
 * @param tier - Rank tier for color styling.
 * @param gp - Current GP (0-99).
 * @param maxGp - Display max GP (default 100).
 * @param width - Bar width in pixels.
 * @param height - Bar height in pixels.
 * @param showText - Whether to render GP text.
 */
export function ProgressBar({
  tier,
  gp,
  maxGp = DEFAULT_MAX_GP,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  showText = true,
  style,
}: ProgressBarProps) {
  const colors = TIER_COLORS[tier];
  const clampedGp = Math.max(0, Math.min(gp, maxGp));
  const progressPercent = Math.max(0, Math.min(100, (clampedGp / maxGp) * 100));
  const progressWidth = Math.round((width * progressPercent) / 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        ...style,
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: height / 2,
          background: 'rgba(255, 255, 255, 0.12)',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: progressWidth,
            height: '100%',
            borderRadius: height / 2,
            background: colors.primary[0],
          }}
        />
      </div>
      {showText && (
        <span
          style={{
            fontSize: 10,
            color: colors.accent,
            display: 'flex',
          }}
        >
          {`${Math.round(clampedGp)} GP`}
        </span>
      )}
    </div>
  );
}
