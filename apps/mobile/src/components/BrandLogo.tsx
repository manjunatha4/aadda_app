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
        },
        style,
      ]}
    >
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
              } as any)
            : {},
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export default BrandLogo;

