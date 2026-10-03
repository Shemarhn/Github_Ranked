# Evidence assessment algorithm 2.0.0

## Purpose and epistemic limits

This version implements a public contribution index and a separate, explicitly reviewed engineering-quality rubric. It does not infer intelligence, employability, or overall developer ability from GitHub metadata. It does not advertise calibrated percentiles or statistical confidence intervals. Its weights, thresholds, and evidence requirements are provisional policy choices, not learned facts.

The SPACE research warns against equating activity with developer productivity: https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/

GitHub field meanings and visibility limits: https://docs.github.com/en/graphql/reference/users

## Automatic contribution index

1. Collect eligible public commit contribution days and public review contributions for each UTC month in the window.
2. Search actual merged PRs by author and merge date. Check returned author, visibility, fork status, and timestamp.
3. Exclude private repositories, fork repositories, self-reviews, reviews of bot-authored PRs, and pending/dismissed reviews. Fork contributions merged into an upstream non-fork repository can count there. Excluding fork-only work is a known coverage limitation, not a judgment about its quality.
4. Deduplicate GitHub event identities. Review observations count each reviewed PR once over the entire window. Canonical timestamp ordering makes repeated input order irrelevant.
5. D is the sum of min(3, distinct delivery dates) for each month. Delivery dates include merged PRs and eligible commit contribution days, with no extra credit for their overlap.
6. R is the sum of min(3, distinct other PR authors reviewed) for each month. This caps any one counterpart at one monthly unit.
7. M is the number of months containing eligible public events.
8. If collection is incomplete, M < 3, or max(D,R) < 6: score = null, tier = Unrated.
9. Otherwise:

```text
S = round_to_0.1(80 * (1 - exp(-max(D,R)/12)) + 20 * min(M/6,1))
```

The better of the delivery and review tracks avoids requiring a solo contributor to manufacture collaboration or a review specialist to manufacture commits. The exponential curve has diminishing marginal returns. The monthly cap limits bursts; continuity saturates after six observed months, with no streak requirement. Neither activity track may be interpreted as work quality.

Tier bands [0,10), [10,20), ... [90,100] correspond to Iron through Challenger. Because the evidence threshold withholds sparse results, some lower bands are not normally reachable. Keeping familiar names is presentation continuity, not continuity of the old scale. V1 scores and v2 scores are not comparable.

### Rationale and residual gaming

The 80/20 split makes the chosen contribution track dominant while bounding the effect of observation duration. The scale 12 and monthly cap three keep another busy day from producing unlimited gains. These are inspectable starting assumptions that must be evaluated, not scientific findings.

A two-account review loop cannot earn more than one review unit per month. Many cooperating accounts cannot earn more than three per month. Repeated counterpart share is disclosed, never used as proof of dishonesty. Existing colleagues and small teams naturally interact repeatedly.

A person can still farm distinct activity days across months. Metadata cannot distinguish every empty change from a useful one. This remaining vulnerability is why the badge is explicitly a contribution index and cannot populate the quality profile. No star counts, followers, lines, repository prestige, account age, language count, or contribution streaks enter the formula.

### Collection completeness and cost

The recent window covers the current UTC month and eleven previous months, ending at collection time. Historical windows cover a requested calendar year, clipped at now.

Each monthly query reads at most 100 repositories, three commit contribution days per repository, and 100 reviewed-PR contributions. Three days per repository are sufficient for the global monthly delivery cap: either some repository reaches three distinct dates (saturating the cap), or every repository's available dates are read. The displayed event list is bounded evidence for scoring, not a complete GitHub activity export.

More than 100 commit repositories or additional review pages mark the snapshot incomplete. Merged-PR search follows up to four pages of 50; remaining pages also mark it incomplete. GitHub search indexing can lag and is not a transactional snapshot. API failures are errors, not empty profiles. Large profiles may be Unrated until a future background collection pipeline supports them.

Public data is filtered before storage or display, even if the host token can access private repositories. No private identifiers or private totals are exposed. Missing public contributions may reflect work elsewhere, attribution settings, or unavailable private work; they do not establish poor performance.

Redis stores public snapshots in an algorithm-versioned namespace for one hour. Scores are recomputed with the deployed rubric reviews. Badge and dashboard share the service. No cross-version cache reuse is possible. Invalid, stale, or mismatched cached snapshots are ignored. Incomplete snapshots and errors are not cached by the service.

## Reviewed engineering quality

Five dimensions are deliberately separated from metadata:

| Dimension     | Evidence to inspect                                                                  | Inference to avoid                                                |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Correctness   | Requirements, implementation, meaningful tests, failure cases, verified bug fixes    | Green CI or test-file presence proves correctness                 |
| Judgment      | Tradeoffs, constraints, simplicity, maintainability, design rationale                | Large diffs or complex architecture prove sophistication          |
| Ownership     | Delivered outcomes, follow-through, maintenance, appropriate handover                | Frequent activity or permanent availability proves responsibility |
| Collaboration | Concrete review improvements, explanations, coordination, mentoring outcomes         | Approval count or verbose comments prove helpfulness              |
| Impact        | Demonstrated problem resolution, retained utility, adoption attributable to the work | Popularity or team success is wholly attributable to one person   |

### Anchored 0–4 rubric

The same scale applies within each dimension, interpreted through the dimension's evidence above:

- **0 — demonstrated serious shortfall:** the sampled artifact has a material, unresolved failure in this dimension, supported by evidence. Never use 0 for missing information.
- **1 — limited demonstration:** some relevant work is present, but a substantial documented gap remains.
- **2 — adequate for the stated context:** meets the relevant requirements and constraints with defensible execution.
- **3 — strong demonstration:** handles meaningful edge cases or tradeoffs and provides evidence of a beneficial result.
- **4 — exceptional demonstration within context:** a clearly substantiated, unusually strong result with transferable reasoning; does not require a famous employer, large project, or popular repository.

A reviewer must identify the context, cite the artifact, explain the dimension-specific judgment, and distinguish observed outcomes from assumptions. Documentation, research software, tiny critical fixes, and solo projects are eligible. A lack of public collaboration should remain unassessed if no suitable samples exist.

### Aggregation

For each artifact/dimension, average distinct reviewers' 0–4 scores. An artifact qualifies only with at least two independent reviewers. Give each qualifying artifact equal weight, regardless of review count.

Require at least three qualifying artifacts per dimension. If any double-reviewed artifact has a reviewer score range greater than one, withhold the entire dimension pending a documented resolution. A third vote must not silently average away disagreement.

```text
dimension score = 25 * mean(artifact reviewer means)
overall quality = 100 * geometric_mean(five dimension scores / 100)
```

Round public scores to one decimal. All five dimensions must qualify before publishing the overall score. Null is not zero and weights are not redistributed around missing dimensions. A substantiated zero dimension produces zero overall; do not confuse this with an unknown dimension.

Equal dimension weights are a declared normative choice. The geometric mean reduces compensation between weaknesses and strengths. This is a descriptive assessment of the reviewed portfolio, not a calibrated prediction of job performance. Review dates and sample counts remain visible; old quality evidence is not automatically decayed.

## Review process

`data/work-reviews.json` contains maintainer-curated records. It begins empty. No automated LLM evaluation, fabricated reviews, or public rating submissions are enabled.

1. Assemble a documented pool of the contributor's work. Include representative randomly selected samples and contributor-selected examples; record the selection process in the review rationale. Avoid sampling only popular projects or only a developer's best work.
2. Have two reviewers with relevant domain knowledge inspect each artifact independently, ideally before seeing the other's score. Reviewers must disclose conflicts; maintainer verification of identity and independence is required. Different usernames alone do not establish independence.
3. Use a stable artifact identifier for a single underlying change or outcome. Mirrors, cherry-picks, commits split from the same change, and multiple URLs to the same artifact are one sample. Maintainers must enforce this semantic identity; automatic metadata deduplication cannot prove it.
4. Record one assessment per username/artifact/dimension/reviewer. Scores are integers 0–4. Include a public GitHub evidence link, substantive rationale, and UTC review timestamp.
5. Submit records through a reviewed repository change. Self-reviews, duplicate reviewer entries (case-insensitive), unsafe URLs, invalid scores, and future dates are rejected. The public service only reads this deployed file.
6. Resolve material disagreement through additional investigation and a visible correction, not by adding favorable votes. Contributors may contest factual mistakes using evidence. Preserve discussion and change history.
7. Reassess or withdraw records when their supporting evidence is invalidated. Do not infer loss of capability merely from inactivity.

Example record shape (illustrative only; do not publish as a real review):

```json
{
  "username": "developer",
  "artifact": "owner/repository:pull:123",
  "dimension": "correctness",
  "reviewer": "independent-reviewer",
  "score": 2,
  "evidenceUrl": "https://github.com/owner/repository/pull/123",
  "rationale": "Describe the requirements, inspected behavior, evidence, sampling context, and remaining limits.",
  "reviewedAt": "2026-10-02T12:00:00.000Z"
}
```

Every record is public once committed. Do not put confidential work or sensitive review details in this file. Supporting private assessments requires a separate authenticated consent and access-control system; it is not implemented here.

## Validation before stronger claims

Implemented tests verify algorithmic invariants, exact arithmetic, spoofed/duplicate activity, counterpart caps, solo/review track equivalence, incomplete data, privacy filtering, API recovery, caching, and rubric gates. These are synthetic tests; they do not establish empirical skill validity.

Before presenting scores as reliable ability estimates:

- Recruit a consented benchmark spanning solo maintainers, team contributors, newcomers, documentation specialists, research developers, and people with substantial private work.
- Have multiple domain-appropriate reviewers assess representative artifacts while blinded to stars and existing rank.
- Measure inter-rater agreement, disagreement rates, missing-evidence rates, and group-specific coverage.
- Split calibration and evaluation by contributor and repository, with a temporal holdout to reduce leakage. Keep related changes together.
- Test rank/score sensitivity to weights, caps, sampling selection, role, language ecosystem, and project size. Publish failures and uncertainty, not just aggregate correlation.
- Include controlled gaming cases and check that claims remain bounded by the available evidence.
- Version any changed formula, publish calibration data provenance where consent allows, and retain the prior version's interpretation.

No benchmark has been collected or validated as part of this implementation. Statistical confidence, a universal skill percentile, Sybil-proof identity, and objective overall ability claims remain unsupported.
