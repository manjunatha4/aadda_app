import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  MainLayout,
  PageHeader,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  LoadingState,
  ToastNotification,
  DS_TOKENS,
} from '../../src/components/DesignSystem';

export default function TodayScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [addas, setAddas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isKn = i18n.language === 'kn';

  // Format dynamic date
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayFormatted = now.toLocaleDateString('en-US', { weekday: 'long' });

  const loadData = async () => {
    try {
      const addasRes = await api.get('/addas').catch(() => []);
      setAddas(addasRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const displayName = user?.displayName || user?.username || 'Friend';

  return (
    <MainLayout
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DS_TOKENS.colors.purple} />
      }
    >
      <ToastNotification
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Top Header - Pure Dashboard & Hangout Hub */}
      <PageHeader
        title={isKn ? 'ಇಂದು' : 'Dashboard'}
        subtitle={`${dateFormatted} · ${dayFormatted}`}
        badge={`📍 ${user?.district || 'Bengaluru'}`}
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SecondaryButton
              title={isKn ? 'ಸುದ್ದಿ ಫೀಡ್' : 'News Feed'}
              icon="📰"
              onPress={() => router.push('/(tabs)/chaos')}
            />
            <PrimaryButton
              title={isKn ? 'ಅಡ್ಡ ಬಜ್' : 'Adda Buzz'}
              icon="🔥"
              onPress={() => router.push('/(tabs)/buzz')}
            />
          </View>
        }
      />

      {/* Hero Welcome Glass Card */}
      <GlassCard elevated style={{ marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#EEF2FF',
              borderWidth: 1.5,
              borderColor: '#C7D2FE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>👋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: '900' }}>
              {isKn ? `ನಮಸ್ಕಾರ, ${displayName}!` : `Welcome back, ${displayName}!`}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
              {isKn
                ? 'ನಿಮ್ಮ ಖಾಸಗಿ ಅಡ್ಡ ವೃತ್ತ ಮತ್ತು ಇಂದಿನ ಸುದ್ದಿ ಕೇಂದ್ರ'
                : 'Your private circle hangout & real-time updates hub'}
            </Text>
          </View>
        </View>

        {/* Quick Navigation Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chaos')}
            activeOpacity={0.75}
            style={{
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>📰</Text>
            <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ನೈಜ ಫೋಟೋ ಸುದ್ದಿ' : 'Real Photo News'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/buzz')}
            activeOpacity={0.75}
            style={{
              backgroundColor: '#FAF5FF',
              borderWidth: 1,
              borderColor: '#E9D5FF',
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>☕</Text>
            <Text style={{ color: '#7E22CE', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಟೀ ಕುಡಿತಾ ಹರಟೆ & ಮತದಾನ' : 'Spill Tea & Polls'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chats')}
            activeOpacity={0.75}
            style={{
              backgroundColor: '#ECFDF5',
              borderWidth: 1,
              borderColor: '#A7F3D0',
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>💬</Text>
            <Text style={{ color: '#047857', fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ರೂಮ್ಸ್ ಮತ್ತು ಚಾಟ್' : 'Rooms & Chats'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Unified Link to Rooms & Chats Banner */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/chats')}
        activeOpacity={0.85}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: '#E2E8F0',
          padding: 16,
          marginBottom: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>🛖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
              {isKn ? 'ರೂಮ್‌ಗಳು ಮತ್ತು ಸೀಕ್ರೆಟ್ ಕೋಡ್' : 'Your Hangout Rooms & Chats'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 }}>
              {isKn
                ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಲು ಅಥವಾ ಕೋಡ್ ಬಳಸಿ ಸೇರಲು ಇಲ್ಲಿ ಟ್ಯಾಪ್ ಮಾಡಿ'
                : 'Create new rooms or join friends using a secret invite code'}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 20, color: '#6366F1', fontWeight: '900' }}>›</Text>
      </TouchableOpacity>

      {/* Primary Active Room Quick Launcher */}
      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '900' }}>
          {isKn ? 'ಸಕ್ರಿಯ ರೂಮ್ ಕ್ವಿಕ್ ಲಾಂಚರ್' : 'Quick Room Launcher'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
          <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '800' }}>
            {isKn ? 'ಎಲ್ಲಾ ರೂಮ್‌ಗಳು ›' : 'View All Rooms ›'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState message={isKn ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading active rooms...'} />
      ) : addas.length === 0 ? (
        <GlassCard style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🛖</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            {isKn ? 'ಯಾವುದೇ ರೂಮ್ ಸೇರಿಲ್ಲ' : 'No active rooms yet'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
            {isKn ? 'ರೂಮ್ಸ್ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಹೊಸ ರೂಮ್ ರಚಿಸಿ ಅಥವಾ ಸೇರಿ!' : 'Hop into the Rooms & Chats tab to create or join!'}
          </Text>
          <PrimaryButton
            title={isKn ? 'ರೂಮ್ಸ್ ಮತ್ತು ಚಾಟ್‌ಗೆ ಹೋಗಿ 💬' : 'Go to Rooms & Chats 💬'}
            onPress={() => router.push('/(tabs)/chats')}
            style={{ marginTop: 14 }}
          />
        </GlassCard>
      ) : (
        <View style={{ gap: 10, paddingBottom: 110 }}>
          {addas.slice(0, 3).map((adda) => (
            <GlassCard
              key={adda.id}
              onPress={() => {
                if (adda.conversationId) {
                  router.push(`/chat/${adda.conversationId}`);
                } else {
                  router.push(`/adda/${adda.id}`);
                }
              }}
              style={{ padding: 14 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {adda.name?.match(/[\p{Emoji}\u200d]+/gu)?.[0] || '🛖'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: '#0F172A', fontSize: 15, fontWeight: '800' }}>
                      {adda.name}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                      👥 {adda.memberCount || 1} {isKn ? 'ಸದಸ್ಯರು' : 'members'} · Active now
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: '#EEF2FF',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>Open 💬</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </MainLayout>
  );
}
