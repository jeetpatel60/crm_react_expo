import React, { Component } from 'react';
import { Avatar } from 'react-native-paper';
import Animated from 'react-native-reanimated';

interface AnimatedAvatarTextProps {
  size: number;
  label: string;
  style?: any;
  color?: string;
  entering?: any;
  [key: string]: any; // For any other props
}

// Class component that can be properly animated
class AvatarTextClass extends Component<AnimatedAvatarTextProps> {
  render() {
    const { size, label, style, color, ...rest } = this.props;
    return (
      <Avatar.Text
        size={size}
        label={label}
        style={style}
        color={color}
        {...rest}
      />
    );
  }
}

// Create animated component from class component
const AnimatedAvatarText = Animated.createAnimatedComponent(AvatarTextClass);

export default AnimatedAvatarText;
