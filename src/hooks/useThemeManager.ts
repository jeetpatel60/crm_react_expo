import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeManager = () => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState(systemColorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [systemColorScheme, themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prevMode) => {
      if (prevMode === 'light') {
        setTheme(darkTheme);
        return 'dark';
      } else if (prevMode === 'dark') {
        return 'system';
      } else {
        setTheme(lightTheme);
        return 'light';
      }
    });
  }, []);

  const changeThemeMode = useCallback((mode: ThemeMode) => {
    if (mode === 'light') {
      setTheme(lightTheme);
    } else if (mode === 'dark') {
      setTheme(darkTheme);
    } else {
      setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    }
    setThemeModeState(mode);
  }, [systemColorScheme]);

  return {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode: changeThemeMode,
    isDarkMode: theme === darkTheme,
  };
};

export default useThemeManager;
