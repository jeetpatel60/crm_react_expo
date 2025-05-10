import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useThemeContext } from '../context';

/**
 * A component that displays the current theme mode
 * This is useful for debugging theme issues
 */
const ThemeIndicator = () => {
  const { themeMode, isDarkMode, setThemeMode } = useThemeContext();
  const theme = useTheme();

  return (
    <View style={[styles.container, {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.outline,
    }]}>
      <Text style={{
        color: theme.colors.onPrimaryContainer,
        fontWeight: 'bold',
        marginBottom: 12,
        fontSize: 16
      }}>
        Theme Settings {isDarkMode ? '🌙' : '☀️'}
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          mode={themeMode === 'light' ? 'contained' : 'outlined'}
          onPress={() => setThemeMode('light')}
          icon="white-balance-sunny"
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Light
        </Button>

        <Button
          mode={themeMode === 'dark' ? 'contained' : 'outlined'}
          onPress={() => setThemeMode('dark')}
          icon="moon-waning-crescent"
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Dark
        </Button>

        <Button
          mode={themeMode === 'system' ? 'contained' : 'outlined'}
          onPress={() => setThemeMode('system')}
          icon="theme-light-dark"
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Auto
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    marginHorizontal: 4,
    minWidth: 90,
  },
  buttonContent: {
    paddingVertical: 6,
  }
});

export default ThemeIndicator;
