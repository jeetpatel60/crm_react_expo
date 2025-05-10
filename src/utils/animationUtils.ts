import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { animations } from '../constants/theme';

/**
 * Creates a fade-in animation style
 * @param visible Whether the element is visible
 * @param duration Animation duration in ms
 * @returns Animated style object
 */
export const useFadeAnimation = (
  visible: boolean = true,
  duration: number = animations.duration.standard
) => {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: animations.easing.standard,
    });
  }, [visible, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Creates a scale animation style
 * @param visible Whether the element is visible
 * @param duration Animation duration in ms
 * @param initialScale Initial scale value
 * @param finalScale Final scale value
 * @returns Animated style object
 */
export const useScaleAnimation = (
  visible: boolean = true,
  duration: number = animations.duration.standard,
  initialScale: number = 0.9,
  finalScale: number = 1
) => {
  const scale = useSharedValue(visible ? finalScale : initialScale);

  useEffect(() => {
    scale.value = withTiming(visible ? finalScale : initialScale, {
      duration,
      easing: animations.easing.standard,
    });
  }, [visible, duration, initialScale, finalScale, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
};

/**
 * Creates a combined fade and scale animation
 * @param visible Whether the element is visible
 * @param duration Animation duration in ms
 * @returns Animated style object
 */
export const useFadeScaleAnimation = (
  visible: boolean = true,
  duration: number = animations.duration.standard
) => {
  const opacity = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(visible ? 1 : 0.9);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: animations.easing.standard,
    });
    scale.value = withTiming(visible ? 1 : 0.9, {
      duration,
      easing: animations.easing.standard,
    });
  }, [visible, duration, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
};

/**
 * Creates a slide-in animation from the bottom
 * @param visible Whether the element is visible
 * @param duration Animation duration in ms
 * @param distance Distance to slide in pixels
 * @returns Animated style object
 */
export const useSlideInAnimation = (
  visible: boolean = true,
  duration: number = animations.duration.standard,
  distance: number = 50
) => {
  const translateY = useSharedValue(visible ? 0 : distance);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : distance, {
      duration,
      easing: animations.easing.standard,
    });
    opacity.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: animations.easing.standard,
    });
  }, [visible, duration, distance, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
};

/**
 * Creates a staggered animation for list items
 * @param index Item index in the list
 * @param visible Whether the element is visible
 * @param staggerDelay Delay between items in ms
 * @param duration Animation duration in ms
 * @returns Animated style object
 */
export const useStaggeredAnimation = (
  index: number,
  visible: boolean = true,
  staggerDelay: number = 50,
  duration: number = animations.duration.standard
) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(
        index * staggerDelay,
        withTiming(1, { duration, easing: animations.easing.standard })
      );
      translateY.value = withDelay(
        index * staggerDelay,
        withTiming(0, { duration, easing: animations.easing.standard })
      );
    } else {
      opacity.value = withTiming(0, { duration: duration / 2 });
      translateY.value = withTiming(20, { duration: duration / 2 });
    }
  }, [visible, index, staggerDelay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
};

/**
 * Creates a press animation for touchable elements
 * @param pressed Whether the element is being pressed
 * @param scale Scale factor when pressed (0-1)
 * @returns Animated style object
 */
export const usePressAnimation = (
  pressed: boolean,
  scale: number = 0.97
) => {
  const animatedScale = useSharedValue(1);

  useEffect(() => {
    if (pressed) {
      animatedScale.value = withSpring(scale, animations.config.stiff);
    } else {
      animatedScale.value = withSpring(1, animations.config.stiff);
    }
  }, [pressed, scale, animatedScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  return animatedStyle;
};
