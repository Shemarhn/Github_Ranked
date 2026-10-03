# Badge algorithm v4

GitHub Ranked is a game for profile badges. Every valid public user gets a tier,
including Iron IV for an inactive profile. There is no assessment gate, manual
review, or “unrated” state. These points describe visible activity, not overall
engineering ability.

## Public contribution points

For each contribution year, inspect the latest 100 PR contributions, 100 review
contributions and 100 issue contributions, plus commits across up to 100
repositories (up to 100 daily commit buckets per repository). These are bounded observations, not extrapolated lifetime totals.
The dashboard flags histories that reach these limits. A PR is assigned to the
year it was opened; its current merged state determines eligibility. Issues use
their opening year and current closed state. Reviews use their contribution year.

- Count only public, merged PRs; deduplicate by PR ID.
- Count submitted, non-dismissed reviews of other human authors' PRs, once per
  PR per year. A review need not approve or lead to a merge to count.
- Count closed issues authored by the profile, once per issue. This does not
  claim that the author fixed the issue.
- Private repositories and hidden contribution totals earn no points.
- Stars come from the top 100 public, non-fork repositories owned by the user.
  Followers do not affect the score.

For PRs and reviews, group separately by repository owner and interaction partner
(merger for PRs, PR author for reviews). Within each group, the first ten items
count fully; thereafter credit is `10 + sqrt(count - 10)`. Use the **smaller** of
the owner-group total and partner-group total. Thus 100 PRs merged by one partner
earn about 19.49 units, even when split across repositories. Missing merger
identities fall back to the repository owner. This reduces rewards for repeated
pair farming without declaring small teams fraudulent. Self-merged PRs still
count; independent maintainers remain eligible.

Closed issues use the same owner grouping. Commits use owner grouping with a
threshold of 100: `100 + sqrt(count - 100)` thereafter. Splitting commits among
repositories owned by the same account does not increase credit.

Apply the existing seasonal multipliers to these units: 1, 0.6, 0.35, 0.2 and
0.1 for current, previous, two-year-old, three-year-old and older contributions.
Round each year's adjusted units, then sum. A single-season badge skips decay.
Decay is a game rule for recent activity, not a claim that old software loses value.

Each metric then contributes `multiplier × scale × ln(1 + units / scale)`:

| Metric                       | Multiplier | Scale |              Additional cap |
| ---------------------------- | ---------: | ----: | --------------------------: |
| Merged PR credit             |         35 |    50 | Bounded yearly observations |
| Review credit                |         35 |    50 | Bounded yearly observations |
| Closed authored issue credit |         15 |    30 | Bounded yearly observations |
| Commit credit                |         10 |   200 |                10,000 units |
| Stars                        |          5 |   100 |                 1,000 stars |

Round each component to two decimals, sum, and floor the score at 1 for an empty
profile. These are adjustable game multipliers, not empirically validated
percentages of developer skill. Diminishing returns reduce the value of volume
without adding an eligibility requirement.

## Population percentiles and tiers

Every successful badge/dashboard lookup and sampling run inserts its score into
Redis. Each GitHub account ID has one entry per season, independent of themes,
repeat requests, case, or username changes. Failed or partial GitHub fetches do
not publish scores. Old algorithm caches use separate keys and cannot mix with v4.

Scores expire from the comparison population after 30 days without a fresh
GitHub observation. Reading a cached badge does not refresh the observation date.
Insertion, expiry and counting happen in one atomic Redis operation. All-time
and individual seasons have separate populations.

`percentile = 100 × number of profiles with a strictly lower score / population size`

Ties receive equal percentiles. Zero-score ties sit at the bottom; a one-account
population starts at percentile zero. Percentiles are not rounded before tier
placement. Rating is linearly interpolated within the percentile/rating bands
in the README, then floored. Challenger starts at the 99.9th percentile.

The displayed population is **cached observed profiles**, including background
samples; it is not a census of all GitHub accounts. Visitor selection, finite
sample size and 30-day turnover affect rankings. Adding profiles can change a
rank even if its own contributions do not change. Badges may lag for their cache
duration. The dashboard displays the population size.

If Redis is unavailable, retain a score-based game tier using the original
fixed curve `rating = max(0, round(1200 + 400 × (ln(score) - 6.5) / 1.5))`.
Hide the curve-derived percentile and label the comparison unavailable. This
fallback never claims to be a measured global percentile and never says unrated.

## Background sampling

`GET /api/population` is protected by `Authorization: Bearer CRON_SECRET` and
scheduled daily by Vercel at 05:17 UTC. It draws up to 20 random numeric account
IDs and scores up to five distinct public human accounts. The upper bound is
refreshed from GitHub's newest-user search. `/users?since=id-1&per_page=1` is accepted
only when its first result has **exactly** the drawn ID: gaps, deleted accounts
and organizations are skipped rather than transferring their probability to the
next account. Inactive users are included. This reaches outside badge visitors
without sorting candidates by stars, followers or activity.

The discovered ID bound depends on search freshness; this is a bounded public
sample, not proof of complete GitHub coverage. A small daily batch starts the
population modestly. Authorized manual runs can grow it; GitHub rate limits and
Redis costs still apply. A lock prevents overlapping jobs. Each successful
profile is cached immediately, so a later failure does not discard prior work.
The job also populates the current season; older seasons grow through lookups.

Set `CRON_SECRET` to a random server-side secret in Vercel and redeploy to enable
the job. Keep the existing GitHub and Upstash credentials configured. Without
the secret the sampling endpoint rejects requests; normal profile lookups still
build the population. Inspect cron responses/logs for `sampled` and `cached` counts.

## Limits of abuse resistance

This dampens volume, duplicate reviews, owner splitting and repeated partners.
It does not inspect code quality or prove collusion, and it cannot reliably
identify coordinated accounts owned by one person. Multiple owners/partners,
star purchases, and adding many low-score accounts to the visitor population
remain possible attacks. The comparison pool includes visitors as requested,
so its combined distribution is not a statistically representative global
survey. A large trusted sampling-only reference could mitigate that separately.
Bounded observations can undercount prolific contributors; focused solo work
can receive less game credit than broad collaboration. No private work is inferred.
