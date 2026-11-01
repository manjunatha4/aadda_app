import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';
import '../src/i18n';

// Ensure full white background across all web views and browsers
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    document.documentElement.style.backgroundColor = '#FFFFFF';
    document.body.style.backgroundColor = '#FFFFFF';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
  } catch (e) {
    // ignore
  }
}

const queryClient = new QueryClient();

export default function RootLayout() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="adda/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chaos/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="buzz/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="buzz/create" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="create-adda" options={{ headerShown: false }} />
        <Stack.Screen name="modal/vibe" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal/create-adda" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}

