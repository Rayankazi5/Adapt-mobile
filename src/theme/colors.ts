// Resolved (sRGB) equivalents of the oklch() tokens in global.css / the web
// app's globals.css. NativeWind resolves oklch() for classNames on its own;
// these exist only for the handful of RN APIs that need a literal JS color
// string instead of a className (ActivityIndicator, tab bar tint, StatusBar).
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
}

export const lightColors: ThemeColors = {
  background: '#ffffff',
  card: '#ffffff',
  foreground: '#0a0a0a',
  muted: '#ececf0',
  mutedForeground: '#717182',
  border: '#0000001a',
  primary: '#030213',
  primaryForeground: '#ffffff',
  destructive: '#d4183d',
};

export const darkColors: ThemeColors = {
  background: '#0a0a0a',
  card: '#0a0a0a',
  foreground: '#fafafa',
  muted: '#262626',
  mutedForeground: '#a1a1a1',
  border: '#262626',
  primary: '#fafafa',
  primaryForeground: '#171717',
  destructive: '#82181a',
};
