import React, { createContext, useContext, ReactNode } from 'react';
import { useThemeManager, ThemeMode } from '../hooks/useThemeManager';
import { MD3Theme } from 'react-native-paper';

// Define the context shape
interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  theme: MD3Theme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { themeMode, isDarkMode, theme, setThemeMode, toggleTheme } = useThemeManager();

  const value = {
    themeMode,
    isDarkMode,
    theme,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
