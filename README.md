# GitHub Ranked 🎮

> Competitive skill ratings for developers based on GitHub contributions

[![CI](https://github.com/Shemarhn/Github_Ranked/actions/workflows/ci.yml/badge.svg)](https://github.com/Shemarhn/Github_Ranked/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GitHub Ranked analyzes your GitHub activity and generates a competitive tier badge — like ranking systems in games, but for your code contributions.

![Example](https://github-ranked.vercel.app/api/rank/shemarhn)

## Quick Start

Add to your GitHub profile README:

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/YOUR_USERNAME)
```

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

Tiers below Master have divisions (IV → I).

## API

```
GET /api/rank/{username}
```

| Parameter | Default   | Description                           |
| --------- | --------- | ------------------------------------- |
| `theme`   | `default` | `default`, `dark`, `light`, `minimal` |
| `season`  | all-time  | Year (e.g., `2024`)                   |
| `force`   | `false`   | Bypass cache                          |

**Examples:**

```markdown
![Rank](https://github-ranked.vercel.app/api/rank/octocat)
![Rank](https://github-ranked.vercel.app/api/rank/octocat?theme=dark)
![Rank](https://github-ranked.vercel.app/api/rank/octocat?season=2024)
```

## How It Works

Your rank is calculated from:

| Metric        | Weight | Reason                           |
| ------------- | ------ | -------------------------------- |
| Merged PRs    | 40%    | Code accepted by peers           |
| Code Reviews  | 30%    | Mentorship, seniority signal     |
| Issues Closed | 20%    | Problem-solving                  |
| Commits       | 10%    | Activity (low to prevent gaming) |
| Stars         | 5%     | Social proof (capped at 500)     |

These are combined into a Weighted Performance Index, normalized against global GitHub activity, then converted to an Elo-style rating.

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

| Variable                   | Required | Description                    |
| -------------------------- | -------- | ------------------------------ |
| `GITHUB_TOKEN_1`           | Yes      | GitHub PAT (`read:user` scope) |
| `GITHUB_TOKEN_2+`          | No       | Additional tokens for scaling  |
| `UPSTASH_REDIS_REST_URL`   | Yes      | Upstash Redis URL              |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | Upstash Redis token            |

## Tech Stack

- **Next.js** — App Router, API routes
- **Satori** — SVG generation
- **Upstash Redis** — Caching
- **GitHub GraphQL API** — Data source

## Contributing

PRs welcome. Fork → branch → commit → PR.

## License

MIT
