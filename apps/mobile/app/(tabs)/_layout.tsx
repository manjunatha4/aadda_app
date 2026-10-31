import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const isKn = i18n.language === 'kn';

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#24183B' },
        headerTintColor: '#D9FF67',
        tabBarStyle: {
          backgroundColor: '#160E24',
          borderTopColor: '#352454',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#D9FF67',
        tabBarInactiveTintColor: '#8C7D9E',
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isKn ? 'ಅಡ್ಡಾಗಳು' : 'Addas',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🛖</Text>,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: isKn ? 'ಚಾಟ್‌ಗಳು' : 'Chats',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="chaos"
        options={{
          title: isKn ? 'ಕೇಯಾಸ್' : 'Chaos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔥</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👑</Text>,
        }}
      />

    </Tabs>
  );
}
