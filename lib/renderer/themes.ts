export type ThemeName =
  | 'default'
  | 'dark'
  | 'light'
  | 'minimal'
  | 'cyberpunk'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'galaxy';

export interface ThemeConfig {
  name: ThemeName;
  background: {
    primary: string;
    secondary: string;
    border: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  default: {
    name: 'default',
    background: {
      primary: '#0d1117',
      secondary: '#161b22',
      border: '#30363d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8b949e',
      muted: '#6e7681',
    },
  },
  dark: {
    name: 'dark',
    background: {
      primary: '#000000',
      secondary: '#0a0a0a',
      border: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8b949e',
      muted: '#6e7681',
    },
  },
  light: {
    name: 'light',
    background: {
      primary: '#ffffff',
      secondary: '#f6f8fa',
      border: '#d0d7de',
    },
    text: {
      primary: '#0d1117',
      secondary: '#57606a',
      muted: '#8c959f',
    },
  },
  minimal: {
    name: 'minimal',
    background: {
      primary: 'transparent',
      secondary: 'transparent',
      border: '#30363d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8b949e',
      muted: '#6e7681',
    },
  },
  cyberpunk: {
    name: 'cyberpunk',
    background: {
      primary: '#0a0a0f',
      secondary: '#1a1a2e',
      border: '#ff00ff',
    },
    text: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      muted: '#8b5cf6',
    },
  },
  ocean: {
    name: 'ocean',
    background: {
      primary: '#0c1929',
      secondary: '#1a365d',
      border: '#2b6cb0',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#90cdf4',
      muted: '#63b3ed',
    },
  },
  forest: {
    name: 'forest',
    background: {
      primary: '#0d1f0d',
      secondary: '#1a3a1a',
      border: '#2f5f2f',
    },
    text: {
      primary: '#d4edda',
      secondary: '#68d391',
      muted: '#48bb78',
    },
  },
  sunset: {
    name: 'sunset',
    background: {
      primary: '#1a0a0a',
      secondary: '#2d1515',
      border: '#c53030',
    },
    text: {
      primary: '#fed7d7',
      secondary: '#fc8181',
      muted: '#f56565',
    },
  },
  galaxy: {
    name: 'galaxy',
    background: {
      primary: '#0d0d1a',
      secondary: '#1a1a33',
      border: '#6b46c1',
    },
    text: {
      primary: '#e9d8fd',
      secondary: '#b794f4',
      muted: '#9f7aea',
    },
  },
};

export function getTheme(theme: ThemeName): ThemeConfig {
  return THEMES[theme] ?? THEMES.default;
}
