import React from 'react';

import type { AggregatedStats } from '../github/types';
import type { RankResult } from '../ranking/types';
import { TIER_COLORS } from '../ranking/constants';
import { RankIcon } from './components/RankIcon';
import { ProgressBar } from './components/ProgressBar';
import { getTheme, type ThemeName } from './themes';

export interface RankCardProps {
  username: string;
  rank: RankResult;
  stats: AggregatedStats;
  theme?: ThemeName;
  season?: number | 'all';
}

const CARD_WIDTH = 495;
const CARD_HEIGHT = 170;

/**
 * Main Rank Card component for SVG rendering.
 * Gaming-inspired design with gradient backgrounds and glowing accents.
 */
export function RankCard({
  username,
  rank,
  stats,
  theme = 'default',
  season,
}: RankCardProps) {
  const themeConfig = getTheme(theme);
  const tierColors = TIER_COLORS[rank.tier];
  const tierLabel = rank.division ? `${rank.tier} ${rank.division}` : rank.tier;
  const eloLabel = new Intl.NumberFormat('en-US').format(rank.elo);

  // Determine season label
  const currentYear = new Date().getUTCFullYear();
  const seasonLabel =
    season && season !== 'all' ? `S${season}` : `S${currentYear}`;

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${themeConfig.background.primary} 0%, ${themeConfig.background.secondary} 50%, ${themeConfig.background.primary} 100%)`,
        border: `1px solid ${themeConfig.background.border}`,
        color: themeConfig.text.primary,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with username */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: themeConfig.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
            }}
          >
            {'GitHub Ranked'}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: tierColors.primary[0],
              backgroundColor: `${tierColors.primary[0]}20`,
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
            }}
          >
            {seasonLabel}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: themeConfig.text.primary,
              display: 'flex',
            }}
          >
            {`@${username}`}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flex: 1,
        }}
      >
        {/* Rank Icon */}
        <RankIcon tier={rank.tier} size={80} />

        {/* Rank info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
          }}
        >
          {/* Tier label */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: tierColors.accent,
              display: 'flex',
              textTransform: 'uppercase',
            }}
          >
            {tierLabel}
          </div>

          {/* Rating */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: themeConfig.text.primary,
                display: 'flex',
              }}
            >
              {eloLabel}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: themeConfig.text.secondary,
                display: 'flex',
              }}
            >
              {'Rating'}
            </span>
          </div>

          {/* Progress bar */}
          <ProgressBar tier={rank.tier} gp={rank.gp} width={220} height={6} />
        </div>

        {/* Stats panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 12,
            borderRadius: 10,
            background: `${themeConfig.background.secondary}80`,
            border: `1px solid ${themeConfig.background.border}40`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: themeConfig.text.secondary,
                width: 50,
                display: 'flex',
              }}
            >
              {'PRs'}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#58a6ff',
                display: 'flex',
              }}
            >
              {stats.totalMergedPRs.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: themeConfig.text.secondary,
                width: 50,
                display: 'flex',
              }}
            >
              {'Reviews'}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#a371f7',
                display: 'flex',
              }}
            >
              {stats.totalCodeReviews.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: themeConfig.text.secondary,
                width: 50,
                display: 'flex',
              }}
            >
              {'Commits'}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#3fb950',
                display: 'flex',
              }}
            >
              {stats.totalCommits.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: themeConfig.text.secondary,
                width: 50,
                display: 'flex',
              }}
            >
              {'Stars'}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#f0883e',
                display: 'flex',
              }}
            >
              {stats.totalStars.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RankCard;
