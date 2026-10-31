import React from 'react';
import { View, ViewStyle, Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: 'light' | 'medium' | 'dark' | 'ultra';
  tint?: 'dark' | 'light' | 'accent' | 'coral' | 'blue';
  borderOpacity?: number;
  borderRadius?: number;
}

/**
 * Premium Glassmorphism Container with true backdrop blur & layered lighting
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 'medium',
  tint = 'dark',
  borderOpacity = 0.16,
  borderRadius = 24,
}) => {
  // Background colors per tint and intensity
  let bg = 'rgba(24, 24, 30, 0.72)';
  let borderColor = `rgba(255, 255, 255, ${borderOpacity})`;
  let blur = '20px';

  if (tint === 'light') {
    bg = intensity === 'light' ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.75)';
    borderColor = `rgba(255, 255, 255, 0.8)`;
  } else if (tint === 'dark') {
    bg = intensity === 'light' ? 'rgba(20, 20, 26, 0.55)' : intensity === 'ultra' ? 'rgba(16, 16, 22, 0.85)' : 'rgba(22, 22, 28, 0.72)';
    borderColor = `rgba(255, 255, 255, ${borderOpacity})`;
  } else if (tint === 'coral') {
    bg = 'rgba(255, 100, 100, 0.82)';
    borderColor = 'rgba(255, 255, 255, 0.35)';
  } else if (tint === 'blue') {
    bg = 'rgba(45, 120, 255, 0.82)';
    borderColor = 'rgba(255, 255, 255, 0.35)';
  }

  const webGlassStyle: any = Platform.OS === 'web' ? {
    backdropFilter: `blur(${blur})`,
    WebkitBackdropFilter: `blur(${blur})`,
    boxShadow: tint === 'light'
      ? '0 10px 30px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)'
      : '0 12px 40px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2)',
  } : {};

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderWidth: 1,
          borderColor,
          borderRadius,
          overflow: 'hidden',
        },
        webGlassStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface GlassPillProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  active?: boolean;
}

export const GlassPill: React.FC<GlassPillProps> = ({ children, style, onPress, active }) => {
  const content = (
    <View
      style={[
        {
          backgroundColor: active ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: active ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.18)',
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 5,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            } as any)
          : {},
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
