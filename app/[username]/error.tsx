'use client';

import Link from 'next/link';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: 24 }}>
      <h1>Rank temporarily unavailable</h1>
      <p style={{ margin: '24px 0' }}>
        We could not load GitHub activity. Please try again later. If the
        problem continues, the service owner may need to check the GitHub
        connection.
      </p>
      <button
        onClick={reset}
        style={{ padding: '12px 20px', cursor: 'pointer' }}
      >
        Try again
      </button>
      <p style={{ marginTop: 24 }}>
        <Link href="/">Back to GitHub Ranked</Link>
      </p>
    </main>
  );
}
