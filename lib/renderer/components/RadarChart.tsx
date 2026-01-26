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
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_SIZE = 48;
const POINTS = 5;

/**
 * Mini radar chart showing metric breakdown.
 */
export function RadarChart({
  metrics,
  tier = 'Gold',
  size = DEFAULT_SIZE,
  className,
  style,
}: RadarChartProps) {
  const values = [
    metrics.prs,
    metrics.reviews,
    metrics.issues,
    metrics.commits,
    metrics.stars,
  ];
  const maxValue = Math.max(1, ...values);
  const radius = size / 2 - 2;
  const center = size / 2;
  const angleStep = (Math.PI * 2) / POINTS;

  const points = values
    .map((value, index) => {
      const normalized = value / maxValue;
      const angle = -Math.PI / 2 + index * angleStep;
      const x = center + Math.cos(angle) * radius * normalized;
      const y = center + Math.sin(angle) * radius * normalized;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const axisPoints = Array.from({ length: POINTS }, (_, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return { x, y };
  });

  const colors = TIER_COLORS[tier];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={style}
      role="img"
      aria-label="Metric radar chart"
    >
      <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.12)" />
      {axisPoints.map((point, index) => (
        <line
          key={`axis-${index}`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke="rgba(255, 255, 255, 0.18)"
        />
      ))}
      <polygon
        points={points}
        fill={`${colors.primary[0]}66`}
        stroke={colors.accent}
        strokeWidth={1}
      />
    </svg>
  );
}
