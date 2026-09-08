import { vars } from 'nativewind';
import React, { PropsWithChildren } from 'react';
import { useColorScheme, View } from 'react-native';
import { darkVars, lightVars } from './tokens';

const lightThemeVars = vars(lightVars);
const darkThemeVars = vars(darkVars);

// Overrides global.css's --variables at runtime based on the OS color
// scheme. See the note in global.css for why this exists instead of a
// `.dark` class or a prefers-color-scheme media query.
export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  return (
    <View style={[{ flex: 1 }, scheme === 'dark' ? darkThemeVars : lightThemeVars]}>
      {children}
    </View>
  );
}
