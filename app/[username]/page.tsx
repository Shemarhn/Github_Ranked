import { notFound } from 'next/navigation';
import { getAssessment } from '@/lib/assessment/service';
import { validateUsername } from '@/lib/utils/validation';
import { UserNotFoundError } from '@/lib/utils/errors';
import EvidenceProfile from './EvidenceProfile';

export const maxDuration = 60;

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

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { username } = await params;

  if (!validateUsername(username)) {
    notFound();
  }

  let data;
  try {
    data = await getAssessment(username);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      notFound();
    }
    throw error;
  }

  return <EvidenceProfile assessment={data} />;
}
