export interface ThemeColors {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  success: string;
}

export const lightColors: ThemeColors = {
  background: '#FAFAF9',
  card: '#FFFFFF',
  foreground: '#1C1917',
  muted: '#F1F0EE',
  mutedForeground: '#78716C',
  border: '#E7E5E4',
  primary: '#16A34A',
  primaryForeground: '#FFFFFF',
  destructive: '#DC2626',
  success: '#16A34A',
};

export const darkColors: ThemeColors = {
  background: '#0C0A09',
  card: '#1C1917',
  foreground: '#FAFAF9',
  muted: '#292524',
  mutedForeground: '#A8A29E',
  border: '#292524',
  primary: '#22C55E',
  primaryForeground: '#0C0A09',
  destructive: '#F87171',
  success: '#22C55E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};
