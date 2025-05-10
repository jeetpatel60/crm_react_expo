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

// Ignore specific warnings
LogBox.ignoreLogs([
  'Reanimated 2',
  'AsyncStorage has been extracted',
  'DatePickerIOS has been merged',
]);

export default function App() {
  const { theme } = useThemeManager();
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
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          <LoadingIndicator message="Initializing app..." />
        </View>
      </PaperProvider>
    );
  }

  if (error) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          <AppNavigator />
        </SafeAreaProvider>
      </PaperProvider>
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
