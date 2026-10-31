import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface FloatingProps {
  children: React.ReactNode;
  duration?: number;
  distance?: number;
  delay?: number;
  style?: ViewStyle;
}

export const Floating: React.FC<FloatingProps> = ({
  children,
  duration = 2400,
  distance = 8,
  delay = 0,
  style,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    const timeout = setTimeout(() => {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -distance,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (anim) anim.stop();
    };
  }, [duration, distance, delay]);

  return (
    <Animated.View style={[{ transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

export const Pulse: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
};

