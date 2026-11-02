import React from 'react';
import { View, Image, Platform, StyleProp, ViewStyle, ImageStyle } from 'react-native';

const LOGO_SOURCE = require('../../assets/logo.png');

export interface BrandLogoProps {
  size?: number;
  withGlow?: boolean;
  glowColor?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function BrandLogo({
  size = 36,
  withGlow = false,
  glowColor = '#38BDF8',
  style,
  imageStyle,
}: BrandLogoProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        style,
      ]}
    >
      {withGlow && (
        <View
          style={{
            position: 'absolute',
            width: size * 1.18,
            height: size * 1.18,
            borderRadius: (size * 1.18) / 2,
            backgroundColor: glowColor,
            opacity: 0.35,
            ...(Platform.OS === 'web' ? ({ filter: `blur(${Math.max(6, size * 0.22)}px)` } as any) : {}),
          }}
        />
      )}
      <Image
        source={LOGO_SOURCE}
        style={[
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.22),
          },
          Platform.OS === 'web'
            ? ({
                userSelect: 'none',
                WebkitUserSelect: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(14, 165, 233, 0.35))',
              } as any)
            : {
                shadowColor: '#0EA5E9',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export default BrandLogo;
