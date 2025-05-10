import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation';
import { useThemeManager } from './src/hooks';
import { initializeDatabase } from './src/utils';
import { LoadingIndicator } from './src/components';
import { ThemeProvider, useThemeContext } from './src/context';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Reanimated 2',
  'AsyncStorage has been extracted',
  'DatePickerIOS has been merged',
]);

// Main app component with theme provider
// This component will be rendered inside ThemeProvider
const MainApp = () => {
  // Get theme from context
  const { theme, isDarkMode } = useThemeContext();

  console.log('MainApp rendering with theme:', isDarkMode ? 'dark' : 'light');

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AppNavigator />
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default function App() {
  // Use theme manager for initial theme
  const themeManager = useThemeManager();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        console.log('Starting database initialization...');
        await initializeDatabase();
        console.log('Database initialization completed successfully');
      } catch (err) {
        console.error('Failed to initialize the app', err);
        setError(`Failed to initialize the database: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    setup();
  }, []);

  if (loading) {
    return (
      <PaperProvider theme={themeManager.theme}>
        <View style={styles.container}>
          <LoadingIndicator message="Initializing app..." />
        </View>
      </PaperProvider>
    );
  }

  if (error) {
    return (
      <PaperProvider theme={themeManager.theme}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </PaperProvider>
    );
  }

  // Wrap everything in GestureHandlerRootView for gesture support
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ThemeProvider must be rendered before any component that uses useThemeContext */}
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
});
