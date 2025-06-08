import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { APP_NAME } from '../constants';
import { animations, spacing, typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const theme = useTheme();
  
  // Animation values
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);

  useEffect(() => {
    // Start animations
    logoOpacity.value = withTiming(1, {
      duration: animations.duration.entrance,
      easing: animations.easing.decelerate,
    });
    
    logoScale.value = withSequence(
      withTiming(1.1, {
        duration: animations.duration.entrance,
        easing: animations.easing.decelerate,
      }),
      withTiming(1, {
        duration: animations.duration.shorter,
        easing: animations.easing.standard,
      })
    );

    // Animate text with delay
    textOpacity.value = withDelay(
      animations.duration.shorter,
      withTiming(1, {
        duration: animations.duration.standard,
        easing: animations.easing.decelerate,
      })
    );
    
    textTranslateY.value = withDelay(
      animations.duration.shorter,
      withTiming(0, {
        duration: animations.duration.standard,
        easing: animations.easing.decelerate,
      })
    );

    // Auto dismiss after 1.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require('../../assets/samvida-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App Name */}
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text 
          variant="displaySmall" 
          style={[
            styles.appName, 
            { 
              color: theme.colors.primary,
              fontWeight: typography.fontWeights.bold as any
            }
          ]}
        >
          {APP_NAME}
        </Text>
      </Animated.View>

      {/* Subtle background gradient effect */}
      <View style={[styles.backgroundGradient, { backgroundColor: theme.colors.primaryContainer + '10' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4, // 40% of screen width
    height: width * 0.4, // Keep it square
    maxWidth: 200,
    maxHeight: 200,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    zIndex: -1,
  },
});

export default SplashScreen;
