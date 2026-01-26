import React from 'react';

import type { AggregatedStats } from '../github/types';
import type { RankResult } from '../ranking/types';
import { MAX_STARS_CAP, TIER_COLORS } from '../ranking/constants';
import { RankIcon } from './components/RankIcon';
import { ProgressBar } from './components/ProgressBar';
import { RadarChart } from './components/RadarChart';
import { getTheme, type ThemeName } from './themes';

export interface RankCardProps {
  username: string;
  rank: RankResult;
  stats: AggregatedStats;
  theme?: ThemeName;
}

const CARD_WIDTH = 400;
const CARD_HEIGHT = 120;

/**
 * Main Rank Card component for SVG rendering.
 */
export function RankCard({
  username,
  rank,
  stats,
  theme = 'default',
}: RankCardProps) {
  const themeConfig = getTheme(theme);
  const tierColors = TIER_COLORS[rank.tier];
  const tierLabel = rank.division ? `${rank.tier} ${rank.division}` : rank.tier;
  const eloLabel = new Intl.NumberFormat('en-US').format(rank.elo);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 8,
        background: `linear-gradient(135deg, ${themeConfig.background.primary}, ${themeConfig.background.secondary})`,
        border: `1px solid ${themeConfig.background.border}`,
        color: themeConfig.text.primary,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <RankIcon tier={rank.tier} size={64} />

      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: tierColors.accent,
            display: 'flex',
          }}
        >
          {tierLabel}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, display: 'flex' }}>
          {`${eloLabel} SR`}
        </div>
        <ProgressBar tier={rank.tier} gp={rank.gp} width={200} />
        <div
          style={{
            fontSize: 12,
            color: themeConfig.text.muted,
            display: 'flex',
          }}
        >
          {username}
        </div>
      </div>

      <RadarChart
        size={48}
        tier={rank.tier}
        metrics={{
          prs: stats.totalMergedPRs,
          reviews: stats.totalCodeReviews,
          issues: stats.totalIssuesClosed,
          commits: stats.totalCommits,
          stars: Math.min(stats.totalStars, MAX_STARS_CAP),
        }}
      />
    </div>
  );
}

export default RankCard;
