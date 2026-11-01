import React, { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

interface TabItemConfig {
  name: string;
  labelEn: string;
  labelKn: string;
}

const LEFT_TABS: TabItemConfig[] = [
  { name: 'index', labelEn: 'Feed', labelKn: 'ಮುಖಪುಟ' },
  { name: 'buzz', labelEn: 'Search', labelKn: 'ಹುಡುಕಿ' },
];

const RIGHT_TABS: TabItemConfig[] = [
  { name: 'chaos', labelEn: 'News', labelKn: 'ಸುದ್ದಿ' },
  { name: 'chats', labelEn: 'Rooms', labelKn: 'ರೂಮ್ಸ್' },
];

function TabVectorIcon({ name, isFocused }: { name: string; isFocused: boolean }) {
  const stroke = isFocused ? '#4F46E5' : '#94A3B8';
  const size = 22;

  switch (name) {
    case 'index':
      // 1st: Feed / Home Outline Icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points="9 22 9 12 15 12 15 22"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'buzz':
      // 2nd: Search Lens Outline Icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="11"
            cy="11"
            r="7.5"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="16.5"
            y1="16.5"
            x2="21.5"
            y2="21.5"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'chaos':
      // 3rd: Real News Newspaper Outline Icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="10" y1="6" x2="18" y2="6" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Line x1="10" y1="10" x2="18" y2="10" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Line x1="10" y1="14" x2="15" y2="14" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'chats':
      // 4th (last): Rooms / Chat Bubble Outline Icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="8" y1="9" x2="16" y2="9" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Line x1="8" y1="13" x2="13" y2="13" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

function FloatingGlassTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const isKn = i18n.language === 'kn';
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Helper to render a tab item with identical dimensions & styling
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
          height: 60,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: 20,
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
          <TabVectorIcon name={tabConfig.name} isFocused={isFocused} />
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: isFocused ? '#4F46E5' : '#94A3B8',
            marginTop: 2,
            letterSpacing: 0.2,
          }}
        >
          {isKn ? tabConfig.labelKn : tabConfig.labelEn}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
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
              height: 70,
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
          <View style={{ width: 60, alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => setShowCreateSheet(true)}
              activeOpacity={0.85}
              style={[
                {
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#6366F1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ translateY: -12 }],
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
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Line x1="12" y1="5" x2="12" y2="19" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
                <Line x1="5" y1="12" x2="19" y2="12" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Right Tabs (Real News & Rooms/Chats) */}
          {RIGHT_TABS.map((tab) => renderTab(tab))}
        </View>
      </View>

      {/* Unified Creation Sheet (One place to create Room, Photo News, or Spill Tea) */}
      <Modal visible={showCreateSheet} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowCreateSheet(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'flex-end',
            padding: 20,
            paddingBottom: 100,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 20,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                {isKn ? 'ಹೊಸದನ್ನು ರಚಿಸಿ ✨' : 'Create Something New ✨'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateSheet(false)}>
                <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              {/* Option 1: Create Adda Room (The ONE place to create room) */}
              <TouchableOpacity
                onPress={() => {
                  setShowCreateSheet(false);
                  router.push('/create-adda');
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: '#EEF2FF',
                  borderWidth: 1.5,
                  borderColor: '#C7D2FE',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#6366F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: '#FFFFFF' }}>🛖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                    {isKn ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ (Adda)' : 'Create New Room (Adda)'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    {isKn ? 'ಸ್ನೇಹಿತರೊಂದಿಗೆ ಹರಟೆ ಹೊಡೆಯಲು ಖಾಸಗಿ ಕೊಠಡಿ' : 'Start a private hangout room with invite code'}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: '#6366F1', fontWeight: '900' }}>›</Text>
              </TouchableOpacity>

              {/* Option 2: Share Photo News */}
              <TouchableOpacity
                onPress={() => {
                  setShowCreateSheet(false);
                  router.push('/(tabs)/chaos');
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: '#F0FDF4',
                  borderWidth: 1.5,
                  borderColor: '#BBF7D0',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#15803D',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: '#FFFFFF' }}>📷</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                    {isKn ? 'ಫೋಟೋ ಸುದ್ದಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Photo News'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    {isKn ? 'ಸ್ಥಳೀಯ ಅಥವಾ ಕಾಲೇಜು ಸುದ್ದಿ ಫೋಟೋ ಸಹಿತ' : 'Post verified news with photos & full details'}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: '#15803D', fontWeight: '900' }}>›</Text>
              </TouchableOpacity>

              {/* Option 3: Spill the Tea / Buzz */}
              <TouchableOpacity
                onPress={() => {
                  setShowCreateSheet(false);
                  router.push('/buzz/create');
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: '#FAF5FF',
                  borderWidth: 1.5,
                  borderColor: '#E9D5FF',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#7E22CE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 22, color: '#FFFFFF' }}>☕</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                    {isKn ? 'ಟೀ ಕುಡಿತಾ ಹರಟೆ ಅಥವಾ ಮತದಾನ' : 'Spill the Tea or Start a Poll'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    {isKn ? 'ಗುಪ್ತ ಕನ್ಫೆಷನ್ ಅಥವಾ ಸರ್ಕಲ್ ಮತದಾನ' : 'Confessions, polls, or juicy circle stories'}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: '#7E22CE', fontWeight: '900' }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
          title: isKn ? 'ರೂಮ್ಸ್ ಮತ್ತು ಚಾಟ್‌ಗಳು' : 'Rooms & Chats',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
          href: null,
        }}
      />
    </Tabs>
  );
}
