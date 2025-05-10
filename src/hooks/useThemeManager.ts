import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

// Storage key for theme preference
const THEME_STORAGE_KEY = '@crm_app_theme_mode';

export const useThemeManager = () => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState(systemColorScheme === 'dark' ? darkTheme : lightTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference on initial mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedThemeMode) {
          const mode = savedThemeMode as ThemeMode;
          setThemeModeState(mode);

          if (mode === 'light') {
            setTheme(lightTheme);
          } else if (mode === 'dark') {
            setTheme(darkTheme);
          } else {
            // System mode
            setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setIsInitialized(true);
      }
    };

    loadSavedTheme();
  }, [systemColorScheme]);

  // Update theme when system color scheme changes (if in system mode)
  useEffect(() => {
    if (themeMode === 'system' && isInitialized) {
      setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [systemColorScheme, themeMode, isInitialized]);

  // Save theme preference when it changes
  useEffect(() => {
    if (isInitialized) {
      AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode).catch(error => {
        console.error('Failed to save theme preference:', error);
      });
    }
  }, [themeMode, isInitialized]);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prevMode) => {
      if (prevMode === 'light') {
        setTheme(darkTheme);
        return 'dark';
      } else if (prevMode === 'dark') {
        setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
        return 'system';
      } else {
        setTheme(lightTheme);
        return 'light';
      }
    });
  }, [systemColorScheme]);

  const changeThemeMode = useCallback((mode: ThemeMode) => {
    console.log('Changing theme mode to:', mode);

    if (mode === 'light') {
      console.log('Setting light theme');
      setTheme(lightTheme);
    } else if (mode === 'dark') {
      console.log('Setting dark theme');
      setTheme(darkTheme);
    } else {
      console.log('Setting system theme, system is:', systemColorScheme);
      setTheme(systemColorScheme === 'dark' ? darkTheme : lightTheme);
    }

    setThemeModeState(mode);

    // Force immediate update for debugging
    setTimeout(() => {
      console.log('Theme updated to:', mode);
      console.log('Current theme is dark?', mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark'));
    }, 100);
  }, [systemColorScheme]);

  // Calculate isDarkMode based on the current theme
  const isDarkMode = theme === darkTheme;

  // For debugging
  console.log('Theme mode:', themeMode);
  console.log('Is dark mode:', isDarkMode);
  console.log('Theme:', theme === lightTheme ? 'light theme' : 'dark theme');

  return {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode: changeThemeMode,
    isDarkMode,
    isInitialized,
  };
};

export default useThemeManager;
