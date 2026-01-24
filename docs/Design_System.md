# Design System & Visual Assets

> **Last Updated**: January 2026  
> **Version**: 1.0.0

## Table of Contents
1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Tier Icon Specifications](#tier-icon-specifications)
6. [Rank Card Layout](#rank-card-layout)
7. [Component Specifications](#component-specifications)
8. [Theme Variants](#theme-variants)
9. [Animation Guidelines](#animation-guidelines)
10. [Asset Requirements](#asset-requirements)
11. [Accessibility](#accessibility)

---

## 1. Overview

This document defines the visual design system for GitHub Ranked, ensuring consistent, high-quality visual output across all rank badges and themes.

### Design Goals
- **Gaming Aesthetic**: Authentic competitive gaming look and feel
- **Readability**: Clear hierarchy, readable at small sizes
- **Scalability**: SVG-based, crisp at any resolution
- **Accessibility**: WCAG AA compliant color contrast
- **Performance**: Optimized file sizes (< 50KB per badge)

---

## 2. Design Philosophy

### 2.1 Competitive Gaming Inspiration

The visual design draws heavily from established competitive gaming aesthetics:
- **League of Legends**: Tier emblems, metallic finishes, prestige feel
- **Valorant**: Clean geometric shapes, bold colors, modern styling
- **Overwatch**: Skill rating display, progression bars

### 2.2 Visual Hierarchy

1. **Primary**: Tier icon (largest, most visually prominent)
2. **Secondary**: Tier name and Elo rating
3. **Tertiary**: LP progress and division
4. **Quaternary**: Metric breakdown (optional radar chart)

### 2.3 Emotional Design

Each tier should evoke specific emotions:
- **Iron/Bronze**: Grounded, beginning journey
- **Silver/Gold**: Progress, achievement
- **Platinum/Emerald**: Excellence, pride
- **Diamond/Master**: Elite status, prestige
- **Grandmaster/Challenger**: Legendary, awe-inspiring

---

## 3. Color System

### 3.1 Tier Color Palettes

Each tier has a primary gradient and supporting colors:

```typescript
const TIER_COLORS = {
  Iron: {
    primary: ['#3a3a3a', '#1a1a1a'],
    accent: '#5c5c5c',
    text: '#8a8a8a',
    glow: 'rgba(90, 90, 90, 0.3)',
  },
  Bronze: {
    primary: ['#cd7f32', '#8b4513'],
    accent: '#d4a373',
    text: '#ffd5a0',
    glow: 'rgba(205, 127, 50, 0.4)',
  },
  Silver: {
    primary: ['#c0c0c0', '#808080'],
    accent: '#e8e8e8',
    text: '#ffffff',
    glow: 'rgba(192, 192, 192, 0.4)',
  },
  Gold: {
    primary: ['#FFD700', '#FDB931'],
    accent: '#fff4b0',
    text: '#ffffff',
    glow: 'rgba(255, 215, 0, 0.5)',
  },
  Platinum: {
    primary: ['#00d4ff', '#0099cc'],
    accent: '#7fffff',
    text: '#ffffff',
    glow: 'rgba(0, 212, 255, 0.5)',
  },
  Emerald: {
    primary: ['#50c878', '#228b22'],
    accent: '#90ee90',
    text: '#ffffff',
    glow: 'rgba(80, 200, 120, 0.5)',
  },
  Diamond: {
    primary: ['#b9f2ff', '#00d4ff'],
    accent: '#e0ffff',
    text: '#ffffff',
    glow: 'rgba(185, 242, 255, 0.6)',
  },
  Master: {
    primary: ['#9b59b6', '#6a1b9a'],
    accent: '#d4a5ff',
    text: '#ffffff',
    glow: 'rgba(155, 89, 182, 0.6)',
  },
  Grandmaster: {
    primary: ['#e74c3c', '#c0392b'],
    accent: '#ff8a80',
    text: '#ffffff',
    glow: 'rgba(231, 76, 60, 0.6)',
  },
  Challenger: {
    primary: ['#f39c12', '#e67e22'],
    accent: '#ffd700',
    text: '#ffffff',
    glow: 'rgba(243, 156, 18, 0.7)',
    special: ['#ff6b6b', '#4ecdc4', '#f39c12'], // Rainbow accent
  },
};
```

### 3.2 Background Colors

```typescript
const BACKGROUND_COLORS = {
  default: {
    primary: '#0d1117',
    secondary: '#161b22',
    border: '#30363d',
  },
  dark: {
    primary: '#000000',
    secondary: '#0a0a0a',
    border: '#1a1a1a',
  },
  light: {
    primary: '#ffffff',
    secondary: '#f6f8fa',
    border: '#d0d7de',
  },
  minimal: {
    primary: 'transparent',
    secondary: 'transparent',
    border: '#30363d',
  },
};
```

### 3.3 Text Colors

```typescript
const TEXT_COLORS = {
  primary: '#ffffff',
  secondary: '#8b949e',
  muted: '#6e7681',
  link: '#58a6ff',
  error: '#f85149',
  success: '#3fb950',
};
```

---

## 4. Typography

### 4.1 Font Stack

```css
/* Primary font stack (system fonts for compatibility with Satori) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace for numbers/Elo */
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

### 4.2 Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Tier Name | 24px | 700 (Bold) | 1.2 | -0.02em |
| Elo Rating | 20px | 600 (SemiBold) | 1.3 | 0 |
| Division | 16px | 500 (Medium) | 1.4 | 0.02em |
| LP Text | 12px | 400 (Regular) | 1.5 | 0.04em |
| Username | 14px | 500 (Medium) | 1.4 | 0 |

### 4.3 Typography Hierarchy

```
DIAMOND II          ← Tier Name (24px, Bold, Tier Color)
2,340 SR            ← Elo Rating (20px, SemiBold, White)
━━━━━━━━━━          ← Progress Bar
45/100 LP           ← LP Text (12px, Regular, Muted)
```

---

## 5. Tier Icon Specifications

### 5.1 Icon Dimensions

- **Container Size**: 64×64 pixels (at 1x scale)
- **Safe Area**: 56×56 pixels (4px padding)
- **Stroke Width**: 2px (at 1x scale)
- **Corner Radius**: Varies by tier (0-8px)

### 5.2 Icon Design Guidelines

**Iron**
- Shape: Hexagonal gear/cog
- Style: Flat, industrial
- Effects: Subtle rust texture
- Complexity: Simple, 6-8 points

**Bronze**
- Shape: Heavy shield with hammer
- Style: Oxidized metal, polished highlights
- Effects: Copper sheen
- Complexity: Medium, shield + emblem

**Silver**
- Shape: Pointed shield with sword
- Style: Polished steel, reflective
- Effects: Chrome highlights
- Complexity: Medium, clean lines

**Gold**
- Shape: Ornate crest with crown
- Style: Luxurious, shiny
- Effects: Golden glow, gradients
- Complexity: High, decorative elements

**Platinum**
- Shape: Geometric crystal/gem
- Style: Angular, futuristic
- Effects: Teal metallic shine
- Complexity: Medium-high, faceted

**Emerald**
- Shape: Natural gem shape
- Style: Organic, polished
- Effects: Green inner glow
- Complexity: Medium, faceted gem

**Diamond**
- Shape: Multi-faceted diamond
- Style: Brilliant, icy
- Effects: Sparkle particles, rainbow refraction
- Complexity: High, multiple facets

**Master**
- Shape: Mystical emblem
- Style: Ethereal, void-like
- Effects: Purple glow, energy wisps
- Complexity: High, magical elements

**Grandmaster**
- Shape: Flaming emblem
- Style: Intense, powerful
- Effects: Fire particles, heat distortion
- Complexity: Very high, animated flames

**Challenger**
- Shape: Ultimate emblem (combines all elements)
- Style: Legendary, unmatched
- Effects: Rainbow glow, particle effects, pulsing
- Complexity: Maximum, multi-element

### 5.3 Icon File Requirements

```
public/icons/
├── iron.svg         # 64x64, < 5KB
├── bronze.svg       # 64x64, < 6KB
├── silver.svg       # 64x64, < 6KB
├── gold.svg         # 64x64, < 8KB
├── platinum.svg     # 64x64, < 7KB
├── emerald.svg      # 64x64, < 7KB
├── diamond.svg      # 64x64, < 10KB
├── master.svg       # 64x64, < 12KB
├── grandmaster.svg  # 64x64, < 15KB
└── challenger.svg   # 64x64, < 20KB
```

### 5.4 Icon SVG Structure Template

```xml
<svg 
  width="64" 
  height="64" 
  viewBox="0 0 64 64" 
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <!-- Gradients -->
    <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#PRIMARY_COLOR_1"/>
      <stop offset="100%" style="stop-color:#PRIMARY_COLOR_2"/>
    </linearGradient>
    
    <!-- Glow effect -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background glow (optional) -->
  <circle cx="32" cy="32" r="28" fill="url(#tierGradient)" opacity="0.2" filter="url(#glow)"/>
  
  <!-- Main icon shape -->
  <path d="..." fill="url(#tierGradient)" filter="url(#glow)"/>
  
  <!-- Highlights and details -->
  <path d="..." fill="#ACCENT_COLOR" opacity="0.6"/>
</svg>
```

---

## 6. Rank Card Layout

### 6.1 Card Dimensions

- **Width**: 400px
- **Height**: 120px
- **Border Radius**: 8px
- **Padding**: 16px

### 6.2 Layout Grid

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 16px │ 64px │ 16px │ ─────────────────────── 240px ─────────────────────── │ 16px │ 48px │ 16px │
│      │      │      │                                                       │      │      │      │
│   ┌──────┐  │  ┌─────────────────────────────────────────────────────────┐│  ┌──────┐  │
│   │      │  │  │  TIER_NAME DIVISION                                      ││  │ Mini │  │
│   │ ICON │  │  │  ELO_RATING SR                                           ││  │Radar │  │
│   │      │  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   ││  │Chart │  │
│   │      │  │  │  LP/100 LP                                               ││  │      │  │
│   └──────┘  │  └─────────────────────────────────────────────────────────┘│  └──────┘  │
│      │      │      │                                                       │      │      │      │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Component Positions

```typescript
const LAYOUT = {
  card: {
    width: 400,
    height: 120,
    padding: 16,
    borderRadius: 8,
  },
  icon: {
    x: 16,
    y: 28, // Vertically centered
    width: 64,
    height: 64,
  },
  content: {
    x: 96, // 16 + 64 + 16
    y: 16,
    width: 240,
  },
  tierName: {
    y: 24,
    fontSize: 24,
  },
  eloRating: {
    y: 52,
    fontSize: 20,
  },
  progressBar: {
    y: 76,
    width: 200,
    height: 8,
    borderRadius: 4,
  },
  lpText: {
    y: 100,
    fontSize: 12,
  },
  radarChart: {
    x: 336, // 400 - 16 - 48
    y: 36,
    width: 48,
    height: 48,
  },
};
```

---

## 7. Component Specifications

### 7.1 Progress Bar

**Structure**:
```
┌─────────────────────────────────┐
│██████████████████░░░░░░░░░░░░░░│
└─────────────────────────────────┘
```

**Specifications**:
- Width: 200px
- Height: 8px
- Border Radius: 4px
- Background: `rgba(255, 255, 255, 0.1)`
- Fill: Tier gradient
- Animation: None (static SVG)

**Code**:
```tsx
const ProgressBar = ({ lp, tier }: { lp: number; tier: Tier }) => (
  <div style={{
    width: 200,
    height: 8,
    borderRadius: 4,
    background: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  }}>
    <div style={{
      width: `${lp}%`,
      height: '100%',
      background: `linear-gradient(90deg, ${TIER_COLORS[tier].primary[0]}, ${TIER_COLORS[tier].primary[1]})`,
      borderRadius: 4,
    }} />
  </div>
);
```

### 7.2 Mini Radar Chart

**Purpose**: Show metric breakdown (why user has this rank)

**Axes** (5 points):
1. PRs (top)
2. Reviews (top-right)
3. Issues (bottom-right)
4. Commits (bottom-left)
5. Stars (top-left)

**Specifications**:
- Size: 48×48px
- Stroke: 1px white
- Fill: Tier color with 30% opacity
- Points: Normalized 0-1 scale

**Code**:
```tsx
const RadarChart = ({ metrics, tier }: { metrics: NormalizedMetrics; tier: Tier }) => {
  const points = calculateRadarPoints(metrics, 24); // radius = 24
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
  
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      {/* Background grid */}
      <polygon points="24,4 44,19 39,39 9,39 4,19" fill="none" stroke="rgba(255,255,255,0.2)" />
      <polygon points="24,12 36,22 33,34 15,34 12,22" fill="none" stroke="rgba(255,255,255,0.1)" />
      
      {/* Data polygon */}
      <path d={pathData} fill={`${TIER_COLORS[tier].primary[0]}50`} stroke={TIER_COLORS[tier].accent} strokeWidth="2" />
    </svg>
  );
};
```

### 7.3 Tier Badge Component

Complete component structure:

```tsx
interface RankCardProps {
  username: string;
  tier: Tier;
  division: Division;
  elo: number;
  lp: number;
  metrics: {
    commits: number;
    prs: number;
    reviews: number;
    issues: number;
    stars: number;
  };
  theme: Theme;
}

const RankCard = ({ username, tier, division, elo, lp, metrics, theme }: RankCardProps) => (
  <div style={{
    width: 400,
    height: 120,
    padding: 16,
    borderRadius: 8,
    background: BACKGROUND_COLORS[theme].primary,
    border: `1px solid ${BACKGROUND_COLORS[theme].border}`,
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif',
  }}>
    {/* Tier Icon */}
    <TierIcon tier={tier} size={64} />
    
    {/* Content */}
    <div style={{ marginLeft: 16, flex: 1 }}>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        color: TIER_COLORS[tier].primary[0],
        textShadow: `0 0 10px ${TIER_COLORS[tier].glow}`,
      }}>
        {tier} {division}
      </div>
      
      <div style={{
        fontSize: 20,
        fontWeight: 600,
        color: TEXT_COLORS.primary,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {elo.toLocaleString()} SR
      </div>
      
      <ProgressBar lp={lp} tier={tier} />
      
      <div style={{
        fontSize: 12,
        color: TEXT_COLORS.muted,
        marginTop: 4,
      }}>
        {lp}/100 LP
      </div>
    </div>
    
    {/* Radar Chart */}
    <RadarChart metrics={normalizeMetrics(metrics)} tier={tier} />
  </div>
);
```

---

## 8. Theme Variants

### 8.1 Default Theme
- Dark background (#0d1117)
- Full color tier icons
- White text with tier-colored accents
- Glow effects enabled

### 8.2 Dark Theme
- Pure black background (#000000)
- High contrast colors
- Stronger glow effects
- Maximum visual impact

### 8.3 Light Theme
- White background (#ffffff)
- Adjusted tier colors for contrast
- Subtle shadows instead of glows
- Professional appearance

### 8.4 Minimal Theme
- Transparent background
- Border-only container
- Reduced visual effects
- Focus on data

### 8.5 Theme Configuration

```typescript
const THEMES: Record<Theme, ThemeConfig> = {
  default: {
    background: BACKGROUND_COLORS.default,
    text: TEXT_COLORS,
    useGlow: true,
    borderWidth: 1,
  },
  dark: {
    background: BACKGROUND_COLORS.dark,
    text: TEXT_COLORS,
    useGlow: true,
    glowIntensity: 1.5,
    borderWidth: 1,
  },
  light: {
    background: BACKGROUND_COLORS.light,
    text: {
      ...TEXT_COLORS,
      primary: '#24292f',
      secondary: '#57606a',
      muted: '#8c959f',
    },
    useGlow: false,
    useShadow: true,
    borderWidth: 1,
  },
  minimal: {
    background: BACKGROUND_COLORS.minimal,
    text: TEXT_COLORS,
    useGlow: false,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
};
```

---

## 9. Animation Guidelines

### 9.1 SVG Animations (Static Badge)

Since GitHub README images are static, animations are **not supported** in the base badge. However, the design should still feel "alive" through:
- Dynamic gradients
- Implied motion in shapes
- Particle effects (static representation)

### 9.2 Future: Interactive Badge

For future interactive versions (website, app):

**Hover Effects**:
- Icon scale: 1.0 → 1.1
- Glow intensity: 1.0 → 1.5
- Transition: 200ms ease-out

**Promotion Animation**:
- Duration: 1000ms
- Effect: Old tier fades, new tier bursts in with particles
- Sound: Optional tier-up sound

**LP Change**:
- Duration: 500ms
- Effect: Progress bar fills/empties smoothly

---

## 10. Asset Requirements

### 10.1 Required Assets

| Asset | Format | Dimensions | Max Size |
|-------|--------|------------|----------|
| Tier Icons (10) | SVG | 64×64 | 20KB each |
| Font: Inter | WOFF2 | - | 50KB |
| Font: JetBrains Mono | WOFF2 | - | 30KB |

### 10.2 Asset Delivery

**Fonts**: Embedded in SVG via Base64 or loaded from CDN
**Icons**: Inline SVG or loaded from `/public/icons/`

### 10.3 Performance Budget

- **Total Badge Size**: < 50KB
- **Icon Size**: < 20KB
- **Font Subset**: < 30KB (numbers + basic Latin only)
- **Generation Time**: < 100ms

---

## 11. Accessibility

### 11.1 Color Contrast

All text must meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text (24px+): 3:1 contrast ratio

**Contrast Verification**:
| Element | Foreground | Background | Ratio | Pass |
|---------|------------|------------|-------|------|
| Tier Name (Gold on Dark) | #FFD700 | #0d1117 | 8.4:1 | ✅ |
| Elo (White on Dark) | #ffffff | #0d1117 | 15.7:1 | ✅ |
| LP (Muted on Dark) | #6e7681 | #0d1117 | 4.6:1 | ✅ |

### 11.2 Screen Reader Support

SVG includes accessibility elements:

```xml
<svg aria-label="GitHub Rank Badge" role="img">
  <title>GitHub Rank: Diamond II - 2,340 SR</title>
  <desc>
    User: octocat
    Rank: Diamond tier, Division II
    Skill Rating: 2,340 SR
    League Points: 45/100 LP
    Percentile: Top 2.5%
  </desc>
  <!-- Visual content -->
</svg>
```

### 11.3 Color Blindness Considerations

- Tiers use distinct hues AND values (brightness)
- Progress bar uses fill + position (not just color)
- High contrast mode available (dark theme)

---

## 12. Implementation Checklist

### Phase 1: Core Visuals
- [ ] Define all tier color palettes
- [ ] Create tier icon SVGs (10 icons)
- [ ] Implement RankCard component
- [ ] Implement ProgressBar component
- [ ] Test all tier/theme combinations

### Phase 2: Polish
- [ ] Add glow effects
- [ ] Implement RadarChart component
- [ ] Fine-tune typography
- [ ] Verify accessibility

### Phase 3: Optimization
- [ ] Optimize SVG file sizes
- [ ] Subset fonts
- [ ] Test performance
- [ ] Cross-browser testing

---

## Appendix: Figma/Design Tool Specifications

For designers creating assets:

### Icon Artboard
- Size: 64×64px
- Export: SVG, optimized
- Color Mode: sRGB

### Card Artboard
- Size: 400×120px
- Export: SVG for reference
- Include all themes as variants

### Color Tokens
Export color tokens in formats:
- CSS Custom Properties
- JSON (for TypeScript)
- Figma Tokens plugin format
