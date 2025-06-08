import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, LogBox, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, Button } from 'react-native-paper';
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
import { DebugLogger, PerformanceMonitor, getSystemInfo } from './src/utils/debugUtils';
import { LoadingIndicator, FallbackScreen, ErrorBoundary, SplashScreen } from './src/components';
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
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializationStep, setInitializationStep] = useState('Starting...');
  const [retryCount, setRetryCount] = useState(0);

  const initializeApp = async () => {
    try {
      PerformanceMonitor.startTimer('app_initialization');

      setInitializationStep('Checking platform compatibility...');
      DebugLogger.info('=== APP INITIALIZATION START ===');

      const systemInfo = getSystemInfo();
      DebugLogger.info(`System Info: ${JSON.stringify(systemInfo)}`);

      setInitializationStep('Initializing database...');
      PerformanceMonitor.startTimer('database_initialization');
      DebugLogger.info('Starting database initialization...');
      await initializeDatabase();
      PerformanceMonitor.endTimer('database_initialization');
      DebugLogger.info('Database initialization completed successfully');

      // Add a sample agreement template only if no templates exist
      setInitializationStep('Setting up templates...');
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
      setInitializationStep('Initializing backup system...');
      try {
        await initializeBackupSystem();
        console.log('Backup system initialized successfully');
      } catch (backupError) {
        console.warn('Failed to initialize backup system:', backupError);
        // Continue even if backup initialization fails
      }

      setInitializationStep('Finalizing...');
      PerformanceMonitor.endTimer('app_initialization');
      DebugLogger.info('=== APP INITIALIZATION COMPLETE ===');
    } catch (err) {
      PerformanceMonitor.endTimer('app_initialization');
      DebugLogger.error('=== APP INITIALIZATION FAILED ===', err);

      const errorMessage = `Failed to initialize the app: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);

      // Show alert for critical errors with debug option
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Initialization Error',
          errorMessage,
          [
            { text: 'Show Debug Info', onPress: () => DebugLogger.showDebugInfo() },
            { text: 'Retry', onPress: () => handleRetry() },
            { text: 'Continue Anyway', onPress: () => setLoading(false) }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    setInitializationStep('Retrying...');
    console.log(`=== RETRY ATTEMPT ${retryCount + 1} ===`);
    initializeApp();
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
    // Start app initialization after splash screen finishes
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);
  };

  useEffect(() => {
    // Don't start initialization until splash screen is finished
    // The splash screen will trigger initialization via handleSplashFinish
  }, []);

  // Show splash screen first
  if (showSplash) {
    return (
      <PaperProvider theme={themeManager.theme}>
        <SafeAreaProvider>
          <SplashScreen onFinish={handleSplashFinish} />
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  if (loading) {
    return (
      <PaperProvider theme={themeManager.theme}>
        <SafeAreaProvider>
          <AnimatedView
            style={styles.container}
            entering={FadeIn.duration(animations.duration.standard)}
          >
            <LoadingIndicator
              message={`${initializationStep}${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}`}
            />
          </AnimatedView>
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  if (error) {
    return (
      <PaperProvider theme={themeManager.theme}>
        <SafeAreaProvider>
          <FallbackScreen
            error={error}
            onRetry={retryCount < 3 ? handleRetry : undefined}
            onShowDebug={() => DebugLogger.showDebugInfo()}
          />
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  // Wrap everything in GestureHandlerRootView for gesture support
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        {/* ThemeProvider must be rendered before any component that uses useThemeContext */}
        <ThemeProvider>
          <MainApp />
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#d32f2f',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
  continueButton: {
    minWidth: 120,
  },
});
