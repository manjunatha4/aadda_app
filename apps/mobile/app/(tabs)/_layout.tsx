import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, Text, Platform } from 'react-native';

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Let each screen have its custom styled header
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 20 : 24,
          left: 20,
          right: 20,
          backgroundColor: '#1C1C1F',
          borderRadius: 36,
          height: 64,
          paddingBottom: 0,
          paddingTop: 0,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: 480,
          alignSelf: 'center',
          marginHorizontal: 'auto' as any,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#71717A',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isKn ? 'ಇಂದು' : 'Today',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: focused ? '#2E2E33' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chaos"
        options={{
          title: isKn ? 'ಉಳಿಸಲಾಗಿದೆ' : 'Saved',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: focused ? '#2E2E33' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>📂</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: isKn ? 'ಚಾಟ್‌ಗಳು' : 'Chats',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: focused ? '#FF6464' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: focused ? '#FF6464' : 'transparent',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
              }}
            >
              <Text style={{ fontSize: 20 }}>💬</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: focused ? '#2E2E33' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
