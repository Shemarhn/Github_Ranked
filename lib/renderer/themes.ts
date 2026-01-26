export type ThemeName = 'default' | 'dark' | 'light' | 'minimal';

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
};

export function getTheme(theme: ThemeName): ThemeConfig {
  return THEMES[theme] ?? THEMES.default;
}
