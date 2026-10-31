import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';
import '../src/i18n';

const queryClient = new QueryClient();

export default function RootLayout() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B0B10' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="adda/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chaos/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="create-adda" options={{ headerShown: false }} />
        <Stack.Screen name="modal/vibe" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal/create-adda" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}

