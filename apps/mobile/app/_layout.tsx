import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores/authStore';
import '../src/i18n';

// Ensure full white background and typography across all web views and browsers
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  try {
    document.documentElement.style.backgroundColor = '#FFFFFF';
    document.body.style.backgroundColor = '#FFFFFF';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Inject Google Fonts preconnect and stylesheet
    if (!document.getElementById('aadda-google-fonts')) {
      const preconnect1 = document.createElement('link');
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);

      const preconnect2 = document.createElement('link');
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect2);

      const fontLink = document.createElement('link');
      fontLink.id = 'aadda-google-fonts';
      fontLink.rel = 'stylesheet';
      fontLink.href =
        'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap';
      document.head.appendChild(fontLink);
    }

    // Inject centralized font-family variables & global application typography rules
    if (!document.getElementById('aadda-font-variables')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'aadda-font-variables';
      styleEl.textContent = `
        :root {
          --font-heading: 'Space Grotesk', sans-serif;
          --font-body: 'Inter', sans-serif;
          --font-mono: 'Space Mono', monospace;
        }

        /* Default application text to Inter */
        html, body, #root, input, textarea, select, button {
          font-family: var(--font-body);
        }

        /* React Native Web default text elements inherit Inter */
        div[dir="auto"], span[dir="auto"], [dir="ltr"], [dir="rtl"], .css-text-146c351 {
          font-family: var(--font-body);
        }

        /* Headings: Space Grotesk */
        h1, h2, h3, h4, h5, h6,
        [data-font="heading"],
        .font-heading {
          font-family: var(--font-heading) !important;
        }

        /* Body & general content: Inter */
        p,
        [data-font="body"],
        .font-body {
          font-family: var(--font-body) !important;
        }

        /* Monospace elements, technical labels, counters, timestamps, badges: Space Mono */
        code, pre, kbd, samp,
        [data-font="mono"],
        .font-mono,
        .badge-mono,
        .timestamp,
        .counter {
          font-family: var(--font-mono) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  } catch (e) {
    // ignore
  }
}

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === '(auth)' || segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: '#4F46E5',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 32, color: '#FFFFFF' }}>⚡</Text>
        </View>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AuthGuard>
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
          <Stack.Screen name="logout" options={{ headerShown: false }} />
          <Stack.Screen name="modal/vibe" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="modal/create-adda" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthGuard>
    </QueryClientProvider>
  );
}
