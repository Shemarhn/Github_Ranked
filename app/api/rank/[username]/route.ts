import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/rank/[username]
 *
 * Main API endpoint for GitHub Ranked
 * Returns an SVG rank card for the specified GitHub username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // TODO: Implement rank calculation
  return NextResponse.json(
    { message: 'Not implemented yet', username },
    { status: 501 }
  );
}
