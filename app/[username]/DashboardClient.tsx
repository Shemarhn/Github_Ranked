'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ExtendedAggregatedStats } from '@/lib/github/types';
import type { RankResult } from '@/lib/ranking/types';
import {
  METRIC_WEIGHTS,
  MAX_STARS_CAP,
  TIER_COLORS,
} from '@/lib/ranking/constants';
import styles from './dashboard.module.css';

interface DashboardClientProps {
  username: string;
  rank: RankResult;
  stats: ExtendedAggregatedStats;
  currentSeason: number;
}

export default function DashboardClient({
  username,
  rank,
  stats,
  currentSeason,
}: DashboardClientProps) {
  const [showRawStats, setShowRawStats] = useState(false);
  const tierColors = TIER_COLORS[rank.tier];
  const tierLabel = rank.division ? `${rank.tier} ${rank.division}` : rank.tier;

  // Calculate GP breakdown for display
  const gpBreakdown = {
    mergedPRs: {
      count: stats.totalMergedPRs,
      weight: METRIC_WEIGHTS.mergedPRs,
      contribution: stats.totalMergedPRs * METRIC_WEIGHTS.mergedPRs,
    },
    codeReviews: {
      count: stats.totalCodeReviews,
      weight: METRIC_WEIGHTS.codeReviews,
      contribution: stats.totalCodeReviews * METRIC_WEIGHTS.codeReviews,
    },
    issuesClosed: {
      count: stats.totalIssuesClosed,
      weight: METRIC_WEIGHTS.issuesClosed,
      contribution: stats.totalIssuesClosed * METRIC_WEIGHTS.issuesClosed,
    },
    commits: {
      count: stats.totalCommits,
      weight: METRIC_WEIGHTS.commits,
      contribution: stats.totalCommits * METRIC_WEIGHTS.commits,
    },
    stars: {
      count: Math.min(stats.totalStars, MAX_STARS_CAP),
      weight: METRIC_WEIGHTS.stars,
      contribution:
        Math.min(stats.totalStars, MAX_STARS_CAP) * METRIC_WEIGHTS.stars,
    },
  };

  const embedCode = `![GitHub Rank](https://github-ranked.vercel.app/api/rank/${username})`;

  return (
    <main className={styles.dashboard}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <Image
          src={`/api/rank/${username}`}
          alt={`${username}'s GitHub Rank`}
          width={495}
          height={170}
          className={styles.rankCard}
          unoptimized
        />
        <h1 className={styles.username}>@{username}</h1>
        <p className={styles.tierLabel} style={{ color: tierColors.accent }}>
          {tierLabel} - {rank.elo.toLocaleString()} Rating
        </p>
        <p className={styles.percentile}>
          Top {(100 - rank.percentile).toFixed(1)}% of developers
        </p>
      </section>

      {/* GP Breakdown */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Git Points Breakdown</h2>
        <p className={styles.wpiTotal}>
          Total WPI: <strong>{rank.wpi.toLocaleString()}</strong>
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Count</th>
                <th>Weight</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Merged PRs</td>
                <td>{gpBreakdown.mergedPRs.count.toLocaleString()}</td>
                <td>x{gpBreakdown.mergedPRs.weight}</td>
                <td className={styles.contribution}>
                  {gpBreakdown.mergedPRs.contribution.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>Code Reviews</td>
                <td>{gpBreakdown.codeReviews.count.toLocaleString()}</td>
                <td>x{gpBreakdown.codeReviews.weight}</td>
                <td className={styles.contribution}>
                  {gpBreakdown.codeReviews.contribution.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>Issues Closed</td>
                <td>{gpBreakdown.issuesClosed.count.toLocaleString()}</td>
                <td>x{gpBreakdown.issuesClosed.weight}</td>
                <td className={styles.contribution}>
                  {gpBreakdown.issuesClosed.contribution.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>Commits</td>
                <td>{gpBreakdown.commits.count.toLocaleString()}</td>
                <td>x{gpBreakdown.commits.weight}</td>
                <td className={styles.contribution}>
                  {gpBreakdown.commits.contribution.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>Stars</td>
                <td>
                  {gpBreakdown.stars.count.toLocaleString()}
                  {stats.totalStars > MAX_STARS_CAP && (
                    <span className={styles.capped}> (capped)</span>
                  )}
                </td>
                <td>x{gpBreakdown.stars.weight}</td>
                <td className={styles.contribution}>
                  {gpBreakdown.stars.contribution.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Seasonal Breakdown */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Seasonal Contribution History</h2>
        <p className={styles.seasonInfo}>
          Current Season: <strong>S{currentSeason}</strong>
        </p>
        <div className={styles.decayInfo}>
          <p>
            Seasonal decay applies to older contributions (Current: 100%, Last
            year: 60%, 2 years: 35%, 3 years: 20%, 4+: 10%)
          </p>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showRawStats}
            onChange={(e) => setShowRawStats(e.target.checked)}
          />
          <span>Show raw (undecayed) stats</span>
        </label>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Season</th>
                <th>Decay</th>
                <th>Commits</th>
                <th>PRs</th>
                <th>Reviews</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {stats.decayedYearlyBreakdown
                .sort((a, b) => b.year - a.year)
                .map((year) => {
                  const raw = stats.yearlyBreakdown.find(
                    (y) => y.year === year.year
                  );
                  return (
                    <tr key={year.year}>
                      <td>
                        <strong>S{year.year}</strong>
                      </td>
                      <td className={styles.decay}>
                        {(year.decayMultiplier * 100).toFixed(0)}%
                      </td>
                      <td>{showRawStats ? raw?.commits : year.commits}</td>
                      <td>{showRawStats ? raw?.prs : year.prs}</td>
                      <td>{showRawStats ? raw?.reviews : year.reviews}</td>
                      <td>{showRawStats ? raw?.issues : year.issues}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Embed Code */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Add to Your README</h2>
        <div className={styles.embedBox}>
          <code className={styles.embedCode}>{embedCode}</code>
          <button
            className={styles.copyButton}
            onClick={() => navigator.clipboard.writeText(embedCode)}
          >
            Copy
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <a
          href="https://github.com/anthropics/claude-code"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Ranked
        </a>
      </footer>
    </main>
  );
}
