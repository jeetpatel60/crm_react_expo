import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated';

import { AppNavigator } from './src/navigation';
import { useThemeManager } from './src/hooks';
import { initializeDatabase } from './src/utils';
import { addSampleAgreementTemplate } from './src/utils/sampleTemplateUtils';
import { initializeBackupSystem } from './src/utils/backupUtils';
import { LoadingIndicator } from './src/components';
import { ThemeProvider, useThemeContext } from './src/context';
import { animations, shadows } from './src/constants/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Reanimated 2',
  'AsyncStorage has been extracted',
  'DatePickerIOS has been merged',
]);

// Create animated components
const AnimatedView = Animated.createAnimatedComponent(View);

// Main app component with theme provider
// This component will be rendered inside ThemeProvider
const MainApp = () => {
  // Get theme from context
  const { theme, isDarkMode } = useThemeContext();
  const [appReady, setAppReady] = useState(false);

  // Set app ready after a short delay to allow for smooth animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AnimatedView
          style={styles.container}
          entering={FadeIn.duration(animations.duration.entrance)}
        >
          <AppNavigator />
        </AnimatedView>
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

        // Add a sample agreement template only if no templates exist
        try {
          const templateId = await addSampleAgreementTemplate();
          if (templateId > 0) {
            console.log('Sample agreement template added successfully with ID:', templateId);
          } else {
            console.log('Sample agreement template not added - templates already exist');
          }
        } catch (templateError) {
          console.warn('Failed to add sample agreement template:', templateError);
          // Continue even if template creation fails
        }

        // Initialize backup system
        try {
          await initializeBackupSystem();
          console.log('Backup system initialized successfully');
        } catch (backupError) {
          console.warn('Failed to initialize backup system:', backupError);
          // Continue even if backup initialization fails
        }
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
        <AnimatedView
          style={styles.container}
          entering={FadeIn.duration(animations.duration.standard)}
        >
          <LoadingIndicator message="Initializing app..." />
        </AnimatedView>
      </PaperProvider>
    );
  }

  if (error) {
    return (
      <PaperProvider theme={themeManager.theme}>
        <AnimatedView
          style={styles.container}
          entering={SlideInUp.duration(animations.duration.standard)}
        >
          <View style={[styles.errorContainer, shadows.md]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </AnimatedView>
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
  errorContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
  },
});
