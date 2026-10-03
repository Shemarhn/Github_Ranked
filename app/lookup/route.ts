import { NextRequest, NextResponse } from 'next/server';
import { validateUsername } from '@/lib/utils/validation';
export function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.trim() ?? '';
  return NextResponse.redirect(
    new URL(
      validateUsername(username)
        ? `/${encodeURIComponent(username)}`
        : '/?error=username',
      request.url
    )
  );
}
