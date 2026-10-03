import Link from 'next/link';
import styles from './assessment.module.css';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <span>GitHub Ranked</span>
        <Link href="/methodology">How it works ↗</Link>
      </nav>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          Public contributions. Visible evidence.
        </p>
        <h1>More context behind every rank.</h1>
        <p>
          A contribution badge with a transparent formula, plus an engineering
          profile that says what is known — and what is not.
        </p>
      </header>
      <section className={styles.card}>
        <h2>Explore a developer profile</h2>
        <form action="/lookup" method="get" className={styles.form}>
          <label htmlFor="username">GitHub username</label>
          <input
            id="username"
            name="username"
            required
            maxLength={39}
            placeholder="shemarhn"
            autoComplete="off"
            pattern="[a-zA-Z0-9][a-zA-Z0-9-]{0,38}"
          />
          <button type="submit">View evidence profile</button>
        </form>
        {error && <p role="alert">Enter a valid GitHub username.</p>}
        <Link href="/shemarhn">See an example profile ↗</Link>
      </section>
      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Activity has limits</h2>
          <p>
            Repeated activity is capped. Stars, followers, and raw commit totals
            do not increase your score.
          </p>
        </article>
        <article className={styles.card}>
          <h2>Quality needs evidence</h2>
          <p>
            Correctness, judgment, ownership, collaboration, and impact require
            reviewed work samples. Private or missing work is never treated as
            proof of low ability.
          </p>
        </article>
      </section>
      <p className={styles.muted}>
        Version 2 is experimental. Ratings describe available evidence, not a
        person’s worth or a hiring verdict.
      </p>
    </main>
  );
}
