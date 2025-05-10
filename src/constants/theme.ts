import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Easing } from 'react-native-reanimated';

// Ultra-modern 2025 color palette with premium feel
const colors = {
  // Primary colors - Refined indigo with more depth
  primary: '#4F46E5', // Deeper indigo for more premium feel
  primaryDark: '#3730A3', // Even deeper for dark mode
  primaryLight: '#C7D2FE', // Lighter tint with better contrast

  // Secondary colors - Sophisticated pink/purple
  secondary: '#E879F9', // Vibrant but sophisticated purple
  secondaryDark: '#C026D3', // Deeper for dark mode
  secondaryLight: '#F5D0FE', // Lighter tint

  // Accent color - For highlights and special elements
  accent: '#22D3EE', // Bright cyan for accents
  accentDark: '#0891B2', // Deeper for dark mode
  accentLight: '#A5F3FC', // Lighter tint

  // Background colors - Subtle and refined
  background: '#F8FAFC', // Slightly blue-tinted white for light mode
  backgroundDark: '#0F172A', // Deep blue-black for dark mode

  // Surface colors - For cards and elevated surfaces
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9', // Subtle variant for secondary surfaces
  surfaceDark: '#1E293B', // Deep blue-gray for dark mode
  surfaceVariantDark: '#334155', // Lighter variant for dark mode

  // Functional colors
  error: '#EF4444', // Red
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  info: '#3B82F6', // Blue

  // Text colors - Improved contrast and readability
  text: '#0F172A', // Nearly black with blue undertone
  textDark: '#F8FAFC', // Nearly white with blue undertone
  textSecondary: '#64748B', // Slate gray for secondary text
  textSecondaryDark: '#94A3B8', // Lighter slate for dark mode

  // Border colors - Subtle and refined
  border: '#E2E8F0', // Light gray with blue tint
  borderDark: '#334155', // Dark slate
};

// Light theme with enhanced colors
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.accent,
    tertiaryContainer: colors.accentLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onError: '#FFFFFF',
    outline: colors.border,
    elevation: {
      level0: 'transparent',
      level1: colors.surfaceVariant,
      level2: colors.surfaceVariant,
      level3: colors.surfaceVariant,
      level4: colors.surfaceVariant,
      level5: colors.surfaceVariant,
    },
  },
};

// Dark theme with enhanced colors
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryDark,
    tertiary: colors.accent,
    tertiaryContainer: colors.accentDark,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    surfaceVariant: colors.surfaceVariantDark,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onBackground: colors.textDark,
    onSurface: colors.textDark,
    onSurfaceVariant: colors.textSecondaryDark,
    onError: '#FFFFFF',
    outline: colors.borderDark,
    elevation: {
      level0: 'transparent',
      level1: colors.surfaceVariantDark,
      level2: colors.surfaceVariantDark,
      level3: colors.surfaceVariantDark,
      level4: colors.surfaceVariantDark,
      level5: colors.surfaceVariantDark,
    },
  },
};

// Typography
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Enhanced shadows for premium look
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Animation constants for consistent transitions
export const animations = {
  // Durations
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 400,
    entrance: 500,
    exit: 250,
  },
  // Easing curves
  easing: {
    standard: Easing.bezier(0.4, 0.0, 0.2, 1), // Standard material easing
    accelerate: Easing.bezier(0.4, 0.0, 1, 1), // Accelerate easing
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1), // Decelerate easing
    sharp: Easing.bezier(0.4, 0.0, 0.6, 1), // Sharp curve
    bounce: Easing.bezier(0.175, 0.885, 0.32, 1.275), // Bounce effect
  },
  // Common animation configurations
  config: {
    stiff: {
      damping: 20,
      mass: 1,
      stiffness: 180,
    },
    gentle: {
      damping: 14,
      mass: 1,
      stiffness: 120,
    },
    wobbly: {
      damping: 12,
      mass: 1,
      stiffness: 180,
    },
    slow: {
      damping: 18,
      mass: 1,
      stiffness: 80,
    },
  },
};
