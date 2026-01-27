import { notFound } from 'next/navigation';
import { aggregateAllTimeStatsExtended } from '@/lib/github/aggregator';
import { calculateRank } from '@/lib/ranking/engine';
import { validateUsername } from '@/lib/utils/validation';
import { UserNotFoundError } from '@/lib/utils/errors';
import DashboardClient from './DashboardClient';

interface DashboardPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { username } = await params;
  return {
    title: `${username} - GitHub Ranked`,
    description: `View ${username}'s GitHub ranking and contribution breakdown`,
  };
}

async function fetchDashboardData(username: string) {
  const stats = await aggregateAllTimeStatsExtended(username);
  const rank = calculateRank(stats);
  const currentSeason = new Date().getUTCFullYear();
  return { stats, rank, currentSeason };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { username } = await params;

  if (!validateUsername(username)) {
    notFound();
  }

  let data;
  try {
    data = await fetchDashboardData(username);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <DashboardClient
      username={username}
      rank={data.rank}
      stats={data.stats}
      currentSeason={data.currentSeason}
    />
  );
}
