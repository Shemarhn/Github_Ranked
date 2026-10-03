import type { NextRequest } from 'next/server';
import { assessmentResponse } from '@/lib/assessment/handler';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  return assessmentResponse(request, (await params).username, 'json');
}
