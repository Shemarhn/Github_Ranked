import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse, ValidationError } from '@/lib/utils/errors';
import { validateTheme } from '@/lib/utils/validation';
import { getAssessment } from './service';
import { assessmentBadge } from './badge';

export async function assessmentResponse(
  request: NextRequest,
  username: string,
  format: 'svg' | 'json'
) {
  const requestId = crypto.randomUUID();
  try {
    const rawSeason = request.nextUrl.searchParams.get('season');
    if (rawSeason !== null && !/^\d{4}$/.test(rawSeason))
      throw new ValidationError('Season must be a four-digit year');
    const assessment = await getAssessment(username, {
      season: rawSeason === null ? undefined : Number(rawSeason),
      force: request.nextUrl.searchParams.get('force') === 'true',
    });
    const headers = {
      'Cache-Control': assessment.snapshot.complete
        ? 'public, max-age=300'
        : 'no-store',
      'X-Algorithm-Version': assessment.version,
      'X-Request-Id': requestId,
      'X-Content-Type-Options': 'nosniff',
    };
    if (format === 'json') return NextResponse.json(assessment, { headers });
    return new NextResponse(
      assessmentBadge(
        assessment,
        validateTheme(request.nextUrl.searchParams.get('theme') ?? 'default')
      ),
      {
        headers: {
          ...headers,
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        },
      }
    );
  } catch (error) {
    const { status, body } = formatErrorResponse(error, requestId);
    return NextResponse.json(body, {
      status,
      headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId },
    });
  }
}
