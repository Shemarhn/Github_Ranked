import React from 'react';

import type { Tier } from '../../ranking/types';
import { TIER_COLORS } from '../../ranking/constants';

export interface RadarChartMetrics {
  prs: number;
  reviews: number;
  issues: number;
  commits: number;
  stars: number;
}

export interface RadarChartProps {
  metrics: RadarChartMetrics;
  tier?: Tier;
  size?: number;
}

const DEFAULT_SIZE = 48;

/**
 * Mini radar chart showing metric breakdown.
 * Simplified for Satori compatibility - no dynamic element generation.
 */
export function RadarChart({
  metrics,
  tier = 'Gold',
  size = DEFAULT_SIZE,
}: RadarChartProps) {
  const colors = TIER_COLORS[tier];

  // Calculate a simple "score" visualization
  const total = metrics.prs + metrics.reviews + metrics.issues + metrics.commits + metrics.stars;
  const maxExpected = 1000; // Rough max for visualization
  const fillPercent = Math.min(100, (total / maxExpected) * 100);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        border: `2px solid ${colors.accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: '50%',
          background: `${colors.primary[0]}88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: size * 0.25,
            fontWeight: 700,
            color: colors.accent,
          }}
        >
          {fillPercent > 50 ? '★' : '☆'}
        </span>
      </div>
    </div>
  );
}
