# Product Description.md

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Target Audience](#target-audience)
4. [Core Features](#core-features)
5. [User Experience](#user-experience)
6. [Technical Specifications](#technical-specifications)
7. [Ranking System Details](#ranking-system-details)
8. [Visual Design](#visual-design)
9. [Use Cases](#use-cases)
10. [Competitive Analysis](#competitive-analysis)
11. [Value Proposition](#value-proposition)
12. [Future Roadmap](#future-roadmap)

---

## Executive Summary

**GitHub Ranked** is a dynamic, gamified ranking system that transforms GitHub contribution statistics into competitive gaming-style rank badges. By analyzing a developer's all-time GitHub activity using a statistically rigorous algorithm, the system assigns a "Dev-Elo" rating and corresponding tier (Iron through Challenger) that reflects their standing within the global developer community.

Unlike simple contribution counters, GitHub Ranked provides **comparative context**—telling developers not just how much they've contributed, but how they rank against their peers. The system leverages the psychological principles of competitive gaming to motivate developers through visible progression, social comparison, and the pursuit of higher ranks.

**Key Differentiators**:
- Statistically rigorous ranking algorithm (log-normal distribution, weighted metrics)
- Gaming-inspired visual design (League of Legends/Valorant aesthetic)
- Real-time dynamic badge generation (SVG images)
- All-time statistics calculation (not just current year)
- Emphasis on collaboration metrics (PRs, reviews) over raw commit counts

---

## Product Overview

### 2.1 What is GitHub Ranked?

GitHub Ranked is a **serverless web service** that generates dynamic rank badges for GitHub profiles. Users embed a simple image URL in their README.md file, and the service:

1. Fetches the user's GitHub contribution statistics
2. Calculates a weighted performance score
3. Determines their percentile rank globally
4. Assigns a gaming-style tier and Elo rating
5. Generates a visually appealing SVG badge
6. Serves the badge as an image

### 2.2 How It Works

**For End Users**:
1. Copy a badge URL: `https://github-ranked.vercel.app/api/rank/username`
2. Paste into README.md: `![GitHub Rank](https://github-ranked.vercel.app/api/rank/username)`
3. Badge automatically updates as contributions increase

**Behind the Scenes**:
1. Service receives request for username
2. Checks cache (24-hour TTL)
3. If cache miss, fetches all-time stats from GitHub GraphQL API
4. Calculates Dev-Elo using weighted algorithm
5. Maps Elo to tier/division (Iron IV → Challenger I)
6. Renders SVG badge using Vercel Satori
7. Caches result and returns badge

### 2.3 Product Type

- **Category**: Developer Tools, Gamification, Analytics
- **Delivery Model**: SaaS (Software as a Service)
- **Deployment**: Serverless (Vercel Edge Functions)
- **Access**: Public API (no authentication required)
- **Monetization**: Free (open-source, community-driven)

---

## Target Audience

### 3.1 Primary Audience

**Active GitHub Contributors**
- Developers who regularly contribute to open-source projects
- Developers seeking motivation through gamification
- Developers who want to showcase their contributions
- Competitive developers who enjoy ranking systems

**Demographics**:
- Age: 18-45
- Experience: Junior to Senior developers
- Platform: GitHub users (all skill levels)
- Interest: Gaming culture, competitive systems, self-improvement

### 3.2 Secondary Audience

**GitHub Profile Curators**
- Developers who maintain polished GitHub profiles
- Developers seeking to add "flavor" to their profiles
- Developers participating in GitHub profile README trends

**Open Source Maintainers**
- Project maintainers tracking contributor activity
- Organizations measuring team engagement
- Community managers analyzing participation

### 3.3 User Personas

**Persona 1: "The Grinder"**
- **Name**: Alex, 28, Full-Stack Developer
- **Goals**: Climb from Gold to Diamond rank
- **Pain Points**: No way to see relative standing
- **Usage**: Checks rank weekly, shares on social media

**Persona 2: "The Showcase"**
- **Name**: Sam, 35, Senior Engineer
- **Goals**: Display professional achievements
- **Pain Points**: Static stats don't tell the full story
- **Usage**: Embeds badge in README, updates quarterly

**Persona 3: "The Competitive"**
- **Name**: Jordan, 22, Student/Contributor
- **Goals**: Compete with peers, reach Challenger
- **Pain Points**: No competitive element in GitHub
- **Usage**: Daily rank checks, optimizes contributions for ranking

---

## Core Features

### 4.1 Rank Badge Generation

**Feature**: Dynamic SVG badge displaying user's rank, Elo, and progress.

**Components**:
- **Tier Icon**: Visual representation of rank (Iron → Challenger)
- **Tier Name**: Text display (e.g., "Diamond II")
- **Elo Rating**: Skill rating number (e.g., "2,340 SR")
- **LP Progress**: League Points within current division (e.g., "45/100 LP")
- **Progress Bar**: Visual LP progress indicator
- **Metric Breakdown**: Mini radar chart showing contribution types

**Specifications**:
- Dimensions: 400px × 120px
- Format: SVG (scalable, crisp at any size)
- Update Frequency: 24-hour cache (can force refresh)
- Themes: Default, Dark, Light

### 4.2 All-Time Statistics Calculation

**Feature**: Calculates rank based on entire GitHub history, not just current year.

**Implementation**:
- Fetches contribution data for all years user has been active
- Aggregates statistics across all repositories
- Handles private repository contributions (with user token)
- Caches historical years permanently (they never change)

**Benefits**:
- Accurate representation of long-term contributions
- Rewards consistent activity over time
- Fair ranking for users with long histories

### 4.3 Weighted Performance Algorithm

**Feature**: Dev-Elo calculation using weighted metrics, not just commit counts.

**Metric Weights**:
- **Merged Pull Requests**: 40 points (highest weight)
- **Code Reviews**: 30 points (collaboration indicator)
- **Issues Resolved**: 20 points (problem-solving)
- **Commits**: 10 points (lowest weight, prevents farming)
- **Stars (Owned Repos)**: 5 points (capped at 500 stars)

**Algorithm**:
1. Calculate Weighted Performance Index (WPI)
2. Apply log-normal transformation (handles skewed distribution)
3. Calculate Z-score (standard deviations from mean)
4. Map Z-score to Elo rating (1200 base, 400 per sigma)
5. Assign tier/division based on Elo range

**Why This Matters**:
- Prevents "commit farming" (trivial commits for stats)
- Rewards collaboration (PRs, reviews)
- Aligns incentives with healthy engineering practices

### 4.4 Gaming-Style Ranking System

**Feature**: 10-tier ranking system matching competitive gaming percentiles.

**Tiers** (from lowest to highest):
1. **Iron** (Bottom 20%): Inactive accounts, learners
2. **Bronze** (Top 80%): Casual contributors, students
3. **Silver** (Top 60%): Hobbyists with sporadic activity
4. **Gold** (Top 40%): Average active developer (median)
5. **Platinum** (Top 20%): Above average, aspiring seniors
6. **Emerald** (Top 10%): Advanced developers, consistent impact
7. **Diamond** (Top 2.5%): High-activity, heavily collaborative
8. **Master** (Top 0.5%): Senior engineers, high daily output
9. **Grandmaster** (Top 0.1%): Extremely prolific contributors
10. **Challenger** (Top 0.02%): Open-source elite, framework maintainers

**Divisions**: Each tier has 4 divisions (I, II, III, IV), with Division I being highest.

**League Points (LP)**: 0-99 LP within each division, indicating progress to next division.

### 4.5 Caching & Performance

**Feature**: Aggressive caching to minimize API calls and ensure fast response times.

**Cache Strategy**:
- **Rank Results**: 24-hour TTL (rank doesn't change frequently)
- **Historical Years**: Permanent cache (2018-2025 never change)
- **Current Year**: 1-hour cache (recent activity may change)
- **CDN Caching**: Vercel Edge Cache (global distribution)
- **Backend**: Upstash Redis (HTTP-based, serverless-optimized)

**Performance Targets**:
- Cache Hit: < 50ms response time
- Cache Miss: < 2 seconds (p95)
- API Calls: Reduced by 80%+ through caching

### 4.6 Multi-Token Support

**Feature**: Token pool management for handling high traffic and rate limits.

**Implementation**:
- Round-robin token distribution
- Automatic token switching on rate limit
- Support for user-provided tokens (BYOT)
- Graceful degradation if all tokens exhausted

**Benefits**:
- Handles viral traffic spikes
- Supports private repository stats (with user token)
- Prevents single point of failure

### 4.7 Theme Customization

**Feature**: Multiple visual themes for rank badges.

**Available Themes**:
- **Default**: Full-color gaming aesthetic
- **Dark**: Darker colors, high contrast
- **Light**: Lighter colors, subtle styling

**Usage**: `?theme=dark` query parameter

---

## User Experience

### 5.1 First-Time User Flow

1. **Discovery**: User sees GitHub Ranked badge on another profile
2. **Interest**: Clicks badge or visits service URL
3. **Understanding**: Reads documentation or sees example
4. **Implementation**: Copies badge URL to README
5. **Verification**: Badge appears on profile
6. **Engagement**: Checks rank regularly, shares on social media

### 5.2 Badge Embedding

**Simple Embedding**:
```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/username)
```

**With Customization**:
```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/username?theme=dark&season=2024)
```

**Result**: Badge automatically updates as user's contributions change.

### 5.3 Rank Progression Experience

**The Journey**:
1. **Initial Rank**: User sees their starting rank (e.g., Silver III)
2. **Goal Setting**: User sets target (e.g., "Reach Gold by end of month")
3. **Activity**: User increases contributions (PRs, reviews)
4. **Progress**: LP increases, division promotion visible
5. **Achievement**: Tier promotion (e.g., Silver → Gold)
6. **Motivation**: Social sharing, continued engagement

**Psychological Elements**:
- **Progress Visibility**: LP bar shows advancement
- **Social Comparison**: Rank indicates relative standing
- **Achievement Unlocking**: Tier promotions feel rewarding
- **Long-Term Goals**: Challenger rank as ultimate achievement

### 5.4 Error Handling

**User Not Found**:
- Returns 404 with friendly message
- Suggests checking username spelling

**Rate Limit Exceeded**:
- Returns 503 with retry-after header
- Suggests using personal token (BYOT)

**Service Unavailable**:
- Returns 503 with status message
- Provides alternative (try again later)

**All Errors**: Return JSON with clear, actionable messages.

---

## Technical Specifications

### 6.1 API Endpoint

**Endpoint**: `GET /api/rank/[username]`

**Query Parameters**:
- `season` (optional): Year for seasonal ranking (default: current year)
- `theme` (optional): Visual theme (`default`, `dark`, `light`)
- `token` (optional): GitHub PAT for private repo access
- `force` (optional): Bypass cache (`true`/`false`)

**Response**:
- Success: SVG image (`Content-Type: image/svg+xml`)
- Error: JSON (`Content-Type: application/json`)

**Example Request**:
```
GET /api/rank/octocat?theme=dark&season=2024
```

**Example Response** (SVG):
```xml
<svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
  <!-- Rank card content -->
</svg>
```

### 6.2 Data Sources

**GitHub GraphQL API v4**:
- User contribution statistics
- Repository information
- Follower counts
- All-time historical data

**Required Data Points**:
- Total commits (all-time)
- Total merged pull requests
- Total code reviews
- Total issues closed
- Total stars (owned repositories)
- Follower count
- Contribution years (for historical fetching)

### 6.3 Performance Requirements

**Response Times**:
- Cache Hit: < 50ms (p95)
- Cache Miss: < 2 seconds (p95)
- Cold Start: < 500ms (Edge Function)

**Availability**:
- Uptime: 99.9% (target)
- Error Rate: < 1%

**Scalability**:
- Handle 10,000+ requests per hour
- Support viral traffic spikes
- Auto-scale via serverless architecture

### 6.4 Browser Compatibility

**SVG Support**:
- All modern browsers (Chrome, Firefox, Safari, Edge)
- GitHub's markdown renderer
- Image hosting services (Imgur, etc.)

**No JavaScript Required**: Pure SVG, works everywhere images work.

---

## Ranking System Details

### 7.1 Statistical Foundation

**Problem**: GitHub contribution data follows a power law (log-normal distribution), not a normal distribution.

**Solution**: Log-normal transformation to normalize data for fair ranking.

**Formula**:
1. **WPI** = Σ(metric_i × weight_i)
2. **Log Score** = ln(WPI)
3. **Z-Score** = (Log Score - μ_ln) / σ_ln
4. **Elo** = 1200 + (Z-Score × 400)

**Constants** (derived from global data):
- μ_ln (Mean): 6.5
- σ_ln (Std Dev): 1.5
- Base Elo: 1200 (median, Gold IV)

### 7.2 Tier Distribution

**Percentile Mapping** (aligned with League of Legends 2025 data):

| Tier | Percentile | Z-Score | Elo Range |
|------|------------|---------|-----------|
| Challenger | Top 0.02% | > +3.5 | 3000+ |
| Grandmaster | Top 0.1% | +3.1 to +3.5 | 2600-2999 |
| Master | Top 0.5% | +2.6 to +3.1 | 2400-2599 |
| Diamond | Top 2.5% | +1.96 to +2.6 | 2000-2399 |
| Emerald | Top 10% | +1.28 to +1.96 | 1700-1999 |
| Platinum | Top 20% | +0.84 to +1.28 | 1500-1699 |
| Gold | Top 40% | +0.25 to +0.84 | 1200-1499 |
| Silver | Top 60% | -0.25 to +0.25 | 900-1199 |
| Bronze | Top 80% | -0.84 to -0.25 | 600-899 |
| Iron | Bottom 20% | < -0.84 | 0-599 |

> **Reference**: Based on League of Legends rank distribution data (November 2025): Iron ~14%, Bronze ~17%, Silver ~21%, Gold ~21%, with Diamond+ representing the top ~2.5% of players.

**Why This Distribution**:
- Matches gaming expectations (Gold = average active player)
- Provides achievable goals (most users in Silver-Gold)
- Maintains exclusivity (Diamond+ is rare)
- Creates aspirational targets (Challenger)

### 7.3 Division Calculation

**Logic**:
- Each tier spans a 300-400 Elo range
- Divided into 4 equal divisions
- Division I: Highest Elo in tier
- Division IV: Lowest Elo in tier

**Example (Gold Tier: 1200-1499 Elo)**:
- Gold I: 1450-1499
- Gold II: 1400-1449
- Gold III: 1350-1399
- Gold IV: 1200-1349

### 7.4 League Points (LP) System

**Calculation**:
- LP = (User Elo - Division Min Elo) within current division
- Range: 0-99 LP per division
- Display: "Gold II - 45 LP"

**Purpose**:
- Shows progress within division
- Creates "promo series" feeling at 90+ LP
- Provides granular feedback on rank changes

### 7.5 Seasonal Rankings

**Feature**: Support for time-based rankings (e.g., "Season 2024").

**Implementation**:
- `?season=2024` parameter filters contributions to that year
- Default: Rolling 365-day window (encourages active maintenance)
- Historical seasons: Can generate "trophy" badges for past achievements

**Rationale**:
- Prevents inactive users from holding high ranks
- Encourages continued activity
- Allows legacy achievement preservation

---

## Visual Design

### 8.1 Tier Aesthetics

**Design Philosophy**: Each tier has a distinct visual identity matching gaming aesthetics.

**Iron**:
- Color: Gray/Brown (#3a3a3a, #1a1a1a)
- Style: Industrial, rusted metal texture
- Icon: Flat shield or gear
- Mood: Grounded, beginner

**Bronze**:
- Color: Copper/Brown (#cd7f32, #8b4513)
- Style: Oxidation effects, polished highlights
- Icon: Heavy hammer or anvil
- Mood: Solid, established

**Silver**:
- Color: Metallic silver (#c0c0c0, #808080)
- Style: Sleek, polished steel, blue-white reflections
- Icon: Sword or arrow
- Mood: Clean, professional

**Gold**:
- Color: Vibrant gold (#FFD700, #FDB931)
- Style: Shiny gradients, luxurious
- Icon: Crown or winged crest
- Mood: Prestigious, accomplished

**Platinum**:
- Color: Teal/Cyan (#00d4ff, #0099cc)
- Style: Sharp, angular, metallic finish
- Icon: Complex geometric gem
- Mood: Advanced, refined

**Emerald**:
- Color: Green (#50c878, #228b22)
- Style: Natural, polished gemstone
- Icon: Emerald gem
- Mood: Growth, excellence

**Diamond**:
- Color: Icy blue/purple (#b9f2ff, #00d4ff)
- Style: Holographic, sparkle animations
- Icon: Diamond with fractured facets
- Mood: Elite, premium

**Master**:
- Color: Dark purple (#9b59b6, #6a1b9a)
- Style: Animated glow effects, void energy
- Icon: Mystical symbol
- Mood: Powerful, mysterious

**Grandmaster**:
- Color: Red/Orange (#e74c3c, #c0392b)
- Style: Intense glow, fire effects
- Icon: Flaming symbol
- Mood: Dominant, fierce

**Challenger**:
- Color: Gold/Orange (#f39c12, #e67e22)
- Style: Maximum glow, particle effects
- Icon: Ultimate symbol
- Mood: Legendary, unmatched

### 8.2 Rank Card Layout

**Structure** (400px × 120px):
```
┌─────────────────────────────────────┐
│ [Icon]  Diamond II                   │
│         2,340 SR                     │
│         [Progress Bar] 45/100 LP    │
│         [Radar Chart]                │
└─────────────────────────────────────┘
```

**Components**:
- **Left**: Large tier icon (64×64px)
- **Center**: Tier name (bold, 24px), Elo (18px), LP progress (14px)
- **Right**: Mini radar chart (metric breakdown)

**Typography**:
- Tier Name: Bold, tier color, 24px
- Elo: Regular, white, 18px
- LP: Regular, gray, 14px

### 8.3 Progress Bar Design

**Visual**:
- Horizontal bar showing LP progress (0-100)
- Gradient fill matching tier colors
- Text overlay: "45/100 LP"
- Smooth animation on updates

**Purpose**:
- Visual feedback on rank progress
- Creates anticipation for promotion
- Shows granular advancement

### 8.4 Radar Chart Design

**Purpose**: Show breakdown of contribution types (why user is at this rank).

**Metrics Displayed**:
- Pull Requests (weight: 40)
- Code Reviews (weight: 30)
- Issues (weight: 20)
- Commits (weight: 10)
- Stars (weight: 5)

**Visual**:
- Mini radar/spider chart
- Normalized values for display
- Color-coded by metric type
- Tooltip on hover (if interactive)

---

## Use Cases

### 9.1 Personal Profile Enhancement

**Scenario**: Developer wants to add visual interest to GitHub profile.

**Solution**: Embed GitHub Ranked badge in README.

**Benefits**:
- Adds "flavor" to profile
- Shows relative standing
- Encourages continued contributions
- Creates conversation starter

### 9.2 Competitive Motivation

**Scenario**: Developer wants to climb ranks and compete with peers.

**Solution**: Use rank as motivation to increase quality contributions.

**Benefits**:
- Clear progression goals
- Social comparison drives improvement
- Gamification increases engagement
- Long-term skill development

### 9.3 Team/Organization Tracking

**Scenario**: Organization wants to track contributor engagement.

**Solution**: Aggregate individual ranks or create organization-level rankings.

**Benefits**:
- Measure team activity
- Identify top contributors
- Encourage healthy competition
- Track engagement over time

### 9.4 Recruitment/Portfolio

**Scenario**: Developer wants to showcase contributions to potential employers.

**Solution**: Display rank badge as proof of consistent, quality contributions.

**Benefits**:
- Visual representation of activity
- Shows collaboration (PRs, reviews)
- Demonstrates long-term commitment
- Stands out from static stats

---

## Competitive Analysis

### 10.1 Existing Solutions

**github-readme-stats**:
- **Strengths**: Popular, well-maintained, multiple stat types
- **Weaknesses**: Static stats only, no ranking/context, no gamification
- **Differentiation**: GitHub Ranked adds ranking, gamification, comparative context

**GitHub Contribution Graph**:
- **Strengths**: Native GitHub feature, shows consistency
- **Weaknesses**: No context, no ranking, no gamification
- **Differentiation**: GitHub Ranked provides ranking and gaming aesthetic

**WakaTime**:
- **Strengths**: Time tracking, coding activity
- **Weaknesses**: Requires installation, different metric (time vs. contributions)
- **Differentiation**: GitHub Ranked uses GitHub-native data, no installation

### 10.2 Competitive Advantages

**1. Statistical Rigor**:
- Log-normal transformation for fair ranking
- Weighted metrics prevent gaming
- Aligned with gaming percentiles

**2. Gaming Aesthetic**:
- Authentic tier system (Iron → Challenger)
- Visual design matches gaming expectations
- LP system creates progression feeling

**3. All-Time Statistics**:
- Not just current year
- Rewards long-term consistency
- Accurate representation of contributions

**4. Collaboration Focus**:
- Emphasizes PRs and reviews
- Rewards teamwork over solo work
- Aligns with healthy engineering practices

---

## Value Proposition

### 11.1 For Individual Developers

**Value**:
- **Motivation**: Gamification increases engagement
- **Context**: See relative standing globally
- **Progress**: Visual feedback on advancement
- **Recognition**: Social proof of contributions
- **Fun**: Adds "flavor" to profiles

**Emotional Benefits**:
- Pride in rank achievement
- Excitement for promotions
- Sense of belonging to community
- Competitive drive

### 11.2 For Open Source Community

**Value**:
- **Engagement**: Increases contributor activity
- **Quality**: Rewards collaboration over quantity
- **Retention**: Long-term motivation through ranks
- **Recognition**: Visual acknowledgment of contributions

**Community Benefits**:
- More active contributors
- Higher quality contributions
- Increased collaboration
- Stronger community bonds

### 11.3 For Organizations

**Value**:
- **Metrics**: Track team engagement
- **Motivation**: Encourage healthy competition
- **Recruitment**: Showcase active teams
- **Culture**: Foster contribution culture

**Business Benefits**:
- Improved team engagement
- Better open-source presence
- Attract top talent
- Enhanced brand reputation

---

## Future Roadmap

### 12.1 Phase 1: MVP (Current)
- Core ranking system
- Basic badge generation
- Caching and optimization
- Public API

### 12.2 Phase 2: Enhanced Features
- **Account Linking**: Aggregate stats across multiple accounts
- **Team Rankings**: Organization-level rankings
- **Rank History**: Track rank changes over time
- **Analytics Dashboard**: Detailed statistics and trends

### 12.3 Phase 3: Social Features
- **Leaderboards**: Top users by tier
- **Clash Mode**: Weekly competitive events
- **Achievements**: Badges for milestones
- **Social Sharing**: Share rank on social media

### 12.4 Phase 4: Advanced Features
- **Skin Store**: Customizable badge themes
- **API Access**: Programmatic rank access
- **Webhooks**: Rank change notifications
- **Mobile App**: Rank tracking on mobile

### 12.5 Phase 5: Enterprise Features
- **Private Instances**: Self-hosted deployments
- **Custom Algorithms**: Organization-specific ranking
- **Advanced Analytics**: Team performance insights
- **Integration**: GitHub Actions, Slack, Discord bots

---

## Conclusion

GitHub Ranked transforms static GitHub statistics into a dynamic, gamified ranking system that motivates developers through competitive progression. By combining statistical rigor with gaming aesthetics, the product provides both meaningful insights and engaging user experience.

**Key Success Factors**:
1. **Accuracy**: Ranking algorithm reflects true contribution quality
2. **Performance**: Fast, reliable badge generation
3. **Visual Quality**: Premium gaming aesthetic
4. **User Engagement**: Motivates continued contributions
5. **Community Adoption**: Viral growth through profile sharing

The product addresses a real need in the developer community: the desire for comparative context and gamified motivation in the open-source ecosystem. By aligning incentives with healthy engineering practices (collaboration over quantity), GitHub Ranked promotes both individual growth and community health.

**Vision**: Every GitHub profile displays a rank badge, creating a global leaderboard of developer contributions and fostering a culture of excellence, collaboration, and continuous improvement in open-source software development.
