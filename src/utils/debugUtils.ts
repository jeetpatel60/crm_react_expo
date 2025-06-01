import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug logging utility for APK builds
export class DebugLogger {
  private static logs: string[] = [];
  private static maxLogs = 100;

  static log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Always log to console
    console.log(logEntry);
    
    // Store in memory for later retrieval
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Store in AsyncStorage for persistence
    this.persistLogs();
  }

  static error(message: string, error?: any) {
    let errorMessage = message;
    if (error) {
      if (error instanceof Error) {
        errorMessage += ` - ${error.name}: ${error.message}`;
        if (error.stack) {
          errorMessage += `\nStack: ${error.stack}`;
        }
      } else {
        errorMessage += ` - ${String(error)}`;
      }
    }
    this.log(errorMessage, 'error');
  }

  static warn(message: string) {
    this.log(message, 'warn');
  }

  static info(message: string) {
    this.log(message, 'info');
  }

  private static async persistLogs() {
    try {
      await AsyncStorage.setItem('debug_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to persist debug logs:', error);
    }
  }

  static async getLogs(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem('debug_logs');
      if (stored) {
        const storedLogs = JSON.parse(stored);
        return [...storedLogs, ...this.logs];
      }
      return this.logs;
    } catch (error) {
      console.error('Failed to retrieve debug logs:', error);
      return this.logs;
    }
  }

  static async clearLogs() {
    this.logs = [];
    try {
      await AsyncStorage.removeItem('debug_logs');
    } catch (error) {
      console.error('Failed to clear debug logs:', error);
    }
  }

  static async showDebugInfo() {
    const logs = await this.getLogs();
    const recentLogs = logs.slice(-20); // Show last 20 logs
    
    const debugInfo = [
      `Platform: ${Platform.OS} ${Platform.Version}`,
      `App Version: 1.0.0`,
      `Timestamp: ${new Date().toISOString()}`,
      '',
      'Recent Logs:',
      ...recentLogs
    ].join('\n');

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Debug Information',
        debugInfo,
        [
          { text: 'Copy to Clipboard', onPress: () => this.copyToClipboard(debugInfo) },
          { text: 'Clear Logs', onPress: () => this.clearLogs() },
          { text: 'Close' }
        ]
      );
    } else {
      console.log('=== DEBUG INFO ===');
      console.log(debugInfo);
    }
  }

  private static copyToClipboard(text: string) {
    // This would require expo-clipboard or similar
    console.log('Debug info copied to console:', text);
  }
}

// System information utility
export const getSystemInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    timestamp: new Date().toISOString(),
    isDebug: __DEV__,
  };
};

// Error boundary helper
export const handleGlobalError = (error: any, isFatal: boolean = false) => {
  DebugLogger.error(`Global error (fatal: ${isFatal})`, error);
  
  if (isFatal && Platform.OS !== 'web') {
    Alert.alert(
      'Critical Error',
      'The app encountered a critical error. Please restart the app.',
      [
        { text: 'Show Debug Info', onPress: () => DebugLogger.showDebugInfo() },
        { text: 'Restart App', onPress: () => {
          // This would require a restart mechanism
          console.log('App restart requested');
        }}
      ]
    );
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(name: string) {
    this.timers.set(name, Date.now());
    DebugLogger.info(`Timer started: ${name}`);
  }

  static endTimer(name: string) {
    const startTime = this.timers.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      DebugLogger.info(`Timer ended: ${name} - Duration: ${duration}ms`);
      this.timers.delete(name);
      return duration;
    }
    DebugLogger.warn(`Timer not found: ${name}`);
    return 0;
  }
}
