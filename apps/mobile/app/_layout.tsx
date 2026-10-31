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
          headerStyle: { backgroundColor: '#24183B' },
          headerTintColor: '#D9FF67',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#24183B' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="adda/[id]"
          options={{ title: 'Adda Room', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{ title: 'Chat', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="chaos/[id]"
          options={{ title: 'Chaos Challenge', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="modal/vibe"
          options={{ presentation: 'modal', title: 'Vibe Check ⚡' }}
        />
        <Stack.Screen
          name="modal/create-adda"
          options={{ presentation: 'modal', title: 'Create Adda' }}
        />
      </Stack>
    </QueryClientProvider>
  );
}

