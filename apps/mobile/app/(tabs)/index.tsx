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
  InputField,
  EmptyState,
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
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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

  const handleJoinByCode = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setJoinStatus({
        type: 'error',
        message: isKn ? 'ದಯವಿಟ್ಟು ಕೊಠಡಿ ಕೋಡ್ ನಮೂದಿಸಿ' : 'Please enter room code',
      });
      return;
    }
    try {
      setJoining(true);
      setJoinStatus(null);
      const res = await api.post('/invitations/accept', { code });
      setJoinStatus({
        type: 'success',
        message: `Welcome to ${res.adda?.name || 'the Room'}! 🎉`,
      });
      setInviteCode('');
      await loadData();
      if (res.conversationId) {
        setTimeout(() => {
          router.push(`/chat/${res.conversationId}`);
        }, 800);
      }
    } catch (e: any) {
      setJoinStatus({
        type: 'error',
        message: e.message || (isKn ? 'ಅಮಾನ್ಯ ಕೊಠಡಿ ಕೋಡ್. ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Invalid Room Code. Please check the code and try again.'),
      });
    } finally {
      setJoining(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedId(id);
    setToastMessage(isKn ? 'ಕೋಡ್ ನಕಲಿಸಲಾಗಿದೆ!' : `Copied code ${code} to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
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

      {/* Top Header */}
      <PageHeader
        title={isKn ? 'ಇಂದು' : 'Dashboard'}
        subtitle={`${dateFormatted} · ${dayFormatted}`}
        badge={`${addas.length} ${isKn ? 'ರೂಮ್ಸ್' : 'rooms'}`}
        actions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SecondaryButton
              title={isKn ? 'ಡೈಲಿ ಕೆಯೋಸ್' : 'Daily Chaos'}
              icon="⚡"
              onPress={() => router.push('/(tabs)/chaos')}
            />
            <PrimaryButton
              title={isKn ? '+ ಹೊಸ ರೂಮ್' : '+ Create Room'}
              icon="🛖"
              onPress={() => router.push('/create-adda')}
            />
          </View>
        }
      />

      {/* Hero Welcome Glass Card */}
      <GlassCard elevated style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: DS_TOKENS.colors.purpleLight,
                borderWidth: 1.5,
                borderColor: DS_TOKENS.colors.purpleBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>👋</Text>
            </View>
            <View>
              <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '900' }}>
                {isKn ? `ನಮಸ್ಕಾರ, ${displayName}!` : `Welcome back, ${displayName}!`}
              </Text>
              <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                {isKn ? 'ನಿಮ್ಮ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಸಂಪರ್ಕದಲ್ಲಿರಿ ಮತ್ತು ವೈಬ್ ಹಂಚಿಕೊಳ್ಳಿ' : 'Real-time hangouts and collaborative daily chaos'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick action buttons row */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chaos')}
            style={{
              backgroundColor: DS_TOKENS.colors.purpleLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.purpleBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>⚡</Text>
            <Text style={{ color: DS_TOKENS.colors.purple, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಡೈಲಿ ಕೆಯೋಸ್ ಟಾಸ್ಕ್ ಟ್ರ್ಯಾಕರ್' : 'Daily Chaos Tasks'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chats')}
            style={{
              backgroundColor: DS_TOKENS.colors.skyLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.skyBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>💬</Text>
            <Text style={{ color: DS_TOKENS.colors.sky, fontSize: 12, fontWeight: '800' }}>
              {isKn ? 'ಸಕ್ರಿಯ ಚಾಟ್‌ಗಳು' : 'Active Chats'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={{
              backgroundColor: DS_TOKENS.colors.emeraldLight,
              borderWidth: 1,
              borderColor: DS_TOKENS.colors.emeraldBorder,
              borderRadius: DS_TOKENS.radii.pill,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>📍</Text>
            <Text style={{ color: DS_TOKENS.colors.emerald, fontSize: 12, fontWeight: '800' }}>
              {user?.district || 'Bengaluru'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Secret Invite Code Join Box */}
      <GlassCard style={{ marginBottom: 20 }}>
        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 10 }}>
          🔑 {isKn ? 'ಸೀಕ್ರೆಟ್ ಕೋಡ್ ಮೂಲಕ ರೂಮ್‌ಗೆ ಸೇರಿ' : 'Join a Room with Secret Code'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <InputField
              value={inviteCode}
              onChangeText={(txt) => setInviteCode(txt.toUpperCase())}
              placeholder={isKn ? 'ಕೋಡ್ ನಮೂದಿಸಿ (ಉದಾ: ADDA-XYZ)' : 'Enter Code (e.g. ADDA-XYZ)'}
              autoCapitalize="characters"
              style={{ marginBottom: 0 }}
            />
          </View>
          <PrimaryButton
            title={joining ? '...' : (isKn ? 'ಸೇರಿ' : 'Join')}
            onPress={handleJoinByCode}
            disabled={joining}
            style={{ paddingVertical: 11 }}
          />
        </View>

        {joinStatus && (
          <Text
            style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: '700',
              color: joinStatus.type === 'success' ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.rose,
            }}
          >
            {joinStatus.message}
          </Text>
        )}
      </GlassCard>

      {/* Active Rooms Section */}
      <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '900' }}>
          {isKn ? 'ನಿಮ್ಮ ರೂಮ್ಸ್‌ಗಳು' : 'Your Rooms & Addas'}
        </Text>
        <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
          {addas.length} {isKn ? 'ಸಕ್ರಿಯ' : 'active'}
        </Text>
      </View>

      {loading ? (
        <LoadingState message={isKn ? 'ರೂಮ್ಸ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading your rooms...'} />
      ) : addas.length === 0 ? (
        <EmptyState
          icon="🛖"
          title={isKn ? 'ಯಾವುದೇ ರೂಮ್ ಇಲ್ಲ' : 'No rooms joined yet'}
          description={
            isKn
              ? 'ಹೊಸ ರೂಮ್ ರಚಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಸ್ನೇಹಿತರು ಹಂಚಿಕೊಂಡ ಕೋಡ್ ಬಳಸಿ ಸೇರಿ!'
              : 'Create your first room or join one using an invite code shared by friends!'
          }
          actionLabel={isKn ? '+ ಹೊಸ ರೂಮ್ ರಚಿಸಿ' : '+ Create Your First Room'}
          onAction={() => router.push('/create-adda')}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {addas.map((adda) => (
            <GlassCard
              key={adda.id}
              onPress={() => {
                if (adda.conversationId) {
                  router.push(`/chat/${adda.conversationId}`);
                } else {
                  router.push(`/adda/${adda.id}`);
                }
              }}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: DS_TOKENS.colors.bgSecondary,
                      borderWidth: 1,
                      borderColor: DS_TOKENS.colors.borderSubtle,
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
                    <Text numberOfLines={1} style={{ color: DS_TOKENS.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
                      {adda.name}
                    </Text>
                    <Text style={{ color: DS_TOKENS.colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                      👥 {adda.memberCount || 1} {isKn ? 'ಸದಸ್ಯರು' : 'members'}
                    </Text>
                  </View>
                </View>

                {/* Invite Code Badge & Copy */}
                {Boolean(adda.inviteCode) && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      copyCode(adda.inviteCode, adda.id);
                    }}
                    style={{
                      backgroundColor: copiedId === adda.id ? DS_TOKENS.colors.emeraldLight : DS_TOKENS.colors.bgSecondary,
                      borderWidth: 1,
                      borderColor: copiedId === adda.id ? DS_TOKENS.colors.emeraldBorder : DS_TOKENS.colors.borderSubtle,
                      borderRadius: DS_TOKENS.radii.pill,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: copiedId === adda.id ? DS_TOKENS.colors.emerald : DS_TOKENS.colors.textPrimary, fontSize: 11, fontWeight: '800' }}>
                      {copiedId === adda.id ? '✓ COPIED' : `🔑 ${adda.inviteCode}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </MainLayout>
  );
}
