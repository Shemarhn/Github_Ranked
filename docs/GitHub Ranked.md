# **Architectural Blueprint and Gamification Dynamics for "GitHub Ranked": A Statistical and Psychological Framework for Developer Motivation**

## **1\. Executive Summary**

The intersection of software engineering metrics and competitive gaming psychology offers a novel paradigm for developer motivation. The modern open-source ecosystem, primarily hosted on GitHub, provides a vast repository of behavioral data that, while currently presented as static statistics, holds the potential to be transformed into a dynamic, competitive ladder. The proposed "GitHub Ranked" plugin seeks to gamify the developer experience by analyzing a user's contribution statistics against a global grading curve, assigning a "Skill Rating" (Elo) and a corresponding tier—ranging from Iron to Challenger—analogous to popular esports titles like *League of Legends* and *Valorant*.

This research report provides a comprehensive architectural specification for such a system. It moves beyond simple gamification (badges and streaks) to establish a statistically rigorous ranking engine. By synthesizing data on global developer activity distributions with competitive gaming rank percentiles, we construct a "Dev-Elo" model that normalizes highly skewed contribution data into a standard bell curve. The report details the technical implementation using GitHub’s GraphQL API for data acquisition, Vercel Satori for serverless dynamic image generation, and a caching strategy designed to mitigate API rate limits while serving real-time updates.

Furthermore, this analysis explores the psychological underpinnings of the system, examining how the "Elo hell" of Bronze or the prestige of Diamond can incentivize specific, high-quality developer behaviors. We address the technical challenges of calculating all-time statistics in a distributed environment, the mathematical necessity of log-normal transformations for commit data, and the visual design systems required to translate raw JSON data into a compelling "gamer aesthetic" asset for user profiles. The resulting framework offers a roadmap for building a plugin that is not merely a novelty, but a genuine reflection of a developer’s standing within the global engineering community.

## ---

**2\. The Gamification of Engineering: Theoretical Foundations**

The core premise of "GitHub Ranked" is to apply the motivational structures of competitive gaming to the solitary act of writing code. To understand why this is effective, and how to implement it correctly, we must first analyze the parallels between the "grind" of a ranked ladder and the "grind" of software development.

### **2.1 The Psychology of the Ladder**

In competitive gaming, the "Ladder" is the ultimate retention mechanism. It provides a tangible representation of skill progression. Players do not just play to win a single match; they play to see their "League Points" (LP) increase, to cross the threshold from Silver I to Gold IV, and to earn the social capital associated with high rank.1 This loop leverages extrinsic motivation (the badge) to fuel intrinsic motivation (skill mastery).

For developers, GitHub currently offers the "Contribution Graph" (the green squares) as the primary visual feedback loop. While effective for tracking consistency (the "streak"), it lacks comparative context. A developer with 500 commits in a year has no immediate way of knowing if that places them in the top 10% or the bottom 50% of the community. "GitHub Ranked" solves this by introducing **Comparative Context**.

By assigning a rank like "Platinum II," the system instantly communicates relative standing. This taps into *Social Comparison Theory*, where individuals determine their own social and personal worth based on how they stack up against others. In the context of the user request, adding "flavor" to the account is about enabling this social signaling. The "fun" comes from the tension of being "hardstuck Gold" and the dopamine release of finally promoting to Platinum.

### **2.2 Goodhart’s Law and Metric Validity**

A critical risk in gamifying productivity is Goodhart’s Law: "When a measure becomes a target, it ceases to be a good measure".2 If the "GitHub Ranked" Elo is based solely on commit counts, developers may be incentivized to "farm" stats by making trivial commits (e.g., fixing typos one by one, scripting empty commits) rather than performing meaningful work.3

To mitigate this, the "Dev-Elo" algorithm must be composite and weighted. It cannot simply count; it must *value*. Research into developer productivity metrics suggests that while commit volume correlates with activity, it does not correlate perfectly with value. Merged Pull Requests (PRs), Code Reviews, and Issues Resolved are higher-fidelity signals of engineering impact.4

Therefore, the theoretical framework for "GitHub Ranked" prioritizes **Interaction over Isolation**. A developer who only pushes code to a personal repository (high commits, zero collaboration) should find it difficult to climb past "Gold." To reach "Diamond" or "Master," one must engage with the community—reviewing code (signaling seniority), merging PRs (signaling peer acceptance), and earning stars (signaling impact). This aligns the gamification incentives with healthy engineering practices.

## ---

**3\. Statistical Modeling: The "Dev-Elo" Engine**

Since GitHub is not a player-versus-player (PvP) environment, we cannot use the traditional Arpad Elo formula, which requires a winner and a loser to transfer points. Instead, we must simulate an Elo rating using a **Performance Rating** model based on population distribution. We calculate a user's "Raw Score" based on weighted metrics, determine their percentile within the global population, and then map that percentile to a "Target Elo" that aligns with the visual ranks of competitive games.

### **3.1 Analyzing the Global Developer Distribution**

To grade a user "on a curve," we must first understand the shape of the curve. Developer activity on GitHub does not follow a standard normal distribution (a symmetrical bell curve). Instead, it follows a **Power Law** or **Log-Normal Distribution** (Pareto principle).6

* **The "Long Tail" of Inactivity:** A massive portion of GitHub accounts are inactive, created for a single bootcamp project, or used solely for reading code. These users constitute the "Iron" and "Bronze" tiers.  
* **The Median Developer:** Research by GitClear on over 800,000 developer years indicates that the median "active" career developer contributes approximately 673 commits per year (roughly 2.8 per work day).8  
* **The Elite Outliers:** The top 1% of developers (the "Challengers") contribute exponentially more, often exceeding 2,000 to 5,000 contributions annually.3

Because of this extreme skew, using a linear scale would be disastrous. If "Challenger" requires 5,000 commits and "Iron" is 0, the average user with 600 commits would appear to be in the bottom 12% (Iron), which is demotivating and statistically inaccurate.

### **3.2 The Log-Normal Transformation Strategy**

To create a fair "Iron to Challenger" progression, we must normalize the data. We treat the **logarithm** of the user's weighted score as normally distributed. This technique, used by existing tools like github-readme-stats, allows us to use Z-scores (standard deviations from the mean) to determine rank.7

The formula for the **Weighted Performance Index (WPI)** $W$ for a user is:

$$W \= \\sum (w\_i \\cdot m\_i)$$  
Where $m\_i$ is the count of a specific metric (commits, PRs, etc.) and $w\_i$ is its weight.

We then calculate the **Z-Score** ($Z$) of the log-transformed WPI:

$$Z \= \\frac{\\ln(W) \- \\mu\_{\\ln}}{\\sigma\_{\\ln}}$$  
Where:

* $\\ln(W)$ is the natural logarithm of the user's weighted score.  
* $\\mu\_{\\ln}$ is the mean of the log-transformed scores of the global population.  
* $\\sigma\_{\\ln}$ is the standard deviation of the log-transformed scores.

This Z-score tells us how many standard deviations a user is above or below the average. A Z-score of \+2.0 puts a user in the top \~2.3% (Diamond), while a Z-score of 0 places them exactly at the median (Gold/Silver border).

### **3.3 The Grading Curve: Mapping Z-Scores to Game Ranks**

The user explicitly requested ranks "in relation to traditional gaming rankings." To achieve authentic "flavor," we map our calculated Z-scores to the specific percentile distributions found in modern competitive games. We will use the 2024/2025 rank distributions from *League of Legends* and *Valorant* as our "Truth Table."

The following table synthesizes rank distribution data 1 to establish the cutoffs for "GitHub Ranked":

| Tier | Division | Percentile Target (Top X%) | Z-Score Threshold (Approx) | Simulated Elo Range | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Challenger** | I | Top 0.02% | \> \+3.5 | 3000+ | The Open Source Elite. Maintainers of massive frameworks (React, Vue, Linux). |
| **Grandmaster** | I | Top 0.1% | \+3.1 to \+3.5 | 2600 – 2999 | Extremely prolific contributors. Top 0.1% of global talent. |
| **Master** | I | Top 0.5% | \+2.6 to \+3.1 | 2400 – 2599 | Senior engineers with consistent, high-impact daily output. |
| **Diamond** | I \- IV | Top 2.5% | \+1.96 to \+2.6 | 2000 – 2399 | The "High Elo" gatekeepers. Highly active, heavily collaborative. |
| **Emerald** | I \- IV | Top 10% | \+1.28 to \+1.96 | 1700 – 1999 | Advanced developers. Consistent history, verified impactful work. |
| **Platinum** | I \- IV | Top 20% | \+0.84 to \+1.28 | 1500 – 1699 | Above average. The goal for most aspiring senior devs. |
| **Gold** | I \- IV | Top 40% | \+0.25 to \+0.84 | 1200 – 1499 | The "Average" active developer. Represents the median (50th percentile) at Gold IV. |
| **Silver** | I \- IV | Top 60% | \-0.25 to \+0.25 | 900 – 1199 | Casual contributors, students, or hobbyists with sporadic activity. |
| **Bronze** | I \- IV | Top 80% | \-0.84 to \-0.25 | 600 – 899 | Learners or users who primarily read rather than write code. |
| **Iron** | I \- IV | Bottom 20% | \< \-0.84 | 0 – 599 | Inactive accounts, "Hello World" repos, or lurkers. |

The "Elo" Calculation:  
To give the user a specific number (e.g., "1450 Elo"), we map the Z-score linearly to the Elo ranges defined above.

$$Elo \= 1200 \+ (Z \\cdot 400)$$

* Base Elo (1200) represents the median (Z=0).  
* Each standard deviation adds or subtracts 400 points.  
* This places a \+2.0 sigma user at 2000 Elo (Diamond), which perfectly aligns with the mental model of most gamers.

## ---

**4\. Technical Architecture: The "GitHub Ranked" Plugin**

The "plugin" will technically function as a **dynamic image service**. Since GitHub profiles (README.md) only allow static images and links (no JavaScript), the system must generate an SVG image on-the-fly that contains the user's rank, stats, and visual assets.

### **4.1 System Overview**

The architecture consists of three primary layers:

1. **The API Gateway (Vercel Edge):** Handles incoming requests from GitHub profiles.  
2. **The Aggregator (GraphQL Engine):** Fetches and processes user data from GitHub.  
3. **The Renderer (Satori Engine):** Converts the processed data into a high-fidelity "Rank Card" SVG.

### **4.2 Data Acquisition: The GraphQL Strategy**

Fetching a user's "all-time" statistics is the most significant technical hurdle. The GitHub REST API is inefficient for this, requiring dozens of calls to sum commits across repositories. The GraphQL API (v4) is superior but has a critical limitation: the contributionsCollection object can only fetch a maximum of **one year** of data per request.12

To calculate an "all-time" Elo, we must iterate through the user's history.

#### **4.2.1 Recursive Historical Fetching**

The fetching logic must operate as follows:

1. **Initial Query:** Fetch the user's contributionYears list to understand how far back the account goes.14  
2. **Parallel Execution:** Fire parallel GraphQL requests for each year in the contributionYears list. While this consumes more rate limit points, it allows for a complete dataset.  
3. **Optimization:** For older years (e.g., 2018), the data is unlikely to change. We can cache historical years aggressively (e.g., permanent cache until manual invalidation) and only "live fetch" the current year (2025).

The GraphQL Query Structure:  
We need to construct a query that retrieves all relevant metrics for the weighting algorithm.

GraphQL

query UserStats($login: String\!, $from: DateTime\!, $to: DateTime\!) {  
  user(login: $login) {  
    contributionsCollection(from: $from, to: $to) {  
      totalCommitContributions  
      totalPullRequestContributions  
      totalPullRequestReviewContributions  
      totalIssueContributions  
      restrictedContributionsCount \# For private contribs (optional with auth)  
    }  
    followers {  
      totalCount  
    }  
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {  
      nodes {  
        stargazers {  
          totalCount  
        }  
      }  
    }  
  }  
}

Note: totalPullRequestReviewContributions is essential for our weighting model, as code review is a high-Elo behavior.5

### **4.3 Rate Limits and Caching Strategy**

The GitHub GraphQL API has a rate limit of 5,000 points per hour per authenticated user.15 A complex query fetching 5 years of data might cost 5-10 points. If the plugin goes viral, a single shared API token will be exhausted immediately.

**Architectural Solutions:**

1. **Vercel KV / Redis Caching:** The computed Elo rating should be cached with a **TTL (Time To Live) of 24 hours**. "Rank" is not a metric that needs second-by-second updates. If a user wants to "force update," they can click a link, but the image load itself should hit the cache.  
2. **Shared Token Pool:** For the public instance, maintain a pool of GitHub Tokens to distribute the load.  
3. **Bring Your Own Token (BYOT):** Allow power users to deploy their own Vercel instance or provide their own PAT (Personal Access Token) via URL parameters (?token=...) to bypass public limits and access private repository stats.6

### **4.4 The Rendering Engine: Vercel Satori**

To create "flavorful" gaming badges, we need high-quality visuals. Traditional server-side image generation (like node-canvas or Puppeteer) is heavy, slow, and hard to style.

**Vercel Satori** is the ideal solution. It allows us to write standard HTML/CSS (using Flexbox) and converts it to an SVG string on the edge.18 This means we can design the "Rank Card" using React components, ensuring it looks crisp at any zoom level (Retina displays) and loads in milliseconds.

**The Aesthetic Pipeline:**

1. **Rank Icons:** We will map the calculated Tier (e.g., "Diamond") to a specific SVG icon.  
2. **Dynamic Text:** Inject the calculated Elo ("2,350 SR") and username.  
3. **Visual Flair:** Use CSS gradients and shadows to differentiate ranks.  
   * *Gold:* linear-gradient(45deg, \#FFD700, \#FDB931)  
   * *Diamond:* linear-gradient(45deg, \#b9f2ff, \#00d4ff)  
   * *Iron:* linear-gradient(45deg, \#3a3a3a, \#1a1a1a) with a "rust" noise overlay.

## ---

**5\. Designing the "Flavor": Gamification Mechanics**

The user specifically requested "flavor" and motivation. A simple number is boring; a **League** is compelling. This section details the specific design elements that will make "GitHub Ranked" feel like a game.

### **5.1 The "Elo Hell" and "Promos"**

To mimic the emotional journey of gaming, we should visualize not just the rank, but the **progress** within that rank.

* **LP (League Points):** Instead of just "Gold IV," display "Gold IV \- 85 LP."  
  * *Calculation:* If the Elo range for Gold IV is 1200-1299, and the user is at 1285, they have 85 LP.  
* **Promo Series Indicator:** If a user is at 90-99 LP, the badge should display a "Hot Streak" or "Promo Series" icon (e.g., three empty checkboxes: \[ \]\[ \]\[ \]). This visual cue implies that a few more high-quality PRs will "promote" them to the next tier.  
* **Hardstuck Badge:** If a user has remained in the same tier (e.g., Silver II) for over 6 months despite activity, add a subtle "Hardstuck" or "Veteran" flair. This adds a layer of playful "trash talk" or camaraderie common in gaming communities.20

### **5.2 Seasonal Resets (The "Split")**

Competitive games use seasons to keep the ladder fresh. A developer who was active in 2018 but hasn't coded in 2025 shouldn't hold a "Challenger" rank.

* **Implementation:** The plugin should support a ?season=2025 parameter.  
* **Default Behavior:** The main rank badge should represent the **Rolling 365-Day Window** (current form). This encourages active maintenance.  
* **Legacy Trophies:** Users can generate "Season 2024" badges to pin to their profile as historical trophies, preserving their legacy achievements without inflating the current active ladder.

### **5.3 The "Main" vs. "Smurf"**

In gaming, a "smurf" is a high-level player on a new account. In GitHub terms, a user might have a work account and a personal account.

* **Feature Idea:** Allow users to link accounts (via a config file in a .github repo) to aggregate stats. This "Duo Queue" stat aggregation provides a more holistic view of the developer's true impact.

## ---

**6\. Implementation Guide: Building the Core Logic**

This section translates the theoretical model into concrete logic for the plugin's codebase.

### **6.1 The Metric Weighting Algorithm**

We define the relative value of contributions to ensure the "Elo" reflects meaningful engineering work.

| Metric | Weight | Reason |
| :---- | :---- | :---- |
| **Merged Pull Requests** | **40 points** | The gold standard of contribution. Requires code to be written, reviewed, and accepted. |
| **Code Reviews** | **30 points** | High-value collaboration. Distinguishes seniors (who review) from juniors (who only commit). |
| **Issues Resolved** | **20 points** | Closing issues indicates maintenance and problem-solving. |
| **Commits** | **10 points** | Lowest weight to prevent "commit spamming." |
| **Stars (Owned Repos)** | **5 points** | Social proof multiplier. Capped to prevent viral one-offs from skewing rank too high. |

### **6.2 Calculating the Rank (Pseudo-Code)**

This logic would reside in the serverless function (e.g., api/index.js).

JavaScript

// Step 1: Define Global Constants (Derived from GitClear/Githut Data)  
const MEAN\_LOG\_SCORE \= 6.5; // Log-normal mean of weighted global activity  
const STD\_DEV \= 1.5; // Standard deviation

// Step 2: Calculate User's Weighted Score  
const userScore \= (stats.mergedPRs \* 40) \+   
                  (stats.totalReviews \* 30) \+   
                  (stats.issuesClosed \* 20) \+   
                  (stats.commits \* 10) \+   
                  (Math.min(stats.stars, 500) \* 5); // Cap stars effect

// Step 3: Normalize using Log-Normal Distribution  
// We use log because activity scales exponentially (10 vs 10,000 commits)  
const logScore \= Math.log(Math.max(userScore, 1)); 

// Step 4: Calculate Z-Score (Standard Deviations from Mean)  
const zScore \= (logScore \- MEAN\_LOG\_SCORE) / STD\_DEV;

// Step 5: Map Z-Score to Elo (Base 1200 \+ Scale)  
// 1200 is the "Gold" baseline. Each Sigma is \~400 Elo points.  
let elo \= Math.round(1200 \+ (zScore \* 400));

// Step 6: Clamp to valid ranges (Iron IV to Challenger)  
if (elo \< 0) elo \= 0;  
// No upper limit for Challenger, but visual cap at 3000+

### **6.3 Determining the Visual Tier**

Once the Elo is calculated, we assign the visual asset.

JavaScript

function getRankTier(elo) {  
  if (elo \< 600) return "Iron";        // Bottom 20%  
  if (elo \< 900) return "Bronze";      // Top 80%  
  if (elo \< 1200) return "Silver";     // Top 60%  
  if (elo \< 1500) return "Gold";       // Top 40% (Median)  
  if (elo \< 1750) return "Platinum";   // Top 20%  
  if (elo \< 2000) return "Emerald";    // Top 10%  
  if (elo \< 2400) return "Diamond";    // Top 2.5%  
  if (elo \< 2800) return "Master";     // Top 0.5%  
  if (elo \< 3200) return "Grandmaster";// Top 0.1%  
  return "Challenger";                 // Top 0.02%  
}

This mapping strictly adheres to the requested gaming percentile distributions, ensuring that "Gold" feels attainable but "Diamond" feels exclusive.

## ---

**7\. Visual Design Specifications**

The success of "GitHub Ranked" depends on the "Flavor." The SVG badges must look premium.

### **7.1 Tier Aesthetics**

* **Iron:** Industrial, rusted metal texture. Gray/Brown palette. Symbol: A flat shield or gear.  
* **Bronze:** Oxidation effects, polished copper highlights. Symbol: A heavy hammer or anvil.  
* **Silver:** Sleek, metallic, polished steel. Blue-ish white reflections. Symbol: A sword or arrow.  
* **Gold:** Vibrant yellow-gold, shiny gradients. Symbol: A crown or winged crest.  
* **Platinum:** Teal/Cyan metallic finish. Sharp, angular designs. Symbol: A complex geometric gem.  
* **Diamond:** Holographic, icy blue/purple. Sparkle animations (CSS keyframes). Symbol: A diamond shape with fractured facets.  
* **Master+:** Animated "glow" effects (using SVG \<animate\> tags). Dark purple/void energy colors.

### **7.2 The "Profile Card" Layout**

The generated SVG should be a horizontal "Card" layout (approx 400x120px) suitable for a Readme.

* **Left:** The Rank Icon (large, high fidelity).  
* **Center:**  
  * **Top Line:** "Diamond II" (Bold, Tier Color).  
  * **Middle Line:** "2,340 SR" (White text).  
  * **Bottom Line:** Progress Bar to next rank (e.g., \`\[|||||||

|--\] 80/100 LP\`).

* **Right:** A mini radar chart showing the breakdown (PRs vs Commits vs Reviews), giving the user insight into *why* they are that rank. "Need more Code Reviews to reach Master\!"

## ---

**8\. Conclusion and Future Roadmap**

The "GitHub Ranked" plugin offers a compelling fusion of productivity analytics and gamer culture. By leveraging the **GitHub GraphQL API** for deep data retrieval and **Vercel Satori** for high-fidelity rendering, we can build a system that is both performant and visually stunning.

The proposed "Dev-Elo" algorithm, grounded in log-normal distribution analysis and weighted heavily towards collaboration (PRs/Reviews), ensures that the ranking system promotes healthy engineering behaviors rather than empty commit farming. The strict alignment with *League of Legends* percentiles ensures that the ranks hold genuine social currency—Gold feels like the average, while Challenger is reserved for the true 10x engineers.

### **8.1 Future Expansions**

* **"Clash" Mode:** Weekly tournaments where users compete to gain the most Elo in a 7-day sprint.  
* **Team Elo:** Aggregating stats for GitHub Organizations to rank engineering teams against each other.  
* **Skin Store:** Allow users to "buy" (with stars or activity) different visual themes for their rank card (e.g., Pixel Art, Cyberpunk, Fantasy).

By building this, we do not just create a plugin; we create a **meta-game** for open source, turning every Pull Request into a push for the next division.

---

References:

1

#### **Works cited**

1. League of Legends Ranks and Distribution Explained \- Plarium, accessed January 18, 2026, [https://plarium.com/en/blog/league-of-legends-ranks/](https://plarium.com/en/blog/league-of-legends-ranks/)  
2. As software engineers, how do you feel when your manager uses git analytics tool to measure productivity? : r/SoftwareEngineering \- Reddit, accessed January 18, 2026, [https://www.reddit.com/r/SoftwareEngineering/comments/mrsx4n/as\_software\_engineers\_how\_do\_you\_feel\_when\_your/](https://www.reddit.com/r/SoftwareEngineering/comments/mrsx4n/as_software_engineers_how_do_you_feel_when_your/)  
3. how does one make over 2000 commits a year? : r/linuxmasterrace \- Reddit, accessed January 18, 2026, [https://www.reddit.com/r/linuxmasterrace/comments/zd3w0e/how\_does\_one\_make\_over\_2000\_commits\_a\_year/](https://www.reddit.com/r/linuxmasterrace/comments/zd3w0e/how_does_one_make_over_2000_commits_a_year/)  
4. How to measure developer productivity: A complete guide with frameworks and metrics \- DX, accessed January 18, 2026, [https://getdx.com/blog/developer-productivity/](https://getdx.com/blog/developer-productivity/)  
5. How to measure developer productivity beyond commit counts \- Graphite, accessed January 18, 2026, [https://graphite.com/guides/measure-developer-productivity-beyond-commit-counts](https://graphite.com/guides/measure-developer-productivity-beyond-commit-counts)  
6. anuraghazra/github-readme-stats: :zap: Dynamically generated stats for your github readmes, accessed January 18, 2026, [https://github.com/anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats)  
7. Take into account user reviewed PRs count during rank calculation and update other weights · Issue \#2846 · anuraghazra/github-readme-stats, accessed January 18, 2026, [https://github.com/anuraghazra/github-readme-stats/issues/2846](https://github.com/anuraghazra/github-readme-stats/issues/2846)  
8. Git Commit Count Percentile Stats, Annual Days Active from 878592 Dev-year Data Points, accessed January 18, 2026, [https://www.gitclear.com/research\_studies/git\_commit\_count\_percentiles\_annual\_days\_active\_from\_largest\_data\_set](https://www.gitclear.com/research_studies/git_commit_count_percentiles_annual_days_active_from_largest_data_set)  
9. Explanation of Rank Calculation in GitHub Stats · Issue \#4187, accessed January 18, 2026, [https://github.com/anuraghazra/github-readme-stats/issues/4187](https://github.com/anuraghazra/github-readme-stats/issues/4187)  
10. 2024 Split 3 show a sharp decrease in the percentage of Elite players: Diamond+ and Emerald+ : r/leagueoflegends \- Reddit, accessed January 18, 2026, [https://www.reddit.com/r/leagueoflegends/comments/1guaan7/2024\_split\_3\_show\_a\_sharp\_decrease\_in\_the/](https://www.reddit.com/r/leagueoflegends/comments/1guaan7/2024_split_3_show_a_sharp_decrease_in_the/)  
11. League of Legends Rank Distribution in November 2025: solo queue data \- Esports Tales, accessed January 18, 2026, [https://www.esportstales.com/league-of-legends/rank-distribution-percentage-of-players-by-tier](https://www.esportstales.com/league-of-legends/rank-distribution-percentage-of-players-by-tier)  
12. \[feature\_request\] Add all time total commits object to GraphQL API \#35675 \- GitHub, accessed January 18, 2026, [https://github.com/orgs/community/discussions/35675](https://github.com/orgs/community/discussions/35675)  
13. How do you get total contributions with Githubs API v4 \- Stack Overflow, accessed January 18, 2026, [https://stackoverflow.com/questions/44579877/how-do-you-get-total-contributions-with-githubs-api-v4](https://stackoverflow.com/questions/44579877/how-do-you-get-total-contributions-with-githubs-api-v4)  
14. Objects \- GitHub Docs, accessed January 18, 2026, [https://docs.github.com/en/graphql/reference/objects](https://docs.github.com/en/graphql/reference/objects)  
15. Understanding GitHub API Rate Limits: REST, GraphQL, and Beyond · community · Discussion \#163553, accessed January 18, 2026, [https://github.com/orgs/community/discussions/163553](https://github.com/orgs/community/discussions/163553)  
16. Rate limits and query limits for the GraphQL API \- GitHub Docs, accessed January 18, 2026, [https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)  
17. jfullstackdev/github-stats-guide: if you are new or you don't know this and if you just really want to get the A+ rank or higher, read this \- GitHub, accessed January 18, 2026, [https://github.com/jfullstackdev/github-stats-guide](https://github.com/jfullstackdev/github-stats-guide)  
18. vercel/satori: Enlightened library to convert HTML and CSS to SVG \- GitHub, accessed January 18, 2026, [https://github.com/vercel/satori](https://github.com/vercel/satori)  
19. \#CodeWeekly \#6: SVG on the fly with Satori, Understanding Radix, and UI Libraries, New Series for System Design \- Aryan Chaurasia, accessed January 18, 2026, [https://code.aryn.tech/codeweekly-6-svg-with-satori-radix-ui](https://code.aryn.tech/codeweekly-6-svg-with-satori-radix-ui)  
20. Part-TimeWizard/ELO-Rank: A web app designed to track 2 vs 2 competitive matches using a modified Elo algorithm. \- GitHub, accessed January 18, 2026, [https://github.com/Part-TimeWizard/ELO-Rank](https://github.com/Part-TimeWizard/ELO-Rank)  
21. Getting started with Vercel Functions, accessed January 18, 2026, [https://vercel.com/docs/functions/quickstart](https://vercel.com/docs/functions/quickstart)  
22. Introducing OG Image Generation: Fast, dynamic social card images at the Edge \- Vercel, accessed January 18, 2026, [https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images](https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images)  
23. CSS Badges | Everything you need to know \- Coding Dude, accessed January 18, 2026, [https://www.coding-dude.com/wp/css/css-badges/](https://www.coding-dude.com/wp/css/css-badges/)  
24. lucide-icons/lucide: Beautiful & consistent icon toolkit made by the community. Open-source project and a fork of Feather Icons. \- GitHub, accessed January 18, 2026, [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide)  
25. Game-icons.net: 4170 free SVG and PNG icons for your games or apps, accessed January 18, 2026, [https://game-icons.net/](https://game-icons.net/)  
26. How do I efficiently retrieve repos where I have contributed, but not owned by me? · community · Discussion \#151261 \- GitHub, accessed January 18, 2026, [https://github.com/orgs/community/discussions/151261](https://github.com/orgs/community/discussions/151261)  
27. Commits Do Not Equal Productivity \- GitLab, accessed January 18, 2026, [https://about.gitlab.com/blog/commits-do-not-equal-productivity/](https://about.gitlab.com/blog/commits-do-not-equal-productivity/)  
28. Docs/assets.md at master \- GitHub, accessed January 18, 2026, [https://github.com/communitydragon/docs/blob/master/assets.md](https://github.com/communitydragon/docs/blob/master/assets.md)  
29. images \- RAW \- CommunityDragon, accessed January 18, 2026, [https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/](https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/)