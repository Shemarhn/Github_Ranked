import Link from 'next/link';
import styles from '../assessment.module.css';
export default function Methodology() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/">GitHub Ranked</Link>
        <span>Methodology · 2.0.0</span>
      </nav>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>An inspectable formula</p>
        <h1>Evidence before certainty.</h1>
        <p>
          Two separate assessments: an automatic public contribution index and a
          reviewed engineering-quality profile.
        </p>
      </header>
      <section className={styles.card}>
        <h2>The public contribution formula</h2>
        <p>
          We examine the current UTC month and the previous eleven months.
          Historical calendar years are available through the season parameter.
        </p>
        <ul>
          <li>
            Delivery D: distinct days with eligible public commit contributions
            or verified merged PRs, capped at three days per month across all
            repositories.
          </li>
          <li>
            Review R: distinct other human PR authors reviewed, capped at one
            observation per author per month and three per month overall. A
            review is participation, not proof of usefulness.
          </li>
          <li>
            Continuity M: months containing public delivery or review evidence.
            No streak or daily activity requirement.
          </li>
        </ul>
        <code className={styles.code}>
          Score = 80 × (1 − exp(−max(D, R) / 12)) + 20 × min(M / 6, 1)
        </code>
        <p>
          Delivery and reviewing are alternative tracks. Three months and six
          capped observations on either track are required. Otherwise the badge
          is Unrated. Incomplete collection also produces Unrated.
        </p>
        <p>
          Each ten-point band maps to Iron, Bronze, Silver, Gold, Platinum,
          Emerald, Diamond, Master, Grandmaster, and Challenger. These are
          contribution bands, not measured population percentiles. The weights
          and caps are published product choices awaiting empirical calibration.
        </p>
      </section>
      <section className={styles.card}>
        <h2>Engineering quality</h2>
        <p>
          Five dimensions: correctness, judgment, ownership, collaboration, and
          impact. Each uses a 0–4 rubric with concrete evidence and
          explanations. Each dimension needs at least three different work
          samples, each reviewed by two independent reviewers. Self-reviews are
          excluded.
        </p>
        <p>
          We average reviewers within each sample, then give each sample equal
          weight. A disagreement greater than one rubric level withholds that
          dimension pending resolution. Unknown dimensions remain unknown; they
          are never replaced with zero.
        </p>
        <code className={styles.code}>
          Dimension = 25 × mean(sample reviewer means){'\n'}Overall = 100 ×
          geometric mean(dimension scores / 100)
        </code>
        <p>
          The overall score is published only when all five dimensions qualify.
          The geometric mean limits how much a strong dimension can hide a weak
          one. It is a descriptive rubric result, not a statistically calibrated
          ability estimate.
        </p>
      </section>
      <section className={styles.card}>
        <h2>Limitations and corrections</h2>
        <p>
          Public metadata cannot establish code quality, identify all reciprocal
          farming, attribute team outcomes perfectly, or reveal private work.
          Small teams are not penalized as suspicious. Repeated interaction is
          capped without calling anyone dishonest.
        </p>
        <p>
          Creating activity across many months can still game the contribution
          badge. It cannot automatically generate engineering-quality scores. A
          documentation path, green build, big diff, or popular repository does
          not prove excellence.
        </p>
        <p>
          Work reviews are curated by the maintainer in a versioned repository
          file, not submitted through an unauthenticated public API. Reviewers
          must inspect actual artifacts and disclose conflicts. Contributors can
          request corrections with evidence; no scores are changed silently.
        </p>
        <p>
          Past reviewed achievements do not decay automatically. Review dates
          remain visible. The recent activity window describes recency
          separately.
        </p>
        <a href="https://github.com/Shemarhn/Github_Ranked/blob/main/ALGORITHM.md">
          Full rubric, collection limits, and validation protocol ↗
        </a>
      </section>
    </main>
  );
}
