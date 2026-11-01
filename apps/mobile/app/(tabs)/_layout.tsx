import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';

interface TabItemConfig {
  name: string;
  activeIcon: string;
  inactiveIcon: string;
  labelEn: string;
  labelKn: string;
}

const LEFT_TABS: TabItemConfig[] = [
  { name: 'index', activeIcon: '📑', inactiveIcon: '📑', labelEn: 'Feed', labelKn: 'ಫೀಡ್' },
  { name: 'buzz', activeIcon: '🔍', inactiveIcon: '🔍', labelEn: 'Search', labelKn: 'ಹುಡುಕಿ' },
];

const RIGHT_TABS: TabItemConfig[] = [
  { name: 'chaos', activeIcon: '📰', inactiveIcon: '📰', labelEn: 'News', labelKn: 'ಸುದ್ದಿ' },
  { name: 'chats', activeIcon: '💬', inactiveIcon: '💬', labelEn: 'Chats', labelKn: 'ಚಾಟ್' },
];

function FloatingGlassTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();

  // Helper to render a tab item
  const renderTab = (tabConfig: TabItemConfig) => {
    const routeIndex = state.routes.findIndex((r: any) => r.name === tabConfig.name);
    if (routeIndex === -1) return null;
    const route = state.routes[routeIndex];
    const isFocused = state.index === routeIndex;

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
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isFocused ? '#EEF2FF' : 'transparent',
              borderWidth: isFocused ? 1.5 : 0,
              borderColor: isFocused ? '#818CF8' : 'transparent',
            },
            isFocused && Platform.OS === 'web'
              ? ({
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)',
              } as any)
              : {},
          ]}
        >
          <Text
            style={{
              fontSize: 20,
              opacity: isFocused ? 1 : 0.6,
              transform: [{ scale: isFocused ? 1.1 : 1 }],
            }}
          >
            {isFocused ? tabConfig.activeIcon : tabConfig.inactiveIcon}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        bottom: 22,
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
            maxWidth: 380,
            height: 68,
            borderRadius: 36,
            backgroundColor: '#FFFFFF',
            borderWidth: 1.5,
            borderColor: 'rgba(0, 0, 0, 0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.14,
            shadowRadius: 22,
            elevation: 12,
          },
          Platform.OS === 'web'
            ? ({
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow:
                '0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            } as any)
            : {},
        ]}
      >
        {/* Left Tabs (Feed & Search) */}
        {LEFT_TABS.map((tab) => renderTab(tab))}

        {/* Center Floating Action Button (Dribbble Mockup Exact Center + Circle) */}
        <View style={{ width: 64, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/buzz/create' as any)}
            activeOpacity={0.85}
            style={[
              {
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#6366F1',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: -14 }],
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.38,
                shadowRadius: 12,
                elevation: 10,
                borderWidth: 3,
                borderColor: '#FFFFFF',
              },
              Platform.OS === 'web'
                ? ({
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.45)',
                } as any)
                : {},
            ]}
          >
            <Text
              style={{
                fontSize: 28,
                color: '#FFFFFF',
                fontWeight: '600',
                lineHeight: 30,
                textAlign: 'center',
                marginTop: -2,
              }}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Tabs (Real News & Chats) */}
        {RIGHT_TABS.map((tab) => renderTab(tab))}
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
          title: isKn ? 'ಮುಖಪುಟ' : 'Feed',
        }}
      />
      <Tabs.Screen
        name="buzz"
        options={{
          title: isKn ? 'ಅನ್ವೇಷಿಸಿ' : 'Search',
        }}
      />
      <Tabs.Screen
        name="chaos"
        options={{
          title: isKn ? 'ಸುದ್ದಿ ಮತ್ತು ಫೋಟೋಗಳು' : 'News Feed',
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
          href: null, // accessible via top-right avatar
        }}
      />
    </Tabs>
  );
}
