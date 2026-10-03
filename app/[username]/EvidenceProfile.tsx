import Image from 'next/image';
import Link from 'next/link';
import type { Assessment } from '@/lib/assessment/types';
import styles from '../assessment.module.css';

export default function EvidenceProfile({
  assessment,
}: {
  assessment: Assessment;
}) {
  const { contribution, quality, snapshot } = assessment;
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/">GitHub Ranked</Link>
        <Link href="/methodology">How it works ↗</Link>
      </nav>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          An evidence profile · v{assessment.version}
        </p>
        <h1>@{snapshot.username}</h1>
        <p>
          Public contributions tell part of your story. Engineering quality
          needs a closer look.
        </p>
      </header>
      <section className={styles.grid} aria-label="Assessment summary">
        <article className={styles.card}>
          <p className={styles.eyebrow}>Public contribution rating</p>
          <h2>{contribution.tier}</h2>
          <p className={styles.score}>
            {contribution.score === null
              ? 'More evidence needed'
              : `${contribution.score.toFixed(1)} / 100`}
          </p>
          <p>
            {contribution.evidenceStatus === 'incomplete'
              ? 'Collection was incomplete. No rank is assigned.'
              : contribution.evidenceStatus === 'limited'
                ? 'Not enough public observations for a rank. This does not mean low ability.'
                : 'A provisional activity rating, not a skill percentile.'}
          </p>
          <p className={styles.muted}>
            {snapshot.from.slice(0, 10)} to {snapshot.to.slice(0, 10)} · Updated{' '}
            {snapshot.fetchedAt.slice(0, 10)}
          </p>
        </article>
        <article className={styles.card}>
          <p className={styles.eyebrow}>Reviewed engineering quality</p>
          <h2>
            {quality.score === null
              ? 'Not yet assessed'
              : `${quality.score.toFixed(1)} / 100`}
          </h2>
          <p>
            Requires actual work samples and independent rubric reviews. Missing
            evidence stays unknown.
          </p>
          <p className={styles.muted}>
            Experimental rubric score. No population percentile or hiring
            recommendation.
          </p>
        </article>
      </section>
      <section className={styles.card}>
        <h2>What supports the badge</h2>
        <dl className={styles.metrics}>
          <div>
            <dt>Capped delivery observations</dt>
            <dd>{contribution.deliveryUnits}</dd>
          </div>
          <div>
            <dt>Capped review observations</dt>
            <dd>{contribution.reviewUnits}</dd>
          </div>
          <div>
            <dt>Months with public evidence</dt>
            <dd>{contribution.activeMonths}</dd>
          </div>
        </dl>
        <p>
          The stronger delivery or review track supplies 80% of the index;
          observed months supply 20%. Commit totals, stars, followers, lines of
          code, and repository count earn no extra points.
        </p>
        {contribution.repeatedCounterpartShare !== null && (
          <p className={styles.muted}>
            {contribution.repeatedCounterpartShare}% of observed reviews concern
            the same most-reviewed author. Repetition is capped; this is not an
            accusation of farming.
          </p>
        )}
      </section>
      <section className={styles.card}>
        <h2>Engineering dimensions</h2>
        <div className={styles.dimensions}>
          {quality.dimensions.map((dimension) => (
            <article key={dimension.dimension}>
              <h3>{dimension.dimension}</h3>
              <p>
                {dimension.score === null
                  ? dimension.status === 'reviewer_disagreement'
                    ? 'Reviewers disagree — unresolved'
                    : 'Insufficient reviewed evidence'
                  : `${dimension.score.toFixed(1)} / 100`}
              </p>
              <p className={styles.muted}>
                {dimension.artifacts} work samples with multiple reviews ·{' '}
                {dimension.reviewers} reviewers
              </p>
              {dimension.observations.map((r) => (
                <details key={`${r.artifact}:${r.reviewer}`}>
                  <summary>
                    {r.reviewer} · {r.score}/4 · {r.reviewedAt.slice(0, 10)}
                  </summary>
                  <p>{r.rationale}</p>
                  <a href={r.evidenceUrl}>Inspect cited evidence ↗</a>
                </details>
              ))}
            </article>
          ))}
        </div>
      </section>
      <section className={styles.card}>
        <h2>What we cannot conclude</h2>
        <ul>
          {snapshot.limitations.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        <p>
          Older achievements are not erased: choose a historical year through
          the API. Recent public activity and enduring engineering capability
          are separate assessments.
        </p>
      </section>
      <section className={styles.card}>
        <h2>Inspect the evidence</h2>
        <p>
          {snapshot.events.length} observed events. Dates and links let you
          check what the system counted.
        </p>
        <details>
          <summary>Show recent observations (up to 30)</summary>
          <ul>
            {snapshot.events
              .slice(-30)
              .reverse()
              .map((event) => (
                <li key={`${event.kind}:${event.id}`}>
                  <a href={event.url}>
                    {event.repository} — {event.kind.replaceAll('_', ' ')}
                  </a>{' '}
                  · {event.occurredAt.slice(0, 10)}
                </li>
              ))}
          </ul>
        </details>
        <a href={`/api/assessment/${snapshot.username}`}>
          Download the full assessment as JSON ↗
        </a>
      </section>
      <section className={styles.card}>
        <h2>Your README badge</h2>
        <Image
          src={`/api/rank/${snapshot.username}`}
          width={495}
          height={170}
          alt={`${snapshot.username}'s public contribution rating`}
          unoptimized
          className={styles.badge}
        />
        <code
          className={styles.code}
        >{`![Public contribution rating](https://github-ranked.vercel.app/api/rank/${snapshot.username})`}</code>
      </section>
      <footer className={styles.muted}>
        Experimental, explainable, and open to correction.{' '}
        <Link href="/methodology">Read the formula and review process.</Link>
      </footer>
    </main>
  );
}
