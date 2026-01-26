# GitHub Ranked 🎮

> Transform your GitHub profile into a gaming-style rank badge!

[![CI](https://github.com/YOUR_USERNAME/github-ranked/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/github-ranked/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GitHub Ranked calculates a **Dev-Elo** rating based on your GitHub contributions and displays it as an embeddable rank badge inspired by competitive gaming tiers.

## 🎯 Quick Start

Add this to your GitHub README:

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/YOUR_USERNAME)
```

**Example:**

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/torvalds)
```

## 🏆 Ranking Tiers

| Tier           | SR Range    | Percentile  |
| -------------- | ----------- | ----------- |
| 🔘 Iron        | 0 - 599     | Bottom 5%   |
| 🟤 Bronze      | 600 - 899   | 5% - 15%    |
| ⚪ Silver      | 900 - 1199  | 15% - 40%   |
| 🟡 Gold        | 1200 - 1499 | 40% - 65%   |
| 🔵 Platinum    | 1500 - 1699 | 65% - 80%   |
| 🟢 Emerald     | 1700 - 1999 | 80% - 90%   |
| 💎 Diamond     | 2000 - 2399 | 90% - 97%   |
| 🟣 Master      | 2400 - 2599 | 97% - 99%   |
| 🔴 Grandmaster | 2600 - 2999 | 99% - 99.9% |
| 👑 Challenger  | 3000+       | Top 0.1%    |

Each tier (except Master, Grandmaster, Challenger) has 4 divisions: IV, III, II, I

## 📊 API Reference

### Endpoint

```
GET /api/rank/{username}
```

### Parameters

| Parameter  | Type  | Default   | Description                                  |
| ---------- | ----- | --------- | -------------------------------------------- |
| `username` | path  | required  | GitHub username                              |
| `theme`    | query | `default` | Theme: `default`, `dark`, `light`, `minimal` |
| `season`   | query | all-time  | Year (e.g., `2024`) for season-specific rank |
| `force`    | query | `false`   | Set to `true` to bypass cache                |

### Examples

**Default badge:**

```markdown
![Rank](https://github-ranked.vercel.app/api/rank/octocat)
```

**Dark theme:**

```markdown
![Rank](https://github-ranked.vercel.app/api/rank/octocat?theme=dark)
```

**Season 2024:**

```markdown
![Rank](https://github-ranked.vercel.app/api/rank/octocat?season=2024)
```

**Combined:**

```markdown
![Rank](https://github-ranked.vercel.app/api/rank/octocat?theme=minimal&season=2024)
```

### Response Headers

| Header            | Description               |
| ----------------- | ------------------------- |
| `X-Cache`         | `HIT` or `MISS`           |
| `X-Request-Id`    | Unique request identifier |
| `X-Response-Time` | Processing time           |
| `Cache-Control`   | Caching directives        |

### Error Responses

| Status | Description                    |
| ------ | ------------------------------ |
| 400    | Invalid username or parameters |
| 404    | GitHub user not found          |
| 429    | Rate limit exceeded            |
| 500    | Internal server error          |

## 🧮 How Ranking Works

### Weighted Performance Index (WPI)

Your rank is calculated from these GitHub metrics:

| Metric        | Weight | Why                                    |
| ------------- | ------ | -------------------------------------- |
| Merged PRs    | 40%    | Peer acceptance, collaboration         |
| Code Reviews  | 30%    | Seniority signal, mentorship           |
| Issues Closed | 20%    | Problem-solving ability                |
| Commits       | 10%    | Activity (low weight prevents farming) |
| Stars         | 5%     | Social proof (capped at 500)           |

### Dev-Elo Formula

```
WPI = Σ(metric × weight)
Z-Score = (ln(WPI + 1) - μ) / σ
Elo = 1200 + (Z-Score × 400)
```

Where:

- μ = 6.5 (global mean log activity)
- σ = 1.5 (standard deviation)
- 1200 = median Elo (Gold IV)

## 🎨 Themes

| Theme     | Description                        |
| --------- | ---------------------------------- |
| `default` | Dark background with color accents |
| `dark`    | Pure dark mode                     |
| `light`   | Light background                   |
| `minimal` | Minimal styling, no gradients      |

## 🛠️ Self-Hosting

### Prerequisites

- Node.js 20+
- GitHub Personal Access Token
- Upstash Redis account

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/github-ranked.git
   cd github-ranked
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run locally**

   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**
   ```bash
   vercel
   ```

### Environment Variables

| Variable                   | Required | Description                                |
| -------------------------- | -------- | ------------------------------------------ |
| `GITHUB_TOKEN_1`           | Yes      | GitHub PAT with `read:user`, `public_repo` |
| `GITHUB_TOKEN_2`           | No       | Additional token for rate limiting         |
| `UPSTASH_REDIS_REST_URL`   | Yes      | Upstash Redis REST URL                     |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | Upstash Redis REST token                   |

## 📈 Rate Limits

- **GitHub API**: 5,000 points/hour per token
- **Our API**: Results cached for 24 hours

Add multiple `GITHUB_TOKEN_N` variables to increase throughput.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- aggregator.test.ts
```

## 📁 Project Structure

```
github-ranked/
├── app/
│   └── api/rank/[username]/route.ts  # API endpoint
├── lib/
│   ├── cache/                         # Caching layer
│   ├── github/                        # GitHub API client
│   ├── ranking/                       # Ranking algorithm
│   ├── renderer/                      # SVG rendering
│   └── utils/                         # Utilities
├── tests/                             # Test suites
└── docs/                              # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
- Ranking system inspired by competitive gaming (League of Legends, Overwatch)
- Built with [Next.js](https://nextjs.org/), [Satori](https://github.com/vercel/satori), [Upstash](https://upstash.com/)

---

<p align="center">
  Made with ❤️ by developers, for developers
</p>
