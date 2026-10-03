# GitHub Ranked

> A fun gaming rank and profile badge for public GitHub contributions

[![CI](https://github.com/Shemarhn/Github_Ranked/actions/workflows/ci.yml/badge.svg)](https://github.com/Shemarhn/Github_Ranked/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GitHub Ranked analyzes your GitHub activity and generates a competitive tier badge — like ranking systems in games, but for your code contributions.

![Example](https://github-ranked.vercel.app/api/rank/shemarhn)

## Quick Start

Add to your GitHub profile README:

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/YOUR_USERNAME)
```

## Dashboard

View detailed stats breakdown at:

```
https://github-ranked.vercel.app/{username}
```

The dashboard shows:

- Full GP breakdown by metric
- Seasonal contribution history with decay visualization
- Raw vs. decayed stats toggle
- Embed code for your README

## Tiers

| Tier        | Rating      | Percentile |
| ----------- | ----------- | ---------- |
| Iron        | 0 - 599     | Bottom 5%  |
| Bronze      | 600 - 899   | 5 - 15%    |
| Silver      | 900 - 1199  | 15 - 40%   |
| Gold        | 1200 - 1499 | 40 - 65%   |
| Platinum    | 1500 - 1699 | 65 - 80%   |
| Emerald     | 1700 - 1999 | 80 - 90%   |
| Diamond     | 2000 - 2399 | 90 - 97%   |
| Master      | 2400 - 2599 | 97 - 99%   |
| Grandmaster | 2600 - 2999 | 99 - 99.9% |
| Challenger  | 3000+       | Top 0.1%   |

Tiers below Master have divisions (IV to I).

## API

```
GET /api/rank/{username}
```

| Parameter | Default   | Description            |
| --------- | --------- | ---------------------- |
| `theme`   | `default` | Card theme (see below) |
| `season`  | all-time  | Year (e.g., `2024`)    |
| `force`   | `false`   | Bypass cache           |

### Themes

- `default` - GitHub dark
- `dark` - Pure black
- `light` - White/light mode
- `minimal` - Transparent background
- `cyberpunk` - Neon pink/cyan
- `ocean` - Deep blue
- `forest` - Green/nature
- `sunset` - Warm orange/red
- `galaxy` - Purple/cosmic

**Examples:**

```markdown
![Rank](https://github-ranked.vercel.app/api/rank/octocat)
![Rank](https://github-ranked.vercel.app/api/rank/octocat?theme=cyberpunk)
![Rank](https://github-ranked.vercel.app/api/rank/octocat?theme=ocean)
![Rank](https://github-ranked.vercel.app/api/rank/octocat?season=2024)
```

## How It Works

Every valid profile gets a gaming rank, including new and inactive accounts.
There is no review requirement or unrated state.

The score rewards public merged PRs, reviews of other people's work, closed
issues you authored, commits and repository stars. Diminishing returns reduce
volume farming. Repeated interaction partners and repository owners receive
less credit, duplicate reviews do not stack, and followers earn no points.

Ranks use actual percentiles among cached profile scores, including accounts
added by background population sampling. Ties share a percentile; each account
counts once per season. The dashboard shows the population size. This pool
includes visitors and sampled users, **not every GitHub account**, and its size
and composition affect your rank. During a Redis outage a score-based game rank
remains available, without claiming a measured percentile.

Read [the formula, sampling method and limitations](ALGORITHM.md). This is a
profile decoration and contribution game, not an official measure of ability.

## Seasonal System

GitHub Ranked uses a seasonal decay system inspired by competitive games like League of Legends:

| Season Age     | Weight | Example (in 2026) |
| -------------- | ------ | ----------------- |
| Current Season | 100%   | 2026              |
| Previous       | 60%    | 2025              |
| 2 years ago    | 35%    | 2024              |
| 3 years ago    | 20%    | 2023              |
| 4+ years       | 10%    | 2022 and earlier  |

This ensures your rank reflects recent activity while still rewarding consistent long-term contributions. At each new year, there's effectively a soft reset where your older contributions matter less.

## Self-Hosting

**Requirements:** Node.js 20+, GitHub PAT, Upstash Redis

```bash
git clone https://github.com/Shemarhn/Github_Ranked.git
cd Github_Ranked
npm install
cp .env.local.example .env.local
# Add your tokens to .env.local
npm run dev
```

**Environment Variables:**

| Variable                   | Required     | Description                                       |
| -------------------------- | ------------ | ------------------------------------------------- |
| `GITHUB_TOKEN_1`           | Yes          | GitHub PAT (`read:user` scope)                    |
| `GITHUB_TOKEN_2+`          | No           | Additional tokens for scaling                     |
| `UPSTASH_REDIS_REST_URL`   | Yes          | Upstash Redis URL                                 |
| `UPSTASH_REDIS_REST_TOKEN` | Yes          | Upstash Redis token                               |
| `CRON_SECRET`              | For sampling | Random secret protecting the daily population job |

The daily sampling job starts after `CRON_SECRET` is configured in Vercel and
the updated project is deployed. It also supports authenticated manual runs at
`/api/population`. Ordinary profile visits add to the comparison pool immediately.

## Troubleshooting production authentication

If the rank API returns `502` with an upstream `401 Unauthorized` (or
`GitHub authentication failed`) and dashboards fail, GitHub has rejected the
server's credential. A successful build does not verify production credentials:
the automated tests mock GitHub requests.

1. Create a replacement GitHub personal access token with the documented
   `read:user` scope. Do not commit it or put it in a `NEXT_PUBLIC_*` variable.
2. In the Vercel project's **Settings > Environment Variables**, replace
   `GITHUB_TOKEN_1` for **Production**. Replace or remove any other invalid
   `GITHUB_TOKEN_*` entries, keeping the numbering consecutive from 1.
3. Redeploy so the running application receives the updated environment.
4. Verify `/api/rank/shemarhn?force=true` returns HTTP 200 with an
   `image/svg+xml` content type, then open `/shemarhn` and confirm the dashboard
   and badge load. Repeat with another valid username.

Never paste tokens into issues or logs. If authentication succeeds but another
error appears, inspect the deployment logs for that request before changing
Redis or rendering configuration.

The application needs a server for its GitHub API calls and SVG generation.
GitHub Pages alone cannot run these routes; hosting it there would require a
separate backend or a redesign to generate badges in advance.

## Tech Stack

- **Next.js** - App Router, API routes
- **Satori** - SVG generation
- **Upstash Redis** - Caching
- **GitHub GraphQL API** - Data source

## Contributing

PRs welcome. Fork, branch, commit, PR.

## License

MIT
