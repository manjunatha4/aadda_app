import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: '🏠', inactive: '🏠' },
  chaos: { active: '📁', inactive: '📁' },
  chats: { active: '💬', inactive: '💬' },
  profile: { active: '👤', inactive: '👤' },
};

function FloatingGlassTabBar({ state, descriptors, navigation }: any) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <View
        pointerEvents="auto"
        style={[
          {
            width: '92%',
            maxWidth: 360,
            height: 64,
            borderRadius: 36,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          },
          Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.04)',
              } as any)
            : {},
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] || { active: '✨', inactive: '✨' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={[
                  {
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isFocused ? '#EEF2FF' : 'transparent',
                    borderWidth: isFocused ? 1 : 0,
                    borderColor: isFocused ? '#C7D2FE' : 'transparent',
                  },
                  isFocused && Platform.OS === 'web'
                    ? ({
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                      } as any)
                    : {},
                ]}
              >
                <Text
                  style={{
                    fontSize: 22,
                    opacity: isFocused ? 1 : 0.65,
                    transform: [{ scale: isFocused ? 1.08 : 1 }],
                  }}
                >
                  {isFocused ? icons.active : icons.inactive}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isKn ? 'ಇಂದು' : 'Today',
        }}
      />
      <Tabs.Screen
        name="chaos"
        options={{
          title: isKn ? 'ಡೈಲಿ ಕೆಯೋಸ್' : 'Daily Chaos',
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: isKn ? 'ಚಾಟ್‌ಗಳು' : 'Chats',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
        }}
      />
    </Tabs>
  );
}
