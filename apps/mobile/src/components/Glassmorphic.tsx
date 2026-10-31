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
 * Premium White Glassmorphism Container with true backdrop blur & soft shadows
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 'medium',
  tint = 'light',
  borderOpacity = 0.1,
  borderRadius = 20,
}) => {
  let bg = 'rgba(255, 255, 255, 0.95)';
  let borderColor = '#E2E8F0';
  let blur = '16px';

  if (tint === 'accent') {
    bg = 'rgba(99, 102, 241, 0.08)';
    borderColor = '#C7D2FE';
  } else if (tint === 'coral') {
    bg = 'rgba(239, 68, 68, 0.06)';
    borderColor = '#FECACA';
  } else if (tint === 'blue') {
    bg = 'rgba(2, 132, 199, 0.06)';
    borderColor = '#BAE6FD';
  }

  const webGlassStyle: any = Platform.OS === 'web' ? {
    backdropFilter: `blur(${blur})`,
    WebkitBackdropFilter: `blur(${blur})`,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.02)',
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
          backgroundColor: active ? '#EEF2FF' : '#F8FAFC',
          borderWidth: 1,
          borderColor: active ? '#C7D2FE' : '#E2E8F0',
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
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
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};
