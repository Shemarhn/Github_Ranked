import satori from 'satori';

import type { AggregatedStats } from '../github/types';
import type { RankResult } from '../ranking/types';
import { RankCard } from './rankCard';
import type { ThemeName } from './themes';

export interface RenderRankCardOptions {
  username: string;
  rank: RankResult;
  stats: AggregatedStats;
  theme?: ThemeName;
}

const CARD_WIDTH = 400;
const CARD_HEIGHT = 120;

const FONT_FAMILY = 'Inter';

async function loadFont(weight: number) {
  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    }
  );

  if (!cssResponse.ok) {
    throw new Error(`Failed to load font CSS for weight ${weight}`);
  }

  const css = await cssResponse.text();
  const match = css.match(/url\((https:\/\/[^)]+)\)/);

  if (!match) {
    throw new Error(`Unable to parse font URL for weight ${weight}`);
  }

  const fontResponse = await fetch(match[1]);
  if (!fontResponse.ok) {
    throw new Error(`Failed to load font binary for weight ${weight}`);
  }

  return fontResponse.arrayBuffer();
}

async function loadFonts() {
  const [regular, semiBold, bold] = await Promise.all([
    loadFont(400),
    loadFont(600),
    loadFont(700),
  ]);

  return [
    {
      name: FONT_FAMILY,
      data: regular,
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: FONT_FAMILY,
      data: semiBold,
      weight: 600 as const,
      style: 'normal' as const,
    },
    {
      name: FONT_FAMILY,
      data: bold,
      weight: 700 as const,
      style: 'normal' as const,
    },
  ];
}

/**
 * Render a RankCard component to SVG using Satori.
 */
export async function renderRankCard({
  username,
  rank,
  stats,
  theme = 'default',
}: RenderRankCardOptions): Promise<string> {
  const fonts = await loadFonts();

  return satori(
    <RankCard username={username} rank={rank} stats={stats} theme={theme} />,
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts,
    }
  );
}
