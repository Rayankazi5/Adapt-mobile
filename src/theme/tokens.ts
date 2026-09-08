// Full --variable sets mirroring the web app's globals.css design tokens,
// applied at runtime via NativeWind's vars() (see ThemeProvider.tsx).
//
// These are sRGB hex equivalents of the web app's oklch() values, not the
// oklch() strings themselves: NativeWind's native style resolver parses
// oklch()/lab() color functions only in stylesheets it compiles at build
// time (e.g. global.css's own :root block), not in values handed to vars()
// at runtime — passing oklch() strings there rendered as blended/incorrect
// colors. The hex values below are exact (computed by running the web
// export's Lightning CSS pipeline over the same oklch() tokens).
export const lightVars = {
  '--background': '#ffffff',
  '--foreground': '#0a0a0a',
  '--card': '#ffffff',
  '--card-foreground': '#0a0a0a',
  '--popover': '#ffffff',
  '--popover-foreground': '#0a0a0a',
  '--primary': '#030213',
  '--primary-foreground': '#ffffff',
  '--secondary': '#eceef2',
  '--secondary-foreground': '#030213',
  '--muted': '#ececf0',
  '--muted-foreground': '#717182',
  '--accent': '#e9ebef',
  '--accent-foreground': '#030213',
  '--destructive': '#d4183d',
  '--destructive-foreground': '#ffffff',
  '--border': '#0000001a',
  '--input-background': '#f3f3f5',
  '--ring': '#a1a1a1',
};

export const darkVars = {
  '--background': '#0a0a0a',
  '--foreground': '#fafafa',
  '--card': '#0a0a0a',
  '--card-foreground': '#fafafa',
  '--popover': '#0a0a0a',
  '--popover-foreground': '#fafafa',
  '--primary': '#fafafa',
  '--primary-foreground': '#171717',
  '--secondary': '#262626',
  '--secondary-foreground': '#fafafa',
  '--muted': '#262626',
  '--muted-foreground': '#a1a1a1',
  '--accent': '#262626',
  '--accent-foreground': '#fafafa',
  '--destructive': '#82181a',
  '--destructive-foreground': '#fb2c36',
  '--border': '#262626',
  '--input-background': '#262626',
  '--ring': '#525252',
};
