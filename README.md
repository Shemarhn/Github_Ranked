# GitHub Ranked

Public contribution badges and evidence-based engineering profiles.

Version 2 separates **observable public activity** from **reviewed engineering quality**. It does not claim to measure a person's overall worth or percentile among all developers.

## Use it

- Profile: `https://github-ranked.vercel.app/YOUR_USERNAME`
- Badge: `https://github-ranked.vercel.app/api/rank/YOUR_USERNAME`
- Full evidence JSON: `https://github-ranked.vercel.app/api/assessment/YOUR_USERNAME`
- Formula and limitations: `/methodology`

```markdown
![Public contribution rating](https://github-ranked.vercel.app/api/rank/YOUR_USERNAME)
```

Existing badge URLs continue to work, but now display the version 2 public contribution index rather than the old Elo-like estimate. A new cache namespace prevents mixing versions. Historical v1 code is retained for regression reference and is not publicly routed.

### Parameters

| Parameter | Default | Meaning                                                                             |
| --------- | ------- | ----------------------------------------------------------------------------------- |
| theme     | default | SVG colors: default, dark, light, minimal, cyberpunk, ocean, forest, sunset, galaxy |
| season    | recent  | Calendar year from 2010 through the current UTC year                                |
| force     | false   | Bypass stored snapshot cache                                                        |

Without a season, the window begins on the first day of the month eleven months before the current UTC month and ends at collection time. Historical scores do not change merely because a new year begins. Reviewed achievements do not automatically decay.

## Algorithm

The [full algorithm, rubric, and validation protocol](ALGORITHM.md) are part of the repository.

The contribution index caps delivery observations at three distinct days per month across all repositories. Verified merged PRs and GitHub-eligible commit days are combined, so splitting work into many commits or PRs on the same day does not add points. Review participation is capped at one observation per other PR author per month, and three per month overall.

```text
D = sum of monthly capped delivery days
R = sum of monthly capped distinct PR authors reviewed
M = months containing public evidence

Contribution index = 80 × (1 − exp(−max(D, R) / 12)) + 20 × min(M / 6, 1)
```

Delivery and review are alternative tracks, accommodating solo contributors and review specialists. At least three observed months and six capped observations on either track are needed. Sparse or incomplete collections receive **Unrated**, not a low-skill label. Each ten-point band maps to the familiar Iron–Challenger tiers. These are product-defined contribution bands, **not empirical population percentiles**.

Stars, followers, raw commit totals, lines changed, and number of repositories earn no additional points. Opened PRs are not called merged PRs; opened issues are not called resolved issues.

### Engineering quality

Correctness, judgment, ownership, collaboration, and impact are assessed from concrete work samples using a published 0–4 rubric. Each dimension needs at least three distinct artifacts, each assessed by two independent reviewers. Material disagreement withholds the affected dimension. Missing dimensions remain null. Only a complete five-dimension assessment produces an overall geometric-mean rubric score.

Reviews live in `data/work-reviews.json`, are curated through normal maintainer review, and cite evidence and explanations. The file starts empty intentionally: there are no invented assessments or automatic claims of skill. There is no public write endpoint. See [the review process](ALGORITHM.md#review-process) before adding entries.

## Local setup

Node.js 20.9+ and a GitHub personal access token are required. Upstash Redis is optional but strongly recommended to avoid repeated GitHub requests.

```bash
npm ci
cp .env.local.example .env.local
# Set credentials in .env.local
npm run dev
```

| Variable                 | Required | Purpose                                                   |
| ------------------------ | -------- | --------------------------------------------------------- |
| GITHUB_TOKEN_1           | Yes      | GitHub PAT; existing project configuration uses read:user |
| GITHUB_TOKEN_2, etc.     | No       | Additional tokens, consecutively numbered                 |
| UPSTASH_REDIS_REST_URL   | No       | Upstash REST endpoint                                     |
| UPSTASH_REDIS_REST_TOKEN | No       | Matching read/write REST token                            |

Private repositories are filtered even if the server credential can access them. Tokens never belong in `NEXT_PUBLIC_*` variables or source control.

## Tests and build

```bash
npm run test:coverage -- --run
npm run lint
npm run format:check
npm run type-check
npm run build
```

The v2 tests exercise adversarial activity, input-order invariance, missing evidence, privacy filters, pagination limits, caching, API errors, rubric disagreement, and alternative working styles. Existing live GitHub integration tests require `GITHUB_TOKEN_1`; without it they are skipped. Automated tests establish implementation behavior, not empirical validity of a skill model.

## Deployment and troubleshooting

The app requires server execution; GitHub Pages alone cannot host its routes. Vercel can deploy it as a Next.js application. The cold evidence scan issues 12 monthly requests plus up to four merged-PR search pages; results are cached for one hour, with up to three monthly requests in flight. Monthly collection limits withhold a rank instead of pretending the data is complete. In-process coalescing reduces duplicate requests; distributed abuse protection is still a hosting concern.

If badges return HTTP 502 with an upstream 401, replace invalid `GITHUB_TOKEN_*` credentials under the Vercel project's **Settings → Environment Variables → Production**, then redeploy. A passing build does not validate production credentials. Check any Redis authentication error separately against the database's matching REST URL/token.

After deploying, verify the profile, badge, and JSON endpoint for a known username. Confirm the badge says public contributions and has an algorithm version; inspect collection limitations before interpreting the result.

## License

MIT
