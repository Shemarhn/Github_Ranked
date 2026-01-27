import { NextRequest, NextResponse } from 'next/server';
import {
  validateUsername,
  validateTheme,
  validateSeason,
} from '@/lib/utils/validation';
import {
  formatErrorResponse,
  UserNotFoundError,
  ValidationError,
  RateLimitError,
} from '@/lib/utils/errors';
import {
  aggregateAllTimeStats,
  fetchYearlyStats,
} from '@/lib/github/aggregator';
import { calculateRank } from '@/lib/ranking/engine';
import { renderRankCard } from '@/lib/renderer/render';
import {
  getCachedRank,
  setCachedRank,
  getCacheHeaders,
  CACHE_TTL,
} from '@/lib/cache';
import type { ThemeName } from '@/lib/renderer/themes';

/**
 * Runtime configuration for Node.js (required for WebAssembly)
 */
export const runtime = 'nodejs';

/**
 * GET /api/rank/[username]
 *
 * Main API endpoint for GitHub Ranked
 * Returns an SVG rank card for the specified GitHub username
 *
 * Query Parameters:
 * - theme: 'default' | 'dark' | 'light' | 'minimal'
 * - season: Year number (e.g., 2024) for season-specific rank
 * - force: 'true' to bypass cache
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const { searchParams } = url;

  try {
    const { username } = await params;

    // Parse and validate query parameters
    const themeParam = searchParams.get('theme') || 'default';
    const seasonParam = searchParams.get('season');
    const forceRefresh = searchParams.get('force') === 'true';

    // Validate username
    if (!validateUsername(username)) {
      throw new ValidationError('Invalid GitHub username format', {
        username,
        pattern: 'Must be 1-39 alphanumeric characters or hyphens',
      });
    }

    // Validate and normalize theme
    const theme = validateTheme(themeParam) as ThemeName;

    // Validate season if provided
    const season = seasonParam ? validateSeason(seasonParam) : undefined;
    if (seasonParam && season === null) {
      throw new ValidationError('Invalid season parameter', {
        season: seasonParam,
        hint: 'Season must be a year between 2010 and current year',
      });
    }

    // Check cache (unless force refresh)
    if (!forceRefresh) {
      const cacheResult = await getCachedRank(username, {
        season: season ?? 'all',
        theme,
      });

      if (cacheResult.hit && cacheResult.data) {
        // Render SVG from cached data
        const svg = await renderRankCard({
          username: cacheResult.data.username,
          rank: cacheResult.data.rank,
          stats: cacheResult.data.stats,
          theme,
          season: season ?? 'all',
        });

        return new NextResponse(svg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            ...getCacheHeaders(true, CACHE_TTL.DEFAULT),
            'X-Request-Id': requestId,
            'X-Response-Time': `${Date.now() - startTime}ms`,
          },
        });
      }
    }

    // Fetch GitHub stats
    let stats;
    if (season) {
      // Fetch single year stats
      const yearlyStats = await fetchYearlyStats(username, season);
      stats = {
        totalMergedPRs: yearlyStats.prs,
        totalCodeReviews: yearlyStats.reviews,
        totalIssuesClosed: yearlyStats.issues,
        totalCommits: yearlyStats.commits,
        totalStars: 0, // Stars are all-time only
        totalFollowers: 0,
        firstContributionYear: season,
        lastContributionYear: season,
        yearsActive: 1,
      };
    } else {
      // Fetch all-time stats
      stats = await aggregateAllTimeStats(username);
    }

    // Calculate rank
    const rank = calculateRank(stats);

    // Cache the result
    await setCachedRank(username, rank, stats, {
      ttl: CACHE_TTL.DEFAULT,
      season: season ?? 'all',
      theme,
    });

    // Render SVG
    const svg = await renderRankCard({
      username,
      rank,
      stats,
      theme,
      season: season ?? 'all',
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        ...getCacheHeaders(false, CACHE_TTL.DEFAULT),
        'X-Request-Id': requestId,
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof UserNotFoundError) {
      const { status, body } = formatErrorResponse(error, requestId);
      return NextResponse.json(body, {
        status,
        headers: {
          ...getCacheHeaders(false, CACHE_TTL.NOT_FOUND),
          'X-Request-Id': requestId,
        },
      });
    }

    if (error instanceof ValidationError) {
      const { status, body } = formatErrorResponse(error, requestId);
      return NextResponse.json(body, {
        status,
        headers: {
          'X-Request-Id': requestId,
        },
      });
    }

    if (error instanceof RateLimitError) {
      const { status, body } = formatErrorResponse(error, requestId);
      return NextResponse.json(body, {
        status,
        headers: {
          ...getCacheHeaders(false, CACHE_TTL.ERROR),
          'Retry-After': String(error.retryAfter || 60),
          'X-Request-Id': requestId,
        },
      });
    }

    // Log and return generic error
    console.error('[API] Error:', error);
    const { status, body } = formatErrorResponse(error, requestId);
    return NextResponse.json(body, {
      status,
      headers: {
        ...getCacheHeaders(false, CACHE_TTL.ERROR),
        'X-Request-Id': requestId,
      },
    });
  }
}
