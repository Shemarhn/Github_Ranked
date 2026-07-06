import styles from './page.module.css';

const exampleUsername = 'shemarhn';

export default function Home() {
  const dashboardPath = `/${exampleUsername}`;
  const badgePath = `/api/rank/${exampleUsername}`;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>GitHub Ranked</p>
        <h1>Competitive developer ranks from GitHub activity.</h1>
        <p className={styles.summary}>
          Generate a League-style rank card for any GitHub username, then open
          the dashboard to review the contribution breakdown.
        </p>
        <div className={styles.ctas} aria-label="GitHub Ranked examples">
          <a className={styles.primary} href={dashboardPath}>
            View example dashboard
          </a>
          <a className={styles.secondary} href={badgePath}>
            Open rank badge
          </a>
        </div>
      </section>

      <section className={styles.card} aria-label="Usage examples">
        <h2>Try it with your username</h2>
        <code>/{'{username}'}</code>
        <code>/api/rank/{'{username}'}</code>
        <p>
          Replace <strong>{exampleUsername}</strong> in the example URLs with
          any GitHub username to view a dashboard or embed a README badge.
        </p>
      </section>
    </main>
  );
}
